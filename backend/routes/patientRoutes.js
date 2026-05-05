const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

// @desc    Get patient profile
// @route   GET /api/patients/profile
// @access  Private (Patient)
router.get('/profile', protect, authorize('patient'), asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password -notifications');
    res.json({ success: true, user });
}));

// @desc    Get patient stats
// @route   GET /api/patients/stats
// @access  Private (Patient)
router.get('/stats', protect, authorize('patient'), asyncHandler(async (req, res) => {
    const [total, pending, completed, cancelled] = await Promise.all([
        Appointment.countDocuments({ patient: req.user._id }),
        Appointment.countDocuments({ patient: req.user._id, status: 'pending' }),
        Appointment.countDocuments({ patient: req.user._id, status: 'completed' }),
        Appointment.countDocuments({ patient: req.user._id, status: 'cancelled' }),
    ]);

    const totalSpent = await Appointment.aggregate([
        { $match: { patient: req.user._id, 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } },
    ]);

    res.json({
        success: true,
        stats: {
            total,
            pending,
            completed,
            cancelled,
            totalSpent: totalSpent[0]?.total || 0,
        },
    });
}));

module.exports = router;
