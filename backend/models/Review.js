const mongoose = require('mongoose');
const Doctor = require('./Doctor');

const reviewSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor',
            required: true,
        },
        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment',
            required: true,
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: [true, 'Review comment is required'],
            maxlength: [500, 'Comment cannot exceed 500 characters'],
        },
        isVisible: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// One review per appointment
reviewSchema.index({ appointment: 1 }, { unique: true });
reviewSchema.index({ doctor: 1, patient: 1 });

// Recalculate doctor's average rating after save
reviewSchema.statics.calcAverageRating = async function (doctorId) {
    const stats = await this.aggregate([
        { $match: { doctor: doctorId, isVisible: true } },
        {
            $group: {
                _id: '$doctor',
                avgRating: { $avg: '$rating' },
                numReviews: { $sum: 1 },
            },
        },
    ]);

    if (stats.length > 0) {
        await Doctor.findByIdAndUpdate(doctorId, {
            rating: Math.round(stats[0].avgRating * 10) / 10,
            numReviews: stats[0].numReviews,
        });
    } else {
        await Doctor.findByIdAndUpdate(doctorId, { rating: 0, numReviews: 0 });
    }
};

reviewSchema.post('save', function () {
    this.constructor.calcAverageRating(this.doctor);
});

// Mongoose 8 compatible — fires after findByIdAndDelete
reviewSchema.post('findOneAndDelete', function (doc) {
    if (doc) doc.constructor.calcAverageRating(doc.doctor);
});

module.exports = mongoose.model('Review', reviewSchema);
