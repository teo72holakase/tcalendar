const Group = require('../models/Group');
const User = require('../models/User');
const crypto = require('crypto');

const generateInviteCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id }).populate('members', 'username');
    res.json(groups);
  } catch (error) {
    console.error('Error getGroups:', error);
    res.status(500).json({ message: 'Error al obtener grupos', error: error.message });
  }
};

const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = new Group({
      name,
      description,
      creator: req.user._id,
      members: [req.user._id],
      inviteCode: generateInviteCode(),
    });
    await group.save();
    await group.populate('members', 'username');
    res.status(201).json(group);
  } catch (error) {
    console.error('Error createGroup:', error);
    res.status(500).json({ message: 'Error al crear grupo', error: error.message });
  }
};

const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members', 'username');
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
    if (!group.members.some(m => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'No tenés acceso a este grupo' });
    }
    res.json(group);
  } catch (error) {
    console.error('Error getGroup:', error);
    res.status(500).json({ message: 'Error al obtener grupo', error: error.message });
  }
};

const updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el creador puede editar el grupo' });
    }
    const { name, description } = req.body;
    if (name) group.name = name;
    if (description) group.description = description;
    await group.save();
    res.json(group);
  } catch (error) {
    console.error('Error updateGroup:', error);
    res.status(500).json({ message: 'Error al actualizar grupo', error: error.message });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el creador puede eliminar el grupo' });
    }
    await group.deleteOne();
    res.json({ message: 'Grupo eliminado' });
  } catch (error) {
    console.error('Error deleteGroup:', error);
    res.status(500).json({ message: 'Error al eliminar grupo', error: error.message });
  }
};

const getGroupMembers = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('members', 'username');
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
    const isMember = group.members.some(m => m._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'No tenés acceso a este grupo' });
    res.json(group.members);
  } catch (error) {
    console.error('Error getGroupMembers:', error);
    res.status(500).json({ message: 'Error al obtener miembros', error: error.message });
  }
};

const inviteMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el creador puede invitar miembros' });
    }
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'Se requiere el username' });
    const userToInvite = await User.findOne({ username });
    if (!userToInvite) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (group.members.includes(userToInvite._id)) {
      return res.status(400).json({ message: 'El usuario ya es miembro del grupo' });
    }
    group.members.push(userToInvite._id);
    await group.save();
    await group.populate('members', 'username');
    res.json({ message: 'Miembro agregado', group });
  } catch (error) {
    console.error('Error inviteMember:', error);
    res.status(500).json({ message: 'Error al invitar miembro', error: error.message });
  }
};

const joinGroup = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ message: 'Se requiere el código de invitación' });
    const group = await Group.findOne({ inviteCode });
    if (!group) return res.status(404).json({ message: 'Código inválido' });
    if (group.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'Ya sos miembro de este grupo' });
    }
    group.members.push(req.user._id);
    await group.save();
    await group.populate('members', 'username');
    res.json({ message: 'Te uniste al grupo', group });
  } catch (error) {
    console.error('Error joinGroup:', error);
    res.status(500).json({ message: 'Error al unirse al grupo', error: error.message });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
    if (group.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'El creador no puede abandonar el grupo, solo eliminarlo' });
    }
    group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
    await group.save();
    res.json({ message: 'Saliste del grupo' });
  } catch (error) {
    console.error('Error leaveGroup:', error);
    res.status(500).json({ message: 'Error al salir del grupo', error: error.message });
  }
};

module.exports = {
  getGroups,
  createGroup,
  getGroup,
  updateGroup,
  deleteGroup,
  inviteMember,
  getGroupMembers,
  joinGroup,
  leaveGroup,
};