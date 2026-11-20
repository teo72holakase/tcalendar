const express = require('express');
const {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  addScheduleToGroup,
  removeScheduleFromGroup,
} = require('../controllers/scheduleController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', getSchedules);
router.post('/', createSchedule);
router.post('/:scheduleId/groups/:groupId', addScheduleToGroup);
router.delete('/:scheduleId/groups/:groupId', removeScheduleFromGroup);
router.put('/:scheduleId', updateSchedule);
router.delete('/:scheduleId', deleteSchedule);

module.exports = router;
