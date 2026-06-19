const express = require('express');
const { createGroup, getGroups, inviteMember, getGroupMembers } = require('../controllers/groupController');
const { createEvent, getGroupEvents } = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware);

router.post('/', createGroup);
router.get('/', getGroups);
router.post('/:groupId/invite', inviteMember);
router.get('/:groupId/members', getGroupMembers);
router.post('/:groupId/events', createEvent);
router.get('/:groupId/events', getGroupEvents);

module.exports = router;
