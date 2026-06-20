const Group = require('../models/Group');
const User = require('../models/User');
const crypto = require('crypto');

// Helper para generar inviteCode único
const generateInviteCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

// GET /groups
const getGroups = async (req, res) => {
  try {
    // FIX 1: era req.userId — el middleware de auth setea req.user
    const groups = await Group.find({ members: req.user._id }).populate('members', 'username');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener grupos', error: error.message });
  }
};

// POST /groups
const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;

    // FIX 2: era req.userId — también faltaba generar el inviteCode
    const group = new Group({
      name,
      description,
      creator: req.user._id,
      members: [req.user._id],
      inviteCode: generateInviteCode(), // FIX 3: GroupSchema lo requiere pero nunca se generaba
    });

    await group.save();
    await group.populate('members', 'username');
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear grupo', error: error.message });
  }
};

// GET /groups/:id
const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members', 'username');
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    // Verificar que el usuario es miembro
    if (!group.members.some(m => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'No tenés acceso a este grupo' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener grupo', error: error.message });
  }
};

// PUT /groups/:id
const updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    // FIX: era req.userId
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el creador puede editar el grupo' });
    }

    const { name, description } = req.body;
    if (name) group.name = name;
    if (description) group.description = description;

    await group.save();
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar grupo', error: error.message });
  }
};

// DELETE /groups/:id
const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    // FIX: era req.userId
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el creador puede eliminar el grupo' });
    }

    await group.deleteOne();
    res.json({ message: 'Grupo eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar grupo', error: error.message });
  }
};

// GET /groups/:groupId/members
const getGroupMembers = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('members', 'username');
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    const isMember = group.members.some(m => m._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'No tenés acceso a este grupo' });

    res.json(group.members);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener miembros', error: error.message });
  }
};

// POST /groups/:groupId/invite
const inviteMember = async (req, res) => {
  try {
    // FIX: era req.userId — también se usa :groupId en las rutas, no :id
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el creador puede invitar miembros' });
    }

    const { username } = req.body; // FIX: era email — el modelo User no tiene campo email, solo username
    if (!username) return res.status(400).json({ message: 'Se requiere el username' });

    const userToInvite = await User.findOne({ username }); // FIX: antes buscaba por email
    if (!userToInvite) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (group.members.includes(userToInvite._id)) {
      return res.status(400).json({ message: 'El usuario ya es miembro del grupo' });
    }

    group.members.push(userToInvite._id);
    await group.save();
    await group.populate('members', 'username');

    res.json({ message: 'Miembro agregado', group });
  } catch (error) {
    res.status(500).json({ message: 'Error al invitar miembro', error: error.message });
  }
};

// POST /groups/join
const joinGroup = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ message: 'Se requiere el código de invitación' });

    const group = await Group.findOne({ inviteCode });
    if (!group) return res.status(404).json({ message: 'Código inválido' });

    // FIX: era req.userId
    if (group.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'Ya sos miembro de este grupo' });
    }

    group.members.push(req.user._id);
    await group.save();
    await group.populate('members', 'username');

    res.json({ message: 'Te uniste al grupo', group });
  } catch (error) {
    res.status(500).json({ message: 'Error al unirse al grupo', error: error.message });
  }
};

// DELETE /groups/:id/leave
const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

    // FIX: era req.userId
    if (group.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'El creador no puede abandonar el grupo, solo eliminarlo' });
    }

    group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
    await group.save();

    res.json({ message: 'Saliste del grupo' });
  } catch (error) {
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