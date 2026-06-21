const Event = require('../models/Event');
const Group = require('../models/Group');

// ✅ FORZAR FECHA EN UTC
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  
  // Si es "2026-06-24" (string de 10 caracteres)
  if (typeof dateStr === 'string' && dateStr.length === 10) {
    return new Date(`${dateStr}T12:00:00.000Z`);
  }
  
  // Si es ISO, forzar UTC
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
    const { title, description, topics, assignedBy, dueDate, requestedDate, color } = req.body;
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
      color: color || '#A2CFFE',
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

// ✅ ACTUALIZAR COLOR - CON LOGS PARA DEPURAR
const updateEventColor = async (req, res) => {
  try {
    console.log('📡 Petición de color recibida');
    console.log('👤 Usuario ID:', req.user._id);
    
    const { eventId } = req.params;
    const { color } = req.body;

    console.log('📦 Evento ID:', eventId);
    console.log('🎨 Nuevo color:', color);

    const event = await Event.findById(eventId);
    if (!event) {
      console.log('❌ Evento no encontrado');
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    console.log('📦 Evento encontrado:');
    console.log('   - Título:', event.title);
    console.log('   - Creador:', event.createdBy);
    console.log('   - Grupo:', event.group);

    const group = await Group.findById(event.group);
    if (!group) {
      console.log('❌ Grupo no encontrado');
      return res.status(404).json({ message: 'Grupo no encontrado' });
    }

    console.log('📦 Grupo encontrado:');
    console.log('   - Nombre:', group.name);
    console.log('   - Creador:', group.creator);

    const isEventCreator = event.createdBy.toString() === req.user._id.toString();
    const isGroupCreator = group.creator.toString() === req.user._id.toString();

    console.log('✅ ¿Es creador del evento?', isEventCreator);
    console.log('✅ ¿Es creador del grupo?', isGroupCreator);

    if (!isEventCreator && !isGroupCreator) {
      console.log('❌ Usuario no autorizado');
      return res.status(403).json({ 
        message: 'Solo el creador del evento o del grupo puede cambiar el color' 
      });
    }

    event.color = color;
    await event.save();

    console.log('✅ Color actualizado a:', color);
    res.json({ message: 'Color actualizado', event });
  } catch (error) {
    console.error('❌ Error updateEventColor:', error);
    res.status(500).json({ message: 'Error al actualizar color', error: error.message });
  }
};

module.exports = {
  getEvents,
  createEvent,
  deleteEvent,
  getGroupEvents,
  updateEventColor,
};