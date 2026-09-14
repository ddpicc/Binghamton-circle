const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.get(
  '/conversations/:userId',
  authenticate,
  messageController.getConversation
);

router.post(
  '/conversations/:userId/messages',
  authenticate,
  messageController.sendMessage
);

router.post(
  '/conversations/:userId/read',
  authenticate,
  messageController.markAsRead
);

router.get(
  '/unread-summary',
  authenticate,
  messageController.getUnreadSummary
);

module.exports = router;
