const Group = require('../models/Group');

// Obtener grupos del usuario autenticado
const getGroups = async (req, res) => {
  try {
    // Buscar grupos donde el usuario es miembro
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

module.exports = { getGroups, createGroup };