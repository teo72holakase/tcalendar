const Event = require('../models/Event');
const Group = require('../models/Group');

exports.createEvent = async (req, res) => {
  const { groupId } = req.params;
  const { title, description, topics, assignedBy, dueDate, requestedDate } = req.body;

  if (!title || !dueDate) {
    return res.status(400).json({ message: 'Título y fecha de entrega son requeridos' });
  }

  const group = await Group.findById(groupId);
  if (!group) {
    return res.status(404).json({ message: 'Grupo no encontrado' });
  }

  if (!group.members.includes(req.user._id)) {
    return res.status(403).json({ message: 'No autorizado' });
  }

  const event = await Event.create({
    title,
    description: description || '',
    topics: topics || '',
    assignedBy: assignedBy || '',
    dueDate,
    requestedDate: requestedDate || null,
    group: group._id,
    createdBy: req.user._id,
  });

  res.status(201).json(event);
};

exports.getGroupEvents = async (req, res) => {
  const { groupId } = req.params;
  const group = await Group.findById(groupId);
  if (!group) {
    return res.status(404).json({ message: 'Grupo no encontrado' });
  }

  if (!group.members.includes(req.user._id)) {
    return res.status(403).json({ message: 'No autorizado' });
  }

  const events = await Event.find({ group: group._id }).sort({ dueDate: 1 }).populate('createdBy', 'username');
  res.json(events);
};

exports.deleteEvent = async (req, res) => {
  const { eventId } = req.params;
  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({ message: 'Evento no encontrado' });
  }

  if (!event.createdBy.equals(req.user._id)) {
    return res.status(403).json({ message: 'Solo el creador puede eliminar el evento' });
  }

  await event.remove();
  res.json({ message: 'Evento eliminado correctamente' });
};
