const express = require('express');
const router = express.Router();
const { getChat, sendMessage, getUnreadCount } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/unread', getUnreadCount);
router.get('/:appointmentId', getChat);
router.post('/:appointmentId/messages', sendMessage);

module.exports = router;
