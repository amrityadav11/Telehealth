const mongoose = require('mongoose');

const healthVitalSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: [
                'blood_pressure',
                'blood_sugar',
                'weight',
                'heart_rate',
                'temperature',
                'oxygen_saturation',
                'bmi',
            ],
            required: true,
        },
        // For blood pressure: { systolic, diastolic }
        // For others: { value }
        value: {
            type: Number,
        },
        systolic: Number,   // mmHg
        diastolic: Number,  // mmHg
        unit: {
            type: String,
            default: '',
        },
        notes: {
            type: String,
            maxlength: [300, 'Notes cannot exceed 300 characters'],
        },
        recordedAt: {
            type: Date,
            default: Date.now,
        },
        // Flag if reading is outside normal range
        isAbnormal: {
            type: Boolean,
            default: false,
        },
        // Patient can choose to share with their doctor
        isSharedWithDoctor: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

healthVitalSchema.index({ patient: 1, type: 1, recordedAt: -1 });

module.exports = mongoose.model('HealthVital', healthVitalSchema);
