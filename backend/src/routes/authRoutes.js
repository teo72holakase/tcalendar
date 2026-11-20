const express = require('express');
const { register, login, changePassword, adminResetPassword, updateAvatar, getCurrentUser } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin } = require('../utils/admin');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getCurrentUser);
router.put('/password', authMiddleware, changePassword);
router.put('/avatar', authMiddleware, updateAvatar);
router.post('/admin/reset-password', authMiddleware, requireAdmin, adminResetPassword);

module.exports = router;