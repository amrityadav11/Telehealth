const asyncHandler = require('express-async-handler');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Review = require('../models/Review');
const Payout = require('../models/Payout');

// @desc    Revenue analytics (monthly, by category, by doctor)
// @route   GET /api/admin/analytics/revenue
// @access  Private (Admin)
const getRevenueAnalytics = asyncHandler(async (req, res) => {
    const { months = 12 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Number(months));

    // Monthly revenue
    const monthlyRevenue = await Appointment.aggregate([
        {
            $match: {
                status: 'completed',
                'payment.status': 'paid',
                appointmentDate: { $gte: startDate },
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: '$appointmentDate' },
                    month: { $month: '$appointmentDate' },
                },
                revenue: { $sum: '$payment.amount' },
                appointments: { $sum: 1 },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Revenue by payment method
    const revenueByMethod = await Appointment.aggregate([
        { $match: { status: 'completed', 'payment.status': 'paid' } },
        {
            $group: {
                _id: '$payment.method',
                revenue: { $sum: '$payment.amount' },
                count: { $sum: 1 },
            },
        },
    ]);

    // Revenue by appointment type
    const revenueByType = await Appointment.aggregate([
        { $match: { status: 'completed', 'payment.status': 'paid' } },
        {
            $group: {
                _id: '$type',
                revenue: { $sum: '$payment.amount' },
                count: { $sum: 1 },
            },
        },
    ]);

    // Total revenue
    const totalResult = await Appointment.aggregate([
        { $match: { status: 'completed', 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$payment.amount' }, count: { $sum: 1 } } },
    ]);

    // Total payouts
    const payoutResult = await Payout.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
        success: true,
        analytics: {
            totalRevenue: totalResult[0]?.total || 0,
            totalAppointments: totalResult[0]?.count || 0,
            totalPayouts: payoutResult[0]?.total || 0,
            netRevenue: (totalResult[0]?.total || 0) - (payoutResult[0]?.total || 0),
            monthlyRevenue,
            revenueByMethod,
            revenueByType,
        },
    });
});

// @desc    Appointment heatmap (by day of week + hour)
// @route   GET /api/admin/analytics/heatmap
// @access  Private (Admin)
const getAppointmentHeatmap = asyncHandler(async (req, res) => {
    const { months = 3 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Number(months));

    const heatmap = await Appointment.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
            $group: {
                _id: {
                    dayOfWeek: { $dayOfWeek: '$appointmentDate' }, // 1=Sun, 7=Sat
                    hour: {
                        $toInt: {
                            $substr: ['$timeSlot.startTime', 0, 2],
                        },
                    },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } },
    ]);

    // Status distribution
    const statusDistribution = await Appointment.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({ success: true, heatmap, statusDistribution });
});

// @desc    Doctor performance metrics
// @route   GET /api/admin/analytics/doctors
// @access  Private (Admin)
const getDoctorPerformance = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    // Top doctors by revenue
    const topByRevenue = await Appointment.aggregate([
        { $match: { status: 'completed', 'payment.status': 'paid' } },
        {
            $group: {
                _id: '$doctor',
                totalRevenue: { $sum: '$payment.amount' },
                totalAppointments: { $sum: 1 },
                avgFee: { $avg: '$payment.amount' },
            },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: Number(limit) },
        {
            $lookup: {
                from: 'doctors',
                localField: '_id',
                foreignField: '_id',
                as: 'doctor',
            },
        },
        { $unwind: '$doctor' },
        {
            $lookup: {
                from: 'users',
                localField: 'doctor.user',
                foreignField: '_id',
                as: 'user',
            },
        },
        { $unwind: '$user' },
        {
            $project: {
                totalRevenue: 1,
                totalAppointments: 1,
                avgFee: 1,
                doctorName: '$user.name',
                specialization: '$doctor.specialization',
                category: '$doctor.category',
                rating: '$doctor.rating',
            },
        },
    ]);

    // Top doctors by rating
    const topByRating = await Doctor.find({ isApproved: true, numReviews: { $gte: 1 } })
        .populate('user', 'name avatar')
        .sort({ rating: -1, numReviews: -1 })
        .limit(Number(limit))
        .select('specialization category rating numReviews totalAppointments consultationFee user');

    // Cancellation rate by doctor
    const cancellationRate = await Appointment.aggregate([
        {
            $group: {
                _id: '$doctor',
                total: { $sum: 1 },
                cancelled: {
                    $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
                },
            },
        },
        {
            $project: {
                total: 1,
                cancelled: 1,
                rate: { $multiply: [{ $divide: ['$cancelled', '$total'] }, 100] },
            },
        },
        { $sort: { rate: -1 } },
        { $limit: Number(limit) },
        {
            $lookup: {
                from: 'doctors',
                localField: '_id',
                foreignField: '_id',
                as: 'doctor',
            },
        },
        { $unwind: '$doctor' },
        {
            $lookup: {
                from: 'users',
                localField: 'doctor.user',
                foreignField: '_id',
                as: 'user',
            },
        },
        { $unwind: '$user' },
        {
            $project: {
                total: 1,
                cancelled: 1,
                rate: { $round: ['$rate', 1] },
                doctorName: '$user.name',
                specialization: '$doctor.specialization',
            },
        },
    ]);

    res.json({
        success: true,
        performance: {
            topByRevenue,
            topByRating,
            cancellationRate,
        },
    });
});

// @desc    Patient growth analytics
// @route   GET /api/admin/analytics/patients
// @access  Private (Admin)
const getPatientAnalytics = asyncHandler(async (req, res) => {
    const { months = 12 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Number(months));

    // New patients per month
    const newPatients = await User.aggregate([
        {
            $match: {
                role: 'patient',
                createdAt: { $gte: startDate },
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Returning patients (more than 1 appointment)
    const returningPatients = await Appointment.aggregate([
        { $group: { _id: '$patient', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $count: 'total' },
    ]);

    // Total patients
    const totalPatients = await User.countDocuments({ role: 'patient', isActive: true });
    const totalDoctors = await Doctor.countDocuments({ isApproved: true });

    // Specialty demand
    const specialtyDemand = await Appointment.aggregate([
        {
            $lookup: {
                from: 'doctors',
                localField: 'doctor',
                foreignField: '_id',
                as: 'doctorInfo',
            },
        },
        { $unwind: '$doctorInfo' },
        {
            $group: {
                _id: '$doctorInfo.category',
                appointments: { $sum: 1 },
                revenue: {
                    $sum: {
                        $cond: [{ $eq: ['$payment.status', 'paid'] }, '$payment.amount', 0],
                    },
                },
            },
        },
        { $sort: { appointments: -1 } },
    ]);

    res.json({
        success: true,
        analytics: {
            totalPatients,
            totalDoctors,
            returningPatients: returningPatients[0]?.total || 0,
            newPatients,
            specialtyDemand,
        },
    });
});

module.exports = {
    getRevenueAnalytics,
    getAppointmentHeatmap,
    getDoctorPerformance,
    getPatientAnalytics,
};
