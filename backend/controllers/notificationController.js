const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('notifications');
    res.json({ success: true, notifications: user.notifications });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:index/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const index = Number(req.params.index);

    if (index >= 0 && index < user.notifications.length) {
        user.notifications[index].isRead = true;
        await user.save({ validateBeforeSave: false });
    }

    res.json({ success: true, message: 'Notification marked as read' });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: { 'notifications.$[].isRead': true },
    });

    res.json({ success: true, message: 'All notifications marked as read' });
});

// @desc    Clear all notifications
// @route   DELETE /api/notifications
// @access  Private
const clearNotifications = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { notifications: [] });
    res.json({ success: true, message: 'Notifications cleared' });
});

module.exports = { getNotifications, markAsRead, markAllAsRead, clearNotifications };
