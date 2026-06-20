const express = require('express');
const {
  getEvents,
  createEvent,
  deleteEvent,
} = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware);

router.get('/', getEvents);
router.post('/', createEvent);
router.delete('/:eventId', deleteEvent);

module.exports = router;