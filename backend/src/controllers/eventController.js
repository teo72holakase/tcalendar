const Event = require('../models/Event');
const Group = require('../models/Group');

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
      .sort({ dueDate: 1 });

    res.json(events);
  } catch (error) {
    console.error('Error getEvents:', error);
    res.status(500).json({ message: 'Error al obtener eventos', error: error.message });
  }
};

const createEvent = async (req, res) => {
  try {
    const { title, description, topics, assignedBy, dueDate, requestedDate } = req.body;
    const groupId = req.params.groupId || req.body.groupId;

    if (!title || !dueDate) {
      return res.status(400).json({ message: 'El título y la fecha son obligatorios' });
    }
    if (!groupId) {
      return res.status(400).json({ message: 'El grupo es obligatorio' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'No tenés acceso a este grupo' });

    const parsedDueDate = parseDate(dueDate);
    const parsedRequestedDate = requestedDate ? parseDate(requestedDate) : null;

    const event = new Event({
      title,
      description,
      topics,
      assignedBy,
      dueDate: parsedDueDate,
      requestedDate: parsedRequestedDate,
      group: groupId,
      createdBy: req.user._id,
    });

    await event.save();
    await event.populate('createdBy', 'username');
    await event.populate('group', 'name');

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

    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el creador puede eliminar el evento' });
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

    const events = await Event.find({ group: req.params.groupId })
      .populate('createdBy', 'username')
      .sort({ dueDate: 1 });

    res.json(events);
  } catch (error) {
    console.error('Error getGroupEvents:', error);
    res.status(500).json({ message: 'Error al obtener eventos del grupo', error: error.message });
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

    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el creador puede cambiar el color' });
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
  getGroupEvents,
  getUpcomingEvents,
  updateEventColor,
};