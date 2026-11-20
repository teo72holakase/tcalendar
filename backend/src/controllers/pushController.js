const crypto = require('crypto');
const webpush = require('web-push');
const Event = require('../models/Event');
const PushSubscription = require('../models/PushSubscription');

const configured = () => Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
if (configured()) {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
}

// Eventos con fecha "mañana" (UTC), igual que se guardan las fechas (12:00 UTC).
const tomorrowRangeUTC = (now = new Date()) => {
  const y = now.getUTCFullYear(), m = now.getUTCMonth(), d = now.getUTCDate();
  return { from: new Date(Date.UTC(y, m, d + 1)), to: new Date(Date.UTC(y, m, d + 2) - 1) };
};

const getKey = (req, res) => {
  if (!configured()) return res.status(404).json({ message: 'Notificaciones no configuradas' });
  res.json({ key: process.env.VAPID_PUBLIC_KEY });
};

const subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (typeof endpoint !== 'string' || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'Suscripción no válida' });
    }
    await PushSubscription.findOneAndUpdate({ endpoint }, { user: req.user._id, keys }, { upsert: true });
    res.status(201).json({ message: 'Recordatorios activados' });
  } catch (error) {
    console.error('Error subscribe:', error);
    res.status(500).json({ message: 'Error al activar recordatorios' });
  }
};

const unsubscribe = async (req, res) => {
  try {
    await PushSubscription.deleteOne({ endpoint: String(req.body.endpoint), user: req.user._id });
    res.json({ message: 'Recordatorios desactivados' });
  } catch (error) {
    console.error('Error unsubscribe:', error);
    res.status(500).json({ message: 'Error al desactivar recordatorios' });
  }
};

// Lo llama un cron externo (p. ej. cron-job.org) una vez al día. Render gratis duerme el servidor,
// así que un temporizador interno no es confiable; la propia llamada del cron lo despierta.
const runReminders = async (req, res) => {
  try {
    const sent = req.get('x-cron-key') || '';
    const expected = process.env.CRON_KEY || '';
    const ok = expected && sent.length === expected.length && crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(expected));
    if (!ok) return res.status(401).json({ message: 'No autorizado' });
    if (!configured()) return res.status(503).json({ message: 'Notificaciones no configuradas' });

    const { from, to } = tomorrowRangeUTC();
    const events = await Event.find({ dueDate: { $gte: from, $lte: to }, reminded: { $ne: true } }).populate('group', 'name members');

    let sentCount = 0;
    for (const event of events) {
      if (!event.group) continue;
      const subs = await PushSubscription.find({ user: { $in: event.group.members } });
      const payload = JSON.stringify({ title: `Mañana: ${event.title}`, body: event.group.name, url: `/group/${event.group._id}` });
      const results = await Promise.allSettled(subs.map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload)));
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') sentCount += 1;
        else if ([404, 410].includes(r.reason?.statusCode)) PushSubscription.deleteOne({ _id: subs[i]._id }).catch(() => {}); // suscripción vencida
      });
      event.reminded = true;
      await event.save();
    }
    res.json({ events: events.length, sent: sentCount });
  } catch (error) {
    console.error('Error runReminders:', error);
    res.status(500).json({ message: 'Error al enviar recordatorios' });
  }
};

module.exports = { getKey, subscribe, unsubscribe, runReminders, tomorrowRangeUTC };
