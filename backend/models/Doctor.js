const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true,
    },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true },   // "17:00"
    slotDuration: { type: Number, default: 30 }, // minutes per slot
    isAvailable: { type: Boolean, default: true },
});

const doctorSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        specialization: {
            type: String,
            required: [true, 'Specialization is required'],
            trim: true,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: [
                'Cardiology',
                'Dermatology',
                'Neurology',
                'Orthopedics',
                'Pediatrics',
                'Psychiatry',
                'Gynecology',
                'Ophthalmology',
                'ENT',
                'Oncology',
                'Urology',
                'Endocrinology',
                'Gastroenterology',
                'Pulmonology',
                'Nephrology',
                'General Practice',
                'Other',
            ],
        },
        experience: {
            type: Number,
            required: [true, 'Experience is required'],
            min: [0, 'Experience cannot be negative'],
        },
        consultationFee: {
            type: Number,
            required: [true, 'Consultation fee is required'],
            min: [0, 'Fee cannot be negative'],
        },
        bio: {
            type: String,
            maxlength: [1000, 'Bio cannot exceed 1000 characters'],
        },
        education: [
            {
                degree: String,
                institution: String,
                year: Number,
            },
        ],
        certifications: [
            {
                name: String,
                issuedBy: String,
                year: Number,
                document: {
                    public_id: String,
                    url: String,
                },
            },
        ],
        availability: [availabilitySlotSchema],
        isApproved: {
            type: Boolean,
            default: false,
        },
        approvedAt: Date,
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        isOnline: {
            type: Boolean,
            default: false,
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        numReviews: {
            type: Number,
            default: 0,
        },
        totalEarnings: {
            type: Number,
            default: 0,
        },
        totalAppointments: {
            type: Number,
            default: 0,
        },
        languages: [{ type: String }],
        hospitalAffiliation: String,
        licenseNumber: {
            type: String,
            required: [true, 'License number is required'],
        },
        // Verification badge — set by admin after manual license verification
        isVerified: {
            type: Boolean,
            default: false,
        },
        verifiedAt: Date,
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual for reviews
doctorSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'doctor',
});

// Index for search
doctorSchema.index({ specialization: 'text', category: 1 });
doctorSchema.index({ rating: -1, consultationFee: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
