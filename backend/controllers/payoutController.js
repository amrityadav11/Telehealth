const asyncHandler = require('express-async-handler');
const Payout = require('../models/Payout');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');

// @desc    Request a payout
// @route   POST /api/payouts/request
// @access  Private (Doctor)
const requestPayout = asyncHandler(async (req, res) => {
    const { amount, method, bankDetails, periodFrom, periodTo } = req.body;

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor profile not found');
    }

    if (!amount || Number(amount) < 1) {
        res.status(400);
        throw new Error('Invalid payout amount');
    }

    if (Number(amount) > doctor.totalEarnings) {
        res.status(400);
        throw new Error('Requested amount exceeds available earnings');
    }

    // Check for pending payout
    const pendingPayout = await Payout.findOne({ doctor: doctor._id, status: 'pending' });
    if (pendingPayout) {
        res.status(400);
        throw new Error('You already have a pending payout request');
    }

    // Count appointments in period
    const periodFilter = { doctor: doctor._id, status: 'completed', 'payment.status': 'paid' };
    if (periodFrom) periodFilter.appointmentDate = { $gte: new Date(periodFrom) };
    if (periodTo) {
        periodFilter.appointmentDate = {
            ...periodFilter.appointmentDate,
            $lte: new Date(periodTo),
        };
    }
    const appointmentCount = await Appointment.countDocuments(periodFilter);

    const payout = await Payout.create({
        doctor: doctor._id,
        amount: Number(amount),
        method: method || 'bank_transfer',
        bankDetails: bankDetails || {},
        periodFrom: periodFrom ? new Date(periodFrom) : undefined,
        periodTo: periodTo ? new Date(periodTo) : undefined,
        appointmentCount,
    });

    res.status(201).json({ success: true, payout });
});

// @desc    Get doctor's payout history
// @route   GET /api/payouts/my-payouts
// @access  Private (Doctor)
const getMyPayouts = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor profile not found');
    }

    const { status, page = 1, limit = 10 } = req.query;
    const filter = { doctor: doctor._id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Payout.countDocuments(filter);

    const payouts = await Payout.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    // Earnings summary
    const completedPayouts = await Payout.aggregate([
        { $match: { doctor: doctor._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalPaidOut = completedPayouts[0]?.total || 0;
    const availableBalance = doctor.totalEarnings - totalPaidOut;

    res.json({
        success: true,
        count: payouts.length,
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        payouts,
        summary: {
            totalEarnings: doctor.totalEarnings,
            totalPaidOut,
            availableBalance,
        },
    });
});

// @desc    Get doctor earnings breakdown (monthly)
// @route   GET /api/payouts/earnings-breakdown
// @access  Private (Doctor)
const getEarningsBreakdown = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor profile not found');
    }

    const { months = 6 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Number(months));

    const monthlyEarnings = await Appointment.aggregate([
        {
            $match: {
                doctor: doctor._id,
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
                earnings: { $sum: '$payment.amount' },
                appointments: { $sum: 1 },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Top earning appointment types
    const byType = await Appointment.aggregate([
        {
            $match: {
                doctor: doctor._id,
                status: 'completed',
                'payment.status': 'paid',
            },
        },
        {
            $group: {
                _id: '$type',
                earnings: { $sum: '$payment.amount' },
                count: { $sum: 1 },
            },
        },
    ]);

    // Completed payouts
    const completedPayouts = await Payout.aggregate([
        { $match: { doctor: doctor._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalPaidOut = completedPayouts[0]?.total || 0;

    res.json({
        success: true,
        summary: {
            totalEarnings: doctor.totalEarnings,
            totalPaidOut,
            availableBalance: doctor.totalEarnings - totalPaidOut,
            totalAppointments: doctor.totalAppointments,
        },
        monthlyEarnings,
        byType,
    });
});

// @desc    Get all payouts (admin)
// @route   GET /api/payouts/admin/all
// @access  Private (Admin)
const getAllPayouts = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Payout.countDocuments(filter);

    const payouts = await Payout.find(filter)
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    res.json({
        success: true,
        count: payouts.length,
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        payouts,
    });
});

// @desc    Process payout (admin approve/reject)
// @route   PUT /api/payouts/admin/:id/process
// @access  Private (Admin)
const processPayout = asyncHandler(async (req, res) => {
    const { status, transactionId, notes } = req.body;

    if (!['completed', 'rejected', 'processing'].includes(status)) {
        res.status(400);
        throw new Error('Invalid status');
    }

    const payout = await Payout.findById(req.params.id)
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } });

    if (!payout) {
        res.status(404);
        throw new Error('Payout not found');
    }

    payout.status = status;
    if (transactionId) payout.transactionId = transactionId;
    if (notes) payout.notes = notes;
    if (status === 'completed' || status === 'processing') {
        payout.processedAt = new Date();
        payout.processedBy = req.user._id;
    }

    await payout.save();

    // Notify doctor
    const doctorUser = await User.findById(payout.doctor.user._id);
    const msg = status === 'completed'
        ? `Your payout of ₹${payout.amount} has been processed successfully.`
        : status === 'rejected'
            ? `Your payout request of ₹${payout.amount} was rejected. ${notes || ''}`
            : `Your payout of ₹${payout.amount} is being processed.`;

    doctorUser.addNotification(msg, 'payment');
    await doctorUser.save({ validateBeforeSave: false });

    await logAudit({
        actor: req.user,
        action: 'PROCESS_PAYOUT',
        resource: 'payout',
        resourceId: payout._id,
        details: `${status} payout of ₹${payout.amount} for Dr. ${payout.doctor.user.name}`,
        req,
    });

    res.json({ success: true, payout });
});

module.exports = {
    requestPayout,
    getMyPayouts,
    getEarningsBreakdown,
    getAllPayouts,
    processPayout,
};
