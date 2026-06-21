const Invite = require('../models/Invite');
const Group = require('../models/Group');
const crypto = require('crypto');

const generateToken = () => crypto.randomBytes(8).toString('hex');

// 📌 CREAR INVITACIÓN (SOLO PARA USUARIOS AUTENTICADOS)
const createInvite = async (req, res) => {
  try {
    const { groupId } = req.body;

    const group = await Group.findById(groupId).select('creator members');
    if (!group) {
      return res.status(404).json({ message: 'Grupo no encontrado' });
    }

    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el creador puede generar invitaciones' });
    }

    const token = generateToken();

    const invite = new Invite({
      group: groupId,
      token,
      createdBy: req.user._id,
    });

    await invite.save();

    const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/invite/${token}`;

    res.status(201).json({
      invite: { token },
      inviteLink,
      message: 'Invitación creada correctamente',
    });
  } catch (error) {
    console.error('Error createInvite:', error);
    res.status(500).json({ message: 'Error al crear invitación' });
  }
};

// 📌 VALIDAR INVITACIÓN (NO REQUIERE AUTENTICACIÓN)
const validateInvite = async (req, res) => {
  try {
    const { token } = req.params;
    console.log('🔍 Validando token:', token);

    const invite = await Invite.findOne({ token })
      .populate('group', 'name')
      .populate('createdBy', 'username');

    if (!invite) {
      console.log('❌ Token no encontrado');
      return res.status(404).json({
        valid: false,
        message: 'Invitación no válida'
      });
    }

    console.log('✅ Invitación válida:', invite);
    res.json({
      valid: true,
      group: invite.group,
      createdBy: invite.createdBy,
    });
  } catch (error) {
    console.error('Error validateInvite:', error);
    res.status(500).json({ message: 'Error al validar invitación' });
  }
};

// 📌 UNIRSE AL GRUPO (REQUIERE AUTENTICACIÓN)
const joinGroup = async (req, res) => {
  try {
    const { token } = req.params;
    console.log('🔑 Uniendo usuario:', req.user._id, 'con token:', token);

    const invite = await Invite.findOne({ token });
    if (!invite) {
      return res.status(404).json({ message: 'Invitación no válida' });
    }

    const group = await Group.findById(invite.group);
    if (!group) {
      return res.status(404).json({ message: 'Grupo no encontrado' });
    }

    // ✅ Verificar si el usuario ya es miembro
    if (group.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'Ya eres miembro de este grupo' });
    }

    // ✅ Agregar usuario al grupo
    group.members.push(req.user._id);
    await group.save();

    // ✅ Eliminar invitación después de usarla
    await Invite.findByIdAndDelete(invite._id);

    res.json({
      success: true,
      group,
      message: 'Te has unido al grupo correctamente',
    });
  } catch (error) {
    console.error('Error joinGroup:', error);
    res.status(500).json({ message: 'Error al unirse al grupo' });
  }
};

// 📌 OBTENER INVITACIONES DEL GRUPO
const getGroupInvites = async (req, res) => {
  try {
    const { groupId } = req.params;

    const invites = await Invite.find({ group: groupId })
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.json(invites);
  } catch (error) {
    console.error('Error getGroupInvites:', error);
    res.status(500).json({ message: 'Error al obtener invitaciones' });
  }
};

// 📌 ELIMINAR INVITACIÓN
const deleteInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;

    const invite = await Invite.findById(inviteId);
    if (!invite) {
      return res.status(404).json({ message: 'Invitación no encontrada' });
    }

    if (invite.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tienes permiso' });
    }

    await Invite.findByIdAndDelete(inviteId);

    res.json({ message: 'Invitación eliminada correctamente' });
  } catch (error) {
    console.error('Error deleteInvite:', error);
    res.status(500).json({ message: 'Error al eliminar invitación' });
  }
};

module.exports = {
  createInvite,
  validateInvite,
  joinGroup,
  getGroupInvites,
  deleteInvite,
};