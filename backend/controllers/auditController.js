const asyncHandler = require('express-async-handler');
const AuditLog = require('../models/AuditLog');

// @desc    Get audit logs (admin only)
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
const getAuditLogs = asyncHandler(async (req, res) => {
    const { action, actorRole, page = 1, limit = 50, search } = req.query;

    const filter = {};
    if (action) filter.action = new RegExp(action, 'i');
    if (actorRole) filter.actorRole = actorRole;
    if (search) {
        filter.$or = [
            { actorName: new RegExp(search, 'i') },
            { action: new RegExp(search, 'i') },
            { details: new RegExp(search, 'i') },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AuditLog.countDocuments(filter);

    const logs = await AuditLog.find(filter)
        .populate('actor', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    res.json({
        success: true,
        count: logs.length,
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        logs,
    });
});

module.exports = { getAuditLogs };
