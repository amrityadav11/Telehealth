const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const appointmentSchema = new mongoose.Schema(
    {
        appointmentId: {
            type: String,
            default: () => `APT-${uuidv4().slice(0, 8).toUpperCase()}`,
            unique: true,
        },
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
        appointmentDate: {
            type: Date,
            required: [true, 'Appointment date is required'],
        },
        timeSlot: {
            startTime: { type: String, required: true }, // "10:00"
            endTime: { type: String, required: true },   // "10:30"
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
            default: 'pending',
        },
        type: {
            type: String,
            enum: ['video', 'in-person'],
            default: 'video',
        },
        symptoms: {
            type: String,
            maxlength: [500, 'Symptoms description cannot exceed 500 characters'],
        },
        notes: {
            type: String,
            maxlength: [1000, 'Notes cannot exceed 1000 characters'],
        },
        prescription: {
            medicines: [
                {
                    name: String,
                    dosage: String,
                    frequency: String,
                    duration: String,
                },
            ],
            instructions: String,
            followUpDate: Date,
        },
        payment: {
            amount: { type: Number, required: true },
            status: {
                type: String,
                enum: ['pending', 'paid', 'refunded', 'failed'],
                default: 'pending',
            },
            method: {
                type: String,
                enum: ['stripe', 'mock', 'cash'],
                default: 'mock',
            },
            transactionId: String,
            paidAt: Date,
        },
        consultation: {
            roomId: String,
            startedAt: Date,
            endedAt: Date,
            duration: Number, // minutes
        },
        cancelledBy: {
            type: String,
            enum: ['patient', 'doctor', 'admin'],
        },
        cancellationReason: String,
        reminderSent: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Prevent double booking: same doctor, same date, same time slot
appointmentSchema.index(
    { doctor: 1, appointmentDate: 1, 'timeSlot.startTime': 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } },
    }
);

appointmentSchema.index({ patient: 1, appointmentDate: -1 });
appointmentSchema.index({ doctor: 1, appointmentDate: -1 });
appointmentSchema.index({ status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
