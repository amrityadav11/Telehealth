const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment',
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor',
        },
        testName: {
            type: String,
            required: [true, 'Test name is required'],
            trim: true,
        },
        testType: {
            type: String,
            enum: [
                'Blood Test',
                'Urine Test',
                'X-Ray',
                'MRI',
                'CT Scan',
                'Ultrasound',
                'ECG',
                'Biopsy',
                'Stool Test',
                'Thyroid Test',
                'Lipid Profile',
                'Liver Function',
                'Kidney Function',
                'Blood Sugar',
                'Complete Blood Count',
                'Other',
            ],
            required: true,
        },
        status: {
            type: String,
            enum: ['ordered', 'sample_collected', 'processing', 'completed', 'cancelled'],
            default: 'ordered',
        },
        priority: {
            type: String,
            enum: ['routine', 'urgent', 'stat'],
            default: 'routine',
        },
        scheduledDate: Date,
        completedDate: Date,
        labName: String,
        labAddress: String,
        notes: {
            type: String,
            maxlength: [500, 'Notes cannot exceed 500 characters'],
        },
        // Uploaded report
        report: {
            public_id: String,
            url: String,
            uploadedAt: Date,
        },
        // Results summary (filled by doctor or patient after upload)
        results: {
            summary: String,
            normalRange: String,
            interpretation: String,
            isAbnormal: { type: Boolean, default: false },
        },
        price: {
            type: Number,
            default: 0,
        },
        isSharedWithDoctor: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

labTestSchema.index({ patient: 1, createdAt: -1 });
labTestSchema.index({ doctor: 1, status: 1 });

module.exports = mongoose.model('LabTest', labTestSchema);
