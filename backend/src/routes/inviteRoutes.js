const express = require('express');
const {
  createInvite,
  validateInvite,
  joinGroup,
  getGroupInvites,
  deleteInvite,
} = require('../controllers/inviteController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware);

router.post('/', createInvite);
router.get('/validate/:token', validateInvite);
router.post('/join/:token', joinGroup);
router.get('/group/:groupId', getGroupInvites);
router.delete('/:inviteId', deleteInvite);

module.exports = router;