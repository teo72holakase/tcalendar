const Invite = require('../models/Invite');
const Group = require('../models/Group');
const crypto = require('crypto');

const generateToken = () => crypto.randomBytes(8).toString('hex');
const generateGroupCodeValue = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0');

const generateGroupCode = async (req, res) => {
  try {
    const group = await Group.findById(req.body.groupId);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el creador puede generar códigos de invitación' });
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      group.inviteCode = generateGroupCodeValue();
      try {
        await group.save();
        return res.json({ code: group.inviteCode, message: 'Código generado correctamente' });
      } catch (error) {
        if (error.code !== 11000) throw error;
      }
    }

    return res.status(503).json({ message: 'No se pudo generar un código único. Intentá de nuevo.' });
  } catch (error) {
    console.error('Error generateGroupCode:', error);
    return res.status(500).json({ message: 'Error al generar el código' });
  }
};

const joinGroupByCode = async (req, res) => {
  try {
    const code = String(req.body.code || '').trim();
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: 'El código debe tener 6 números' });
    }

    const group = await Group.findOne({ inviteCode: code });
    if (!group) return res.status(404).json({ message: 'Código de grupo no válido' });
    if (group.members.some((member) => member.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Ya eres miembro de este grupo' });
    }

    const result = await Group.updateOne(
      { _id: group._id, inviteCode: code },
      { $addToSet: { members: req.user._id } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Código de grupo no válido' });
    }
    res.json({ success: true, groupId: group._id, message: 'Te has unido al grupo correctamente' });
  } catch (error) {
    console.error('Error joinGroupByCode:', error);
    res.status(500).json({ message: 'Error al unirse al grupo' });
  }
};

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

    const inviteLink = `https://tcalendar.devs.surf/invite/${token}`;
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

    // Reserva un uso de forma atómica: si dos personas llegan a la vez con 1 uso disponible, solo una pasa.
    const claimed = await Invite.findOneAndUpdate(
      { _id: invite._id, $expr: { $lt: ['$uses', '$maxUses'] } },
      { $inc: { uses: 1 } },
      { new: true }
    );
    if (!claimed) return res.status(410).json({ message: 'Esta invitación ya no tiene usos disponibles' });

    await Group.updateOne({ _id: group._id }, { $addToSet: { members: req.user._id } });

    // Si agotó usos, borrar
    if (claimed.uses >= claimed.maxUses) {
      await Invite.findByIdAndDelete(claimed._id);
    }

    res.json({ success: true, group, message: 'Te has unido al grupo correctamente' });
  } catch (error) {
    console.error('Error joinGroup:', error);
    res.status(500).json({ message: 'Error al unirse al grupo' });
  }
};

module.exports = { createInvite, validateInvite, joinGroup, generateGroupCode, joinGroupByCode };