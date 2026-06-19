const express = require('express');
const { deleteEvent } = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware);
router.delete('/:eventId', deleteEvent);

module.exports = router;
