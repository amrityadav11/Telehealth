const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
    {
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: [1, 'Payout amount must be at least 1'],
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'rejected'],
            default: 'pending',
        },
        method: {
            type: String,
            enum: ['bank_transfer', 'upi', 'cheque'],
            default: 'bank_transfer',
        },
        bankDetails: {
            accountName: String,
            accountNumber: String,
            ifscCode: String,
            bankName: String,
            upiId: String,
        },
        transactionId: String,
        processedAt: Date,
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        notes: String,
        // Period this payout covers
        periodFrom: Date,
        periodTo: Date,
        // Appointments included in this payout
        appointmentCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

payoutSchema.index({ doctor: 1, status: 1 });
payoutSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Payout', payoutSchema);
