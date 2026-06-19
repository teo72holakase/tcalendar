const express = require('express');
const router = express.Router();
const { getGroups, createGroup } = require('../controllers/groupController');
const auth = require('../middleware/auth');

// Obtener todos los grupos del usuario autenticado
router.get('/', auth, getGroups);

// Crear un nuevo grupo
router.post('/', auth, createGroup);

module.exports = router;