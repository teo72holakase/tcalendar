const Event = require('../models/Event');
const Group = require('../models/Group');

// GET /events  (eventos del usuario o del grupo)
const getEvents = async (req, res) => {
  try {
    const { groupId } = req.query;

    let filter = {};

    if (groupId) {
      // Verificar que el usuario es miembro del grupo
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

      // FIX: era req.userId
      const isMember = group.members.some(m => m.toString() === req.user._id.toString());
      if (!isMember) return res.status(403).json({ message: 'No tenés acceso a este grupo' });

      filter.group = groupId;
    } else {
      // FIX: era req.userId
      filter.creator = req.user._id;
    }

    const events = await Event.find(filter)
      .populate('creator', 'username')
      .populate('group', 'name')
      .sort({ date: 1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener eventos', error: error.message });
  }
};

// POST /events  o  POST /groups/:groupId/events
const createEvent = async (req, res) => {
  try {
    const { title, description, date, time } = req.body;
    // groupId puede venir de la ruta (/groups/:groupId/events) o del body
    const groupId = req.params.groupId || req.body.groupId;

    if (!title || !date) {
      return res.status(400).json({ message: 'El título y la fecha son obligatorios' });
    }

    const eventData = {
      title,
      description,
      date,
      time,
      creator: req.user._id,
    };

    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

      const isMember = group.members.some(m => m.toString() === req.user._id.toString());
      if (!isMember) return res.status(403).json({ message: 'No tenés acceso a este grupo' });

      eventData.group = groupId;
    }

    const event = new Event(eventData);
    await event.save();
    await event.populate('creator', 'username');
    if (event.group) await event.populate('group', 'name');

    res.status(201).json(event);
  } catch (error) {
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

    // FIX: era req.userId
    const isCreator = event.creator._id.toString() === req.user._id.toString();
    const isGroupMember =
      event.group &&
      event.group.members.some(m => m.toString() === req.user._id.toString());

    if (!isCreator && !isGroupMember) {
      return res.status(403).json({ message: 'No tenés acceso a este evento' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener evento', error: error.message });
  }
};

// PUT /events/:id
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Evento no encontrado' });

    // FIX: era req.userId
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el creador puede editar el evento' });
    }

    const { title, description, date, time } = req.body;
    if (title) event.title = title;
    if (description !== undefined) event.description = description;
    if (date) event.date = date;
    if (time !== undefined) event.time = time;

    await event.save();
    await event.populate('creator', 'username');

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar evento', error: error.message });
  }
};

// DELETE /events/:id
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Evento no encontrado' });

    // FIX: era req.userId
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el creador puede eliminar el evento' });
    }

    // FIX: event.remove() está deprecado en Mongoose 7+ → usar deleteOne()
    await event.deleteOne();

    res.json({ message: 'Evento eliminado' });
  } catch (error) {
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