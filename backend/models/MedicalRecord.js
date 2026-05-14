const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment',
            default: null,
        },
        title: {
            type: String,
            required: [true, 'Record title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
            trim: true,
        },
        recordType: {
            type: String,
            enum: ['lab_report', 'prescription', 'imaging', 'vaccination', 'discharge_summary', 'other'],
            default: 'other',
        },
        file: {
            public_id: String,
            url: { type: String, required: true },
            originalName: String,
            mimeType: String,
            size: Number,
        },
        uploadedBy: {
            type: String,
            enum: ['patient', 'doctor'],
            default: 'patient',
        },
        isSharedWithDoctor: {
            type: Boolean,
            default: true,
        },
        tags: [{ type: String, trim: true }],
    },
    { timestamps: true }
);

medicalRecordSchema.index({ patient: 1, createdAt: -1 });
medicalRecordSchema.index({ appointment: 1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
