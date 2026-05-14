const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        senderName: { type: String, required: true },
        senderRole: { type: String, enum: ['patient', 'doctor'], required: true },
        message: {
            type: String,
            maxlength: [2000, 'Message cannot exceed 2000 characters'],
            trim: true,
        },
        // Media attachment
        media: {
            url: String,
            public_id: String,
            type: { type: String, enum: ['image', 'video', 'file'] },
            name: String,   // original filename
            size: Number,   // bytes
        },
        readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true }
);

const chatSchema = new mongoose.Schema(
    {
        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment',
            required: true,
            unique: true,
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        messages: [messageSchema],
        lastMessage: {
            text: String,
            at: Date,
            senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        },
    },
    { timestamps: true }
);

chatSchema.index({ appointment: 1 });
chatSchema.index({ doctor: 1 });
chatSchema.index({ patient: 1 });

module.exports = mongoose.model('Chat', chatSchema);
