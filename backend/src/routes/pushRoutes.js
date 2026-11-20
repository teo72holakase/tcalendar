const express = require('express');
const { getKey, subscribe, unsubscribe, runReminders } = require('../controllers/pushController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/key', getKey);
router.post('/subscribe', authMiddleware, subscribe);
router.post('/unsubscribe', authMiddleware, unsubscribe);
router.post('/reminders/run', runReminders); // protegido por la cabecera x-cron-key

module.exports = router;
