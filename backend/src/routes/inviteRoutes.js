const express = require('express');
const {
  createInvite,
  validateInvite,
  joinGroup,
} = require('../controllers/inviteController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// ✅ Crear invitación (requiere autenticación)
router.post('/', authMiddleware, createInvite);

// ✅ Validar invitación (NO requiere autenticación - pública)
router.get('/validate/:token', validateInvite); // ← SIN authMiddleware

// ✅ Unirse al grupo (requiere autenticación)
router.post('/join/:token', authMiddleware, joinGroup);

module.exports = router;