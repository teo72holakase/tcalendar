const Group = require('../models/Group');
const User = require('../models/User');

// Obtener grupos del usuario autenticado
const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.userId });
    res.json(groups);
  } catch (error) {
    console.error('Error al obtener grupos:', error);
    res.status(500).json({ message: 'Error al obtener grupos' });
  }
};

// Crear un nuevo grupo
const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const newGroup = new Group({
      name,
      description,
      createdBy: req.userId,
      members: [req.userId]
    });
    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (error) {
    console.error('Error al crear grupo:', error);
    res.status(500).json({ message: 'Error al crear grupo' });
  }
};

// Invitar a un miembro al grupo
const inviteMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { email } = req.body;

    // Buscar usuario por email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Grupo no encontrado' });
    }

    // Verificar que el usuario no sea el creador (ya es miembro)
    if (group.createdBy.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'El creador ya es miembro del grupo' });
    }

    // Verificar que el usuario no esté ya en el grupo
    if (group.members.includes(user._id)) {
      return res.status(400).json({ message: 'El usuario ya es miembro del grupo' });
    }

    group.members.push(user._id);
    await group.save();

    res.json({ message: 'Usuario invitado exitosamente', group });
  } catch (error) {
    console.error('Error al invitar miembro:', error);
    res.status(500).json({ message: 'Error al invitar miembro' });
  }
};

// Obtener miembros del grupo
const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).populate('members', 'username email');
    if (!group) {
      return res.status(404).json({ message: 'Grupo no encontrado' });
    }
    res.json(group.members);
  } catch (error) {
    console.error('Error al obtener miembros:', error);
    res.status(500).json({ message: 'Error al obtener miembros' });
  }
};

module.exports = { createGroup, getGroups, inviteMember, getGroupMembers }; // ← NOMBRES EXACTOS