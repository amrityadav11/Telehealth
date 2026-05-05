const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// @desc    Create review
// @route   POST /api/reviews
// @access  Private (Patient)
const createReview = asyncHandler(async (req, res) => {
    const { appointmentId, rating, comment } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
        res.status(404);
        throw new Error('Appointment not found');
    }

    if (appointment.patient.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to review this appointment');
    }

    if (appointment.status !== 'completed') {
        res.status(400);
        throw new Error('Can only review completed appointments');
    }

    const existingReview = await Review.findOne({ appointment: appointmentId });
    if (existingReview) {
        res.status(400);
        throw new Error('You have already reviewed this appointment');
    }

    const review = await Review.create({
        patient: req.user._id,
        doctor: appointment.doctor,
        appointment: appointmentId,
        rating,
        comment,
    });

    await review.populate('patient', 'name avatar');

    res.status(201).json({ success: true, review });
});

// @desc    Get reviews for a doctor
// @route   GET /api/reviews/doctor/:doctorId
// @access  Public
const getDoctorReviews = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor not found');
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Review.countDocuments({ doctor: req.params.doctorId, isVisible: true });

    const reviews = await Review.find({ doctor: req.params.doctorId, isVisible: true })
        .populate('patient', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    res.json({
        success: true,
        count: reviews.length,
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        reviews,
        averageRating: doctor.rating,
        numReviews: doctor.numReviews,
    });
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private (Patient - own review)
const updateReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    if (review.patient.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this review');
    }

    const { rating, comment } = req.body;
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;

    await review.save();
    await Review.calcAverageRating(review.doctor);

    res.json({ success: true, review });
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (Patient - own review, Admin)
const deleteReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    const isOwner = review.patient.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
        res.status(403);
        throw new Error('Not authorized');
    }

    await Review.findByIdAndDelete(review._id);
    await Review.calcAverageRating(review.doctor);
    res.json({ success: true, message: 'Review removed' });
});

// @desc    Toggle review visibility (admin moderation)
// @route   PUT /api/reviews/:id/moderate
// @access  Private (Admin)
const moderateReview = asyncHandler(async (req, res) => {
    const { isVisible } = req.body;
    const review = await Review.findById(req.params.id).populate('patient', 'name');
    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }
    review.isVisible = isVisible;
    await review.save();
    await Review.calcAverageRating(review.doctor);
    res.json({ success: true, review, message: `Review ${isVisible ? 'approved' : 'hidden'}` });
});

// @desc    Get all reviews (admin)
// @route   GET /api/reviews/admin/all
// @access  Private (Admin)
const getAllReviews = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, isVisible } = req.query;
    const filter = {};
    if (isVisible !== undefined) filter.isVisible = isVisible === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
        .populate('patient', 'name avatar')
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    res.json({ success: true, reviews, total, pages: Math.ceil(total / Number(limit)), currentPage: Number(page) });
});

module.exports = { createReview, getDoctorReviews, updateReview, deleteReview, moderateReview, getAllReviews };
