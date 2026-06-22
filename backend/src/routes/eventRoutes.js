const express = require('express');
const {
  getEvents,
  createEvent,
  deleteEvent,
  updateEventColor,
  getUpcomingEvents,
} = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware);

router.get('/upcoming', getUpcomingEvents);
router.get('/', getEvents);
router.post('/', createEvent);
router.delete('/:eventId', deleteEvent);
router.patch('/:eventId/color', updateEventColor);

module.exports = router;