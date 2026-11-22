const express = require('express');
const { createGroup, getGroups, deleteGroup, inviteMember, getGroupMembers, removeMember, updateGroupColor } = require('../controllers/groupController');
const { createEvent, getGroupEvents, exportGroupIcs } = require('../controllers/eventController');
const groupContent = require('../controllers/groupContentController');
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
router.get('/:groupId/posts', groupContent.getPosts);
router.post('/:groupId/posts', groupContent.createPost);
router.delete('/:groupId/posts/:postId', groupContent.deletePost);
router.get('/:groupId/posts/:postId/comments', groupContent.getComments);
router.post('/:groupId/posts/:postId/comments', groupContent.createComment);
router.delete('/:groupId/posts/:postId/comments/:commentId', groupContent.deleteComment);
router.get('/:groupId/resources', groupContent.getResources);
router.post('/:groupId/resources', groupContent.createResource);
router.delete('/:groupId/resources/:resourceId', groupContent.deleteResource);

module.exports = router;