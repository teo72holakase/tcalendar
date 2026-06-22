const Invite = require('../models/Invite');
const Group = require('../models/Group');
const crypto = require('crypto');

const generateToken = () => crypto.randomBytes(8).toString('hex');

const createInvite = async (req, res) => {
  try {
    const { groupId, expiresInDays, maxUses } = req.body;

    const group = await Group.findById(groupId).select('creator members');
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el creador puede generar invitaciones' });
    }

    const token = generateToken();

    // expiresInDays: null o undefined = ilimitado
    let expiresAt = null;
    if (expiresInDays && expiresInDays !== 'unlimited') {
      expiresAt = new Date(Date.now() + parseInt(expiresInDays) * 24 * 60 * 60 * 1000);
    }

    const invite = new Invite({
      group: groupId,
      token,
      createdBy: req.user._id,
      expiresAt,
      maxUses: maxUses || 1,
      uses: 0,
    });

    await invite.save();

    const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/invite/${token}`;
    res.status(201).json({ invite: { token }, inviteLink, message: 'Invitación creada correctamente' });
  } catch (error) {
    console.error('Error createInvite:', error);
    res.status(500).json({ message: 'Error al crear invitación' });
  }
};

const validateInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const invite = await Invite.findOne({ token })
      .populate('group', 'name')
      .populate('createdBy', 'username');

    if (!invite) return res.status(404).json({ valid: false, message: 'Invitación no válida' });

    // Expiración
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      await Invite.findByIdAndDelete(invite._id);
      return res.status(410).json({ valid: false, message: 'Esta invitación ha expirado' });
    }

    // Usos agotados
    if (invite.uses >= invite.maxUses) {
      await Invite.findByIdAndDelete(invite._id);
      return res.status(410).json({ valid: false, message: 'Esta invitación ya no tiene usos disponibles' });
    }

    res.json({
      valid: true,
      group: invite.group,
      createdBy: invite.createdBy,
      usesLeft: invite.maxUses - invite.uses,
      maxUses: invite.maxUses,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error('Error validateInvite:', error);
    res.status(500).json({ message: 'Error al validar invitación' });
  }
};

const joinGroup = async (req, res) => {
  try {
    const { token } = req.params;
    const invite = await Invite.findOne({ token });
    if (!invite) return res.status(404).json({ message: 'Invitación no válida' });

    // Verificar expiración
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      await Invite.findByIdAndDelete(invite._id);
      return res.status(410).json({ message: 'Esta invitación ha expirado' });
    }

    // Verificar usos
    if (invite.uses >= invite.maxUses) {
      await Invite.findByIdAndDelete(invite._id);
      return res.status(410).json({ message: 'Esta invitación ya no tiene usos disponibles' });
    }

    const group = await Group.findById(invite.group);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    if (group.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Ya eres miembro de este grupo' });
    }

    group.members.push(req.user._id);
    await group.save();

    invite.uses += 1;

    // Si agotó usos, borrar
    if (invite.uses >= invite.maxUses) {
      await Invite.findByIdAndDelete(invite._id);
    } else {
      await invite.save();
    }

    res.json({ success: true, group, message: 'Te has unido al grupo correctamente' });
  } catch (error) {
    console.error('Error joinGroup:', error);
    res.status(500).json({ message: 'Error al unirse al grupo' });
  }
};

module.exports = { createInvite, validateInvite, joinGroup };