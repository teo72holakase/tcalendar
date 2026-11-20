const express = require('express');
const { createGroup, getGroups, deleteGroup, inviteMember, getGroupMembers, removeMember, updateGroupColor } = require('../controllers/groupController');
const { createEvent, getGroupEvents, exportGroupIcs } = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware);

router.post('/', createGroup);
router.get('/', getGroups);
router.delete('/:groupId', deleteGroup);
router.post('/:groupId/invite', inviteMember);
router.get('/:groupId/members', getGroupMembers);
router.delete('/:groupId/members/:memberId', removeMember);
router.patch('/:groupId/color', updateGroupColor); // ← NUEVA RUTA
router.post('/:groupId/events', createEvent);
router.get('/:groupId/events', getGroupEvents);
router.get('/:groupId/events.ics', exportGroupIcs);

module.exports = router;