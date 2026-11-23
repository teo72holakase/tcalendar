const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  createInvite,
  validateInvite,
  joinGroup,
  generateGroupCode,
  joinGroupByCode,
} = require('../controllers/inviteController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const joinCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Probá de nuevo en unos minutos.' },
});

router.post('/', authMiddleware, createInvite);
router.post('/code', authMiddleware, generateGroupCode);
router.post('/join-code', authMiddleware, joinCodeLimiter, joinGroupByCode);
router.get('/validate/:token', validateInvite);
router.post('/join/:token', authMiddleware, joinGroup);

module.exports = router;