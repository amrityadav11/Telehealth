const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        actor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        actorName: { type: String },
        actorRole: { type: String, enum: ['patient', 'doctor', 'admin'] },
        action: {
            type: String,
            required: true,
            // e.g. 'LOGIN', 'LOGOUT', 'APPROVE_DOCTOR', 'CANCEL_APPOINTMENT', etc.
        },
        resource: {
            type: String,
            // e.g. 'appointment', 'doctor', 'user', 'review'
        },
        resourceId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        details: {
            type: String,
            maxlength: 500,
        },
        ipAddress: String,
        userAgent: String,
        status: {
            type: String,
            enum: ['success', 'failure'],
            default: 'success',
        },
    },
    { timestamps: true }
);

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
