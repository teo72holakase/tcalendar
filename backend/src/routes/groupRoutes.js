const express = require('express');
const { createGroup, getGroups, deleteGroup, inviteMember, getGroupMembers, removeMember } = require('../controllers/groupController');
const { createEvent, getGroupEvents } = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware);

router.post('/', createGroup);
router.get('/', getGroups);
router.delete('/:groupId', deleteGroup);
router.post('/:groupId/invite', inviteMember);
router.get('/:groupId/members', getGroupMembers);
router.delete('/:groupId/members/:memberId', removeMember);
router.post('/:groupId/events', createEvent);
router.get('/:groupId/events', getGroupEvents);

module.exports = router;