const express = require('express');
const {
  getEvents,
  createEvent,
  deleteEvent,
  updateEventColor, // ✅ IMPORTAR
} = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware);

router.get('/', getEvents);
router.post('/', createEvent);
router.delete('/:eventId', deleteEvent);
router.patch('/:eventId/color', updateEventColor); // ✅ NUEVA RUTA

module.exports = router;