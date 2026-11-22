const Event = require('../models/Event');
const Group = require('../models/Group');
const GroupResource = require('../models/GroupResource');
const mongoose = require('mongoose');
const { buildIcs } = require('../utils/ics');

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const validWebUrl = (value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
};

const validateEventAttachments = async (groupId, resourceIds, resourceLinks) => {
  if (!Array.isArray(resourceIds) || resourceIds.length > 20 || resourceIds.some((id) => !mongoose.isValidObjectId(id))) {
    return { error: 'La lista de recursos no es válida' };
  }
  if (!Array.isArray(resourceLinks) || resourceLinks.length > 10) {
    return { error: 'Podés adjuntar hasta 10 enlaces' };
  }
  const ids = [...new Set(resourceIds.map(String))];
  if (ids.length) {
    const found = await GroupResource.find({ group: groupId, _id: { $in: ids } }).select('_id').lean();
    if (found.length !== ids.length) return { error: 'Uno o más recursos no pertenecen a este grupo' };
  }
  const links = [];
  for (const link of resourceLinks) {
    if (!link || typeof link.title !== 'string' || !link.title.trim() || link.title.trim().length > 120 ||
        typeof link.url !== 'string' || link.url.length > 2048 || !validWebUrl(link.url)) {
      return { error: 'Revisá el título y el enlace de los recursos adjuntos' };
    }
    links.push({ title: link.title.trim(), url: link.url.trim() });
  }
  return { resources: ids, resourceLinks: links };
};

// El creador del evento o el creador del grupo pueden modificarlo/borrarlo (igual que muestra la UI).
const canManageEvent = async (event, userId) => {
  if (event.createdBy.toString() === userId.toString()) return true;
  const group = await Group.findById(event.group).select('creator');
  return Boolean(group) && group.creator.toString() === userId.toString();
};

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === 'string' && dateStr.length === 10) {
    return new Date(`${dateStr}T12:00:00.000Z`);
  }
  if (typeof dateStr === 'string') {
    return new Date(dateStr);
  }
  return new Date(dateStr);
};

const getEvents = async (req, res) => {
  try {
    const { groupId } = req.query;
    let filter = {};

    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
      const isMember = group.members.some(m => m.toString() === req.user._id.toString());
      if (!isMember) return res.status(403).json({ message: 'No tenés acceso a este grupo' });
      filter.group = groupId;
    } else {
      filter.createdBy = req.user._id;
    }

    const events = await Event.find(filter)
      .populate('createdBy', 'username')
      .populate('group', 'name')
      .populate('resources', 'title url fileType')
      .sort({ dueDate: 1 });

    res.json(events);
  } catch (error) {
    console.error('Error getEvents:', error);
    res.status(500).json({ message: 'Error al obtener eventos', error: error.message });
  }
};

const createEvent = async (req, res) => {
  try {
    const { title, description, topics, assignedBy, dueDate, requestedDate, color, resources = [], resourceLinks = [] } = req.body;
    const groupId = req.params.groupId || req.body.groupId;

    if (!title || !dueDate) {
      return res.status(400).json({ message: 'El título y la fecha son obligatorios' });
    }
    if (!groupId) {
      return res.status(400).json({ message: 'El grupo es obligatorio' });
    }
    if (String(title).length > 120) {
      return res.status(400).json({ message: 'El título es demasiado largo (máx. 120 caracteres)' });
    }
    if (color !== undefined && !HEX_COLOR.test(color)) {
      return res.status(400).json({ message: 'Color no válido' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'No tenés acceso a este grupo' });

    const attachments = await validateEventAttachments(groupId, resources, resourceLinks);
    if (attachments.error) return res.status(400).json({ message: attachments.error });

    const parsedDueDate = parseDate(dueDate);
    const parsedRequestedDate = requestedDate ? parseDate(requestedDate) : null;
    if (Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({ message: 'La fecha no es válida' });
    }

    const event = new Event({
      title,
      description,
      topics,
      assignedBy,
      dueDate: parsedDueDate,
      requestedDate: parsedRequestedDate,
      ...(color && { color }),
      resources: attachments.resources,
      resourceLinks: attachments.resourceLinks,
      group: groupId,
      createdBy: req.user._id,
    });

    await event.save();
    await event.populate('createdBy', 'username');
    await event.populate('group', 'name');
    await event.populate('resources', 'title url fileType');

    res.status(201).json(event);
  } catch (error) {
    console.error('Error createEvent:', error);
    res.status(500).json({ message: 'Error al crear evento', error: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Evento no encontrado' });

    if (!(await canManageEvent(event, req.user._id))) {
      return res.status(403).json({ message: 'Solo el creador del evento o del grupo puede eliminarlo' });
    }

    await event.deleteOne();
    res.json({ message: 'Evento eliminado' });
  } catch (error) {
    console.error('Error deleteEvent:', error);
    res.status(500).json({ message: 'Error al eliminar evento', error: error.message });
  }
};

const getGroupEvents = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'No tenés acceso a este grupo' });

    // ?from=&to= (ISO): el calendario pide solo el rango visible en vez de todos los eventos del grupo
    const filter = { group: req.params.groupId };
    const range = {};
    if (req.query.from) range.$gte = new Date(req.query.from);
    if (req.query.to) range.$lte = new Date(req.query.to);
    if (Object.values(range).some((d) => Number.isNaN(d.getTime()))) {
      return res.status(400).json({ message: 'Rango de fechas no válido' });
    }
    if (Object.keys(range).length) filter.dueDate = range;
    const search = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 60) : '';
    if (search) {
      const matches = [{ title: { $regex: `^${escapeRegex(search)}`, $options: 'i' } }];
      if (/^[a-f\d]{24}$/i.test(search)) matches.push({ _id: new mongoose.Types.ObjectId(search) });
      filter.$or = matches;
    }

    let query = Event.find(filter)
      .populate('createdBy', 'username')
      .populate('resources', 'title url fileType')
      .sort({ dueDate: 1 });
    if (search) query = query.limit(8);
    const events = await query;

    res.json(events);
  } catch (error) {
    console.error('Error getGroupEvents:', error);
    res.status(500).json({ message: 'Error al obtener eventos del grupo', error: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Evento no encontrado' });
    if (!(await canManageEvent(event, req.user._id))) {
      return res.status(403).json({ message: 'Solo el creador del evento o del grupo puede editarlo' });
    }

    const { title, description, topics, dueDate, color, resources, resourceLinks } = req.body;
    if (title !== undefined) {
      if (!String(title).trim() || String(title).length > 120) {
        return res.status(400).json({ message: 'El título es obligatorio (máx. 120 caracteres)' });
      }
      event.title = title;
    }
    if (description !== undefined) event.description = description;
    if (topics !== undefined) event.topics = topics;
    if (color !== undefined) {
      if (!HEX_COLOR.test(color)) return res.status(400).json({ message: 'Color no válido' });
      event.color = color;
    }
    if (dueDate !== undefined) {
      const parsed = parseDate(dueDate);
      if (!parsed || Number.isNaN(parsed.getTime())) return res.status(400).json({ message: 'La fecha no es válida' });
      event.dueDate = parsed;
      event.reminded = false; // si cambia el día, corresponde un nuevo recordatorio
    }
    if (resources !== undefined || resourceLinks !== undefined) {
      const attachments = await validateEventAttachments(
        event.group,
        resources ?? event.resources.map((resource) => resource._id || resource),
        resourceLinks ?? event.resourceLinks,
      );
      if (attachments.error) return res.status(400).json({ message: attachments.error });
      event.resources = attachments.resources;
      event.resourceLinks = attachments.resourceLinks;
    }

    await event.save();
    await event.populate('createdBy', 'username');
    await event.populate('resources', 'title url fileType');
    res.json(event);
  } catch (error) {
    console.error('Error updateEvent:', error);
    res.status(500).json({ message: 'Error al actualizar evento', error: error.message });
  }
};

const exportGroupIcs = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
    if (!group.members.some((m) => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'No tenés acceso a este grupo' });
    }
    const events = await Event.find({ group: group._id }).sort({ dueDate: 1 });
    const filename = group.name.replace(/[^\w.-]+/g, '_').slice(0, 40) || 'tcalendar';
    res
      .type('text/calendar; charset=utf-8')
      .set('Content-Disposition', `attachment; filename="${filename}.ics"`)
      .send(buildIcs(events, group.name));
  } catch (error) {
    console.error('Error exportGroupIcs:', error);
    res.status(500).json({ message: 'Error al exportar el calendario' });
  }
};

const getUpcomingEvents = async (req, res) => {
  try {
    const now = new Date();
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
    const to   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 3, 23, 59, 59));

    const groups = await Group.find({ members: req.user._id }).select('_id');
    const groupIds = groups.map(g => g._id);

    const events = await Event.find({
      group:   { $in: groupIds },
      dueDate: { $gte: from, $lte: to },
    })
      .populate('group', 'name _id')
      .populate('createdBy', 'username')
      .populate('resources', 'title url fileType')
      .sort({ dueDate: 1 })
      .limit(10);

    res.json(events);
  } catch (error) {
    console.error('Error getUpcomingEvents:', error);
    res.status(500).json({ message: 'Error al obtener eventos próximos', error: error.message });
  }
};

const updateEventColor = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Evento no encontrado' });

    if (!(await canManageEvent(event, req.user._id))) {
      return res.status(403).json({ message: 'Solo el creador del evento o del grupo puede cambiar el color' });
    }
    if (!HEX_COLOR.test(req.body.color)) {
      return res.status(400).json({ message: 'Color no válido' });
    }

    event.color = req.body.color;
    await event.save();
    res.json(event);
  } catch (error) {
    console.error('Error updateEventColor:', error);
    res.status(500).json({ message: 'Error al actualizar color', error: error.message });
  }
};

module.exports = {
  getEvents,
  createEvent,
  deleteEvent,
  updateEvent,
  exportGroupIcs,
  getGroupEvents,
  getUpcomingEvents,
  updateEventColor,
};