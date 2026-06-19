const crypto = require('crypto');
const Group = require('../models/Group');
const User = require('../models/User');

exports.createGroup = async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Nombre del grupo es requerido' });
  }

  const inviteCode = crypto.randomBytes(6).toString('hex');
  const group = await Group.create({
    name,
    description: description || '',
    createdBy: req.user._id,
    members: [req.user._id],
    inviteCode,
  });

  req.user.groups.push(group._id);
  await req.user.save();

  res.status(201).json(group);
};

exports.getGroups = async (req, res) => {
  const groups = await Group.find({ members: req.user._id }).sort({ createdAt: -1 });
  res.json(groups);
};

exports.inviteMember = async (req, res) => {
  const { username } = req.body;
  const { groupId } = req.params;

  if (!username) {
    return res.status(400).json({ message: 'Usuario es requerido' });
  }

  const group = await Group.findById(groupId);
  if (!group) {
    return res.status(404).json({ message: 'Grupo no encontrado' });
  }

  if (!group.members.includes(req.user._id)) {
    return res.status(403).json({ message: 'No autorizado' });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  if (group.members.includes(user._id)) {
    return res.status(400).json({ message: 'Usuario ya es miembro del grupo' });
  }

  group.members.push(user._id);
  await group.save();

  user.groups.push(group._id);
  await user.save();

  res.json({ message: 'Invitación enviada y miembro agregado al grupo' });
};

exports.getGroupMembers = async (req, res) => {
  const { groupId } = req.params;
  const group = await Group.findById(groupId).populate('members', 'username');
  if (!group) {
    return res.status(404).json({ message: 'Grupo no encontrado' });
  }

  if (!group.members.some((member) => member._id.equals(req.user._id))) {
    return res.status(403).json({ message: 'No autorizado' });
  }

  res.json(group.members);
};
