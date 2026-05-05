const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');

// @desc    Create a new admin account
// @route   POST /api/admin/create-admin
// @access  Private (Admin)
const createAdmin = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Name, email, and password are required');
    }

    if (password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters');
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
        res.status(400);
        throw new Error('An account with this email already exists');
    }

    const admin = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role: 'admin',
        isEmailVerified: true,
        isActive: true,
    });

    res.status(201).json({
        success: true,
        message: 'Admin account created successfully',
        admin: {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
        },
    });
});

// @desc    Promote an existing user to admin (or demote back)
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
const changeUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;

    const allowed = ['patient', 'doctor', 'admin'];
    if (!allowed.includes(role)) {
        res.status(400);
        throw new Error(`Role must be one of: ${allowed.join(', ')}`);
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Prevent removing the last admin
    if (user.role === 'admin' && role !== 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
            res.status(400);
            throw new Error('Cannot demote the only admin account');
        }
    }

    // Prevent self-demotion
    if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
        res.status(400);
        throw new Error('You cannot change your own role');
    }

    const oldRole = user.role;
    user.role = role;
    await user.save({ validateBeforeSave: false });

    res.json({
        success: true,
        message: `User role changed from ${oldRole} to ${role}`,
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
});

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getDashboardStats = asyncHandler(async (req, res) => {
    const [
        totalUsers,
        totalDoctors,
        totalPatients,
        pendingDoctors,
        totalAppointments,
        pendingAppointments,
        completedAppointments,
    ] = await Promise.all([
        User.countDocuments({ isActive: true }),
        Doctor.countDocuments({ isApproved: true }),
        User.countDocuments({ role: 'patient', isActive: true }),
        Doctor.countDocuments({ isApproved: false }),
        Appointment.countDocuments(),
        Appointment.countDocuments({ status: 'pending' }),
        Appointment.countDocuments({ status: 'completed' }),
    ]);

    // Total revenue
    const revenueResult = await Appointment.aggregate([
        { $match: { status: 'completed', 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Monthly stats (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Appointment.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                appointments: { $sum: 1 },
                revenue: {
                    $sum: {
                        $cond: [{ $eq: ['$payment.status', 'paid'] }, '$payment.amount', 0],
                    },
                },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Recent appointments
    const recentAppointments = await Appointment.find()
        .populate('patient', 'name email')
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
        .sort({ createdAt: -1 })
        .limit(5);

    res.json({
        success: true,
        stats: {
            totalUsers,
            totalDoctors,
            totalPatients,
            pendingDoctors,
            totalAppointments,
            pendingAppointments,
            completedAppointments,
            totalRevenue,
            monthlyStats,
            recentAppointments,
        },
    });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = asyncHandler(async (req, res) => {
    const { role, search, page = 1, limit = 20, isActive } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
        filter.$or = [
            { name: new RegExp(search, 'i') },
            { email: new RegExp(search, 'i') },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(filter);

    const users = await User.find(filter)
        .select('-password -notifications')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    res.json({
        success: true,
        count: users.length,
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        users,
    });
});

// @desc    Get all doctors (including pending)
// @route   GET /api/admin/doctors
// @access  Private (Admin)
const getAllDoctors = asyncHandler(async (req, res) => {
    const { isApproved, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Doctor.countDocuments(filter);

    const doctors = await Doctor.find(filter)
        .populate('user', 'name email avatar phone createdAt isActive')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    res.json({
        success: true,
        count: doctors.length,
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        doctors,
    });
});

// @desc    Approve or reject doctor
// @route   PUT /api/admin/doctors/:id/approval
// @access  Private (Admin)
const updateDoctorApproval = asyncHandler(async (req, res) => {
    const { isApproved, rejectionReason } = req.body;

    const doctor = await Doctor.findById(req.params.id).populate('user', 'name email');
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor not found');
    }

    doctor.isApproved = isApproved;
    if (isApproved) {
        doctor.approvedAt = new Date();
        doctor.approvedBy = req.user._id;
    }
    await doctor.save();

    // Notify doctor
    const doctorUser = await User.findById(doctor.user._id);
    const message = isApproved
        ? 'Your doctor profile has been approved! You can now receive appointments.'
        : `Your doctor profile was rejected. Reason: ${rejectionReason || 'Not specified'}`;

    doctorUser.addNotification(message, 'system');
    await doctorUser.save({ validateBeforeSave: false });

    // Send email
    try {
        const { sendEmail } = require('../utils/sendEmail');
        await sendEmail({
            email: doctor.user.email,
            subject: isApproved ? 'Profile Approved - TeleMed' : 'Profile Update Required - TeleMed',
            template: 'doctorApproval',
            data: { name: doctor.user.name, isApproved, rejectionReason },
        });
    } catch (err) {
        console.error('Email error:', err.message);
    }

    res.json({ success: true, doctor, message: `Doctor ${isApproved ? 'approved' : 'rejected'}` });
});

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Private (Admin)
const toggleUserStatus = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.role === 'admin') {
        res.status(400);
        throw new Error('Cannot deactivate admin accounts');
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.json({
        success: true,
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
        user: { _id: user._id, name: user.name, isActive: user.isActive },
    });
});

// @desc    Get all appointments (admin)
// @route   GET /api/admin/appointments
// @access  Private (Admin)
const getAllAppointments = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Appointment.countDocuments(filter);

    const appointments = await Appointment.find(filter)
        .populate('patient', 'name email')
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    res.json({
        success: true,
        count: appointments.length,
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        appointments,
    });
});

// @desc    Delete review (admin moderation)
// @route   DELETE /api/admin/reviews/:id
// @access  Private (Admin)
const deleteReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    await Review.findByIdAndDelete(review._id);
    res.json({ success: true, message: 'Review removed' });
});

module.exports = {
    createAdmin,
    changeUserRole,
    getDashboardStats,
    getAllUsers,
    getAllDoctors,
    updateDoctorApproval,
    toggleUserStatus,
    getAllAppointments,
    deleteReview,
};
