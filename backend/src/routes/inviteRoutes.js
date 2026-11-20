const express = require('express');
const {
  createInvite,
  validateInvite,
  joinGroup,
} = require('../controllers/inviteController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', authMiddleware, createInvite);
router.get('/validate/:token', validateInvite);
router.post('/join/:token', authMiddleware, joinGroup);

module.exports = router;