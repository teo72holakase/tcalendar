const express = require('express');
const {
  getEvents,
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware);

router.get('/', getEvents);
router.post('/', createEvent);
router.get('/:id', getEvent);
router.put('/:id', updateEvent);
router.delete('/:eventId', deleteEvent);

module.exports = router;