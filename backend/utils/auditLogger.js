const AuditLog = require('../models/AuditLog');

/**
 * Log an audit event.
 * @param {Object} params
 * @param {Object} params.actor - User object (must have _id, name, role)
 * @param {string} params.action - Action string e.g. 'LOGIN', 'APPROVE_DOCTOR'
 * @param {string} [params.resource] - Resource type e.g. 'appointment'
 * @param {string} [params.resourceId] - Resource ObjectId
 * @param {string} [params.details] - Human-readable detail
 * @param {Object} [params.req] - Express request (for IP/UA extraction)
 * @param {string} [params.status] - 'success' | 'failure'
 */
const logAudit = async ({
    actor,
    action,
    resource,
    resourceId,
    details,
    req,
    status = 'success',
}) => {
    try {
        await AuditLog.create({
            actor: actor._id,
            actorName: actor.name,
            actorRole: actor.role,
            action,
            resource,
            resourceId,
            details,
            ipAddress: req
                ? req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress
                : undefined,
            userAgent: req ? req.headers['user-agent'] : undefined,
            status,
        });
    } catch (err) {
        // Never let audit logging crash the main flow
        console.error('Audit log error:', err.message);
    }
};

module.exports = { logAudit };
