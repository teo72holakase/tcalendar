const Schedule = require('../models/Schedule');
const Group = require('../models/Group');
const { validateSchedule } = require('../utils/schedule');

const idOf = (value) => String(value?._id ?? value ?? '');
const isOwner = (schedule, userId) => idOf(schedule.owner) === idOf(userId);
const populateSchedule = async (schedule) => {
  await schedule.populate('owner', 'username');
  await schedule.populate('sharedWith', 'name creator');
  return schedule;
};

exports.getSchedules = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id }).select('_id');
    const groupIds = groups.map((group) => group._id);
    const [ownedSchedules, groupSchedules] = await Promise.all([
      Schedule.find({ owner: req.user._id })
        .populate('owner', 'username')
        .populate('sharedWith', 'name creator')
        .sort({ updatedAt: -1 }),
      groupIds.length
        ? Schedule.find({ owner: { $ne: req.user._id }, sharedWith: { $in: groupIds } })
          .populate('owner', 'username')
          .populate({ path: 'sharedWith', select: 'name creator', match: { _id: { $in: groupIds } } })
          .sort({ updatedAt: -1 })
        : [],
    ]);
    const schedules = [...ownedSchedules, ...groupSchedules]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(schedules);
  } catch (error) {
    console.error('Error getSchedules:', error);
    res.status(500).json({ message: 'No se pudieron obtener los horarios' });
  }
};

exports.createSchedule = async (req, res) => {
  const result = validateSchedule(req.body);
  if (result.error) return res.status(400).json({ message: result.error });
  try {
    const schedule = await Schedule.create({ ...result.value, owner: req.user._id });
    await populateSchedule(schedule);
    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error createSchedule:', error);
    res.status(500).json({ message: 'No se pudo crear el horario' });
  }
};

exports.updateSchedule = async (req, res) => {
  const result = validateSchedule(req.body);
  if (result.error) return res.status(400).json({ message: result.error });
  try {
    const schedule = await Schedule.findById(req.params.scheduleId);
    if (!schedule) return res.status(404).json({ message: 'Horario no encontrado' });
    if (!isOwner(schedule, req.user._id)) return res.status(403).json({ message: 'Solo quien creó el horario puede editarlo' });

    schedule.set(result.value);
    await schedule.save();
    await populateSchedule(schedule);
    res.json(schedule);
  } catch (error) {
    console.error('Error updateSchedule:', error);
    res.status(500).json({ message: 'No se pudo guardar el horario' });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.scheduleId);
    if (!schedule) return res.status(404).json({ message: 'Horario no encontrado' });
    if (!isOwner(schedule, req.user._id)) return res.status(403).json({ message: 'Solo quien creó el horario puede eliminarlo' });
    await Schedule.findByIdAndDelete(schedule._id);
    res.json({ message: 'Horario eliminado' });
  } catch (error) {
    console.error('Error deleteSchedule:', error);
    res.status(500).json({ message: 'No se pudo eliminar el horario' });
  }
};

exports.addScheduleToGroup = async (req, res) => {
  try {
    const [schedule, group] = await Promise.all([
      Schedule.findById(req.params.scheduleId),
      Group.findById(req.params.groupId),
    ]);
    if (!schedule) return res.status(404).json({ message: 'Horario no encontrado' });
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
    if (!group.members.some((member) => idOf(member) === idOf(req.user._id))) {
      return res.status(403).json({ message: 'Solo un miembro puede añadir horarios al grupo' });
    }

    if (!schedule.sharedWith.some((groupId) => idOf(groupId) === idOf(group._id))) {
      await Schedule.updateOne({ _id: schedule._id }, { $addToSet: { sharedWith: group._id } });
    }
    const updatedSchedule = await Schedule.findById(schedule._id);
    await populateSchedule(updatedSchedule);
    res.json(updatedSchedule);
  } catch (error) {
    console.error('Error addScheduleToGroup:', error);
    res.status(500).json({ message: 'No se pudo añadir el horario al grupo' });
  }
};

exports.removeScheduleFromGroup = async (req, res) => {
  try {
    const [schedule, group] = await Promise.all([
      Schedule.findById(req.params.scheduleId),
      Group.findById(req.params.groupId),
    ]);
    if (!schedule) return res.status(404).json({ message: 'Horario no encontrado' });
    if (!group || !schedule.sharedWith.some((groupId) => idOf(groupId) === idOf(group._id))) {
      return res.status(404).json({ message: 'El horario no está añadido a ese grupo' });
    }
    if (!isOwner(schedule, req.user._id) && idOf(group.creator) !== idOf(req.user._id)) {
      return res.status(403).json({ message: 'Solo quien creó el horario o el grupo puede quitarlo' });
    }

    schedule.sharedWith = schedule.sharedWith.filter((groupId) => idOf(groupId) !== idOf(group._id));
    await schedule.save();
    res.json({ message: 'Horario quitado del grupo' });
  } catch (error) {
    console.error('Error removeScheduleFromGroup:', error);
    res.status(500).json({ message: 'No se pudo quitar el horario del grupo' });
  }
};
