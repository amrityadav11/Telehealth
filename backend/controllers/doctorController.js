const asyncHandler = require('express-async-handler');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

// @desc    Get all approved doctors (with filters)
// @route   GET /api/doctors
// @access  Public
const getDoctors = asyncHandler(async (req, res) => {
    const {
        category,
        specialization,
        minFee,
        maxFee,
        minRating,
        search,
        page = 1,
        limit = 10,
        sortBy = 'rating',
    } = req.query;

    const filter = { isApproved: true };

    if (category) filter.category = category;
    if (specialization) filter.specialization = new RegExp(specialization, 'i');
    if (minFee || maxFee) {
        filter.consultationFee = {};
        if (minFee) filter.consultationFee.$gte = Number(minFee);
        if (maxFee) filter.consultationFee.$lte = Number(maxFee);
    }
    if (minRating) filter.rating = { $gte: Number(minRating) };

    // Text search on user name
    let userIds = [];
    if (search) {
        const users = await User.find({ name: new RegExp(search, 'i'), role: 'doctor' }).select('_id');
        userIds = users.map((u) => u._id);
        filter.$or = [
            { user: { $in: userIds } },
            { specialization: new RegExp(search, 'i') },
        ];
    }

    const sortOptions = {
        rating: { rating: -1 },
        fee_asc: { consultationFee: 1 },
        fee_desc: { consultationFee: -1 },
        experience: { experience: -1 },
        newest: { createdAt: -1 },
    };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Doctor.countDocuments(filter);

    const doctors = await Doctor.find(filter)
        .populate('user', 'name email avatar phone')
        .sort(sortOptions[sortBy] || { rating: -1 })
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

// @desc    Get single doctor
// @route   GET /api/doctors/:id
// @access  Public
const getDoctor = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id)
        .populate('user', 'name email avatar phone')
        .populate({
            path: 'reviews',
            populate: { path: 'patient', select: 'name avatar' },
            options: { limit: 10, sort: { createdAt: -1 } },
        });

    if (!doctor) {
        res.status(404);
        throw new Error('Doctor not found');
    }

    res.json({ success: true, doctor });
});

// @desc    Update doctor profile
// @route   PUT /api/doctors/profile
// @access  Private (Doctor)
const updateDoctorProfile = asyncHandler(async (req, res) => {
    const {
        specialization,
        category,
        experience,
        consultationFee,
        bio,
        education,
        certifications,
        availability,
        languages,
        hospitalAffiliation,
        licenseNumber,
    } = req.body;

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor profile not found');
    }

    const updateData = {};
    if (specialization) updateData.specialization = specialization;
    if (category) updateData.category = category;
    if (experience !== undefined) updateData.experience = experience;
    if (consultationFee !== undefined) updateData.consultationFee = consultationFee;
    if (bio) updateData.bio = bio;
    if (education) updateData.education = education;
    if (certifications) updateData.certifications = certifications;
    if (availability) updateData.availability = availability;
    if (languages) updateData.languages = languages;
    if (hospitalAffiliation) updateData.hospitalAffiliation = hospitalAffiliation;
    if (licenseNumber) updateData.licenseNumber = licenseNumber;

    const updatedDoctor = await Doctor.findByIdAndUpdate(doctor._id, updateData, {
        new: true,
        runValidators: true,
    }).populate('user', 'name email avatar phone');

    res.json({ success: true, doctor: updatedDoctor });
});

// @desc    Get doctor's own profile
// @route   GET /api/doctors/my-profile
// @access  Private (Doctor)
const getMyProfile = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findOne({ user: req.user._id }).populate(
        'user',
        'name email avatar phone'
    );

    if (!doctor) {
        res.status(404);
        throw new Error('Doctor profile not found');
    }

    res.json({ success: true, doctor });
});

// @desc    Get available time slots for a doctor on a date
// @route   GET /api/doctors/:id/slots
// @access  Public
const getAvailableSlots = asyncHandler(async (req, res) => {
    const { date } = req.query;

    if (!date) {
        res.status(400);
        throw new Error('Date is required');
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor not found');
    }

    const appointmentDate = new Date(date);
    const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Find availability for that day
    const dayAvailability = doctor.availability.find(
        (a) => a.day === dayName && a.isAvailable
    );

    if (!dayAvailability) {
        return res.json({ success: true, slots: [], message: 'Doctor not available on this day' });
    }

    // Generate all slots
    const allSlots = generateTimeSlots(
        dayAvailability.startTime,
        dayAvailability.endTime,
        dayAvailability.slotDuration
    );

    // Get booked slots for that date
    const bookedAppointments = await Appointment.find({
        doctor: req.params.id,
        appointmentDate: {
            $gte: new Date(date),
            $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
        },
        status: { $in: ['pending', 'confirmed'] },
    }).select('timeSlot');

    const bookedSlots = bookedAppointments.map((a) => a.timeSlot.startTime);

    const availableSlots = allSlots.map((slot) => ({
        ...slot,
        isBooked: bookedSlots.includes(slot.startTime),
    }));

    res.json({ success: true, slots: availableSlots, date, day: dayName });
});

// Helper: generate time slots
const generateTimeSlots = (startTime, endTime, duration = 30) => {
    const slots = [];
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    let current = startH * 60 + startM;
    const end = endH * 60 + endM;

    while (current + duration <= end) {
        const startHour = Math.floor(current / 60);
        const startMin = current % 60;
        const endHour = Math.floor((current + duration) / 60);
        const endMin = (current + duration) % 60;

        slots.push({
            startTime: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
            endTime: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
        });

        current += duration;
    }

    return slots;
};

// @desc    Get doctor's appointment stats
// @route   GET /api/doctors/stats
// @access  Private (Doctor)
const getDoctorStats = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor profile not found');
    }

    const [total, pending, confirmed, completed, cancelled] = await Promise.all([
        Appointment.countDocuments({ doctor: doctor._id }),
        Appointment.countDocuments({ doctor: doctor._id, status: 'pending' }),
        Appointment.countDocuments({ doctor: doctor._id, status: 'confirmed' }),
        Appointment.countDocuments({ doctor: doctor._id, status: 'completed' }),
        Appointment.countDocuments({ doctor: doctor._id, status: 'cancelled' }),
    ]);

    // Monthly earnings (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyEarnings = await Appointment.aggregate([
        {
            $match: {
                doctor: doctor._id,
                status: 'completed',
                'payment.status': 'paid',
                createdAt: { $gte: sixMonthsAgo },
            },
        },
        {
            $group: {
                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                earnings: { $sum: '$payment.amount' },
                count: { $sum: 1 },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
        success: true,
        stats: {
            total,
            pending,
            confirmed,
            completed,
            cancelled,
            totalEarnings: doctor.totalEarnings,
            rating: doctor.rating,
            numReviews: doctor.numReviews,
            monthlyEarnings,
        },
    });
});

// @desc    Get categories list
// @route   GET /api/doctors/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
    const categories = await Doctor.distinct('category', { isApproved: true });
    res.json({ success: true, categories });
});

module.exports = {
    getDoctors,
    getDoctor,
    updateDoctorProfile,
    getMyProfile,
    getAvailableSlots,
    getDoctorStats,
    getCategories,
};
