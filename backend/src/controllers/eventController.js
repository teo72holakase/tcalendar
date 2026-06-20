const Event = require('../models/Event');
const Group = require('../models/Group');

// GET /events
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
      filter.creator = req.user._id;
    }

    const events = await Event.find(filter)
      .populate('creator', 'username')
      .populate('group', 'name')
      .sort({ date: 1 });

    res.json(events);
  } catch (error) {
    console.error('Error getEvents:', error);
    res.status(500).json({ message: 'Error al obtener eventos', error: error.message });
  }
};

// POST /events  o  POST /groups/:groupId/events
const createEvent = async (req, res) => {
  try {
    const { title, description, topics, assignedBy, date, time, requestedDate } = req.body;
    const groupId = req.params.groupId || req.body.groupId;

    if (!title || !date) {
      return res.status(400).json({ message: 'El título y la fecha son obligatorios' });
    }

    if (!groupId) {
      return res.status(400).json({ message: 'El grupo es obligatorio' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'No tenés acceso a este grupo' });

    const event = new Event({
      title,
      description,
      topics,
      assignedBy,
      date,
      time,
      requestedDate,
      group: groupId,
      creator: req.user._id,
    });

    await event.save();
    await event.populate('creator', 'username');
    await event.populate('group', 'name');

    res.status(201).json(event);
  } catch (error) {
    console.error('Error createEvent:', error);
    res.status(500).json({ message: 'Error al crear evento', error: error.message });
  }
};

// GET /events/:id
const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'username')
      .populate('group', 'name members');

    if (!event) return res.status(404).json({ message: 'Evento no encontrado' });

    const isCreator = event.creator._id.toString() === req.user._id.toString();
    const isGroupMember = event.group && event.group.members.some(m => m.toString() === req.user._id.toString());

    if (!isCreator && !isGroupMember) {
      return res.status(403).json({ message: 'No tenés acceso a este evento' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error getEvent:', error);
    res.status(500).json({ message: 'Error al obtener evento', error: error.message });
  }
};

// PUT /events/:id
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Evento no encontrado' });

    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el creador puede editar el evento' });
    }

    const { title, description, topics, assignedBy, date, time, requestedDate } = req.body;
    if (title) event.title = title;
    if (description !== undefined) event.description = description;
    if (topics !== undefined) event.topics = topics;
    if (assignedBy !== undefined) event.assignedBy = assignedBy;
    if (date) event.date = date;
    if (time !== undefined) event.time = time;
    if (requestedDate !== undefined) event.requestedDate = requestedDate;

    await event.save();
    await event.populate('creator', 'username');

    res.json(event);
  } catch (error) {
    console.error('Error updateEvent:', error);
    res.status(500).json({ message: 'Error al actualizar evento', error: error.message });
  }
};

// DELETE /events/:eventId
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Evento no encontrado' });

    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el creador puede eliminar el evento' });
    }

    await event.deleteOne();
    res.json({ message: 'Evento eliminado' });
  } catch (error) {
    console.error('Error deleteEvent:', error);
    res.status(500).json({ message: 'Error al eliminar evento', error: error.message });
  }
};

// GET /groups/:groupId/events
const getGroupEvents = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'No tenés acceso a este grupo' });

    const events = await Event.find({ group: req.params.groupId })
      .populate('creator', 'username')
      .sort({ date: 1 });

    res.json(events);
  } catch (error) {
    console.error('Error getGroupEvents:', error);
    res.status(500).json({ message: 'Error al obtener eventos del grupo', error: error.message });
  }
};

module.exports = {
  getEvents,
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  getGroupEvents,
};