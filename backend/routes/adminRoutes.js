const express = require('express');
const router = express.Router();
const {
    createAdmin,
    createDoctor,
    changeUserRole,
    getDashboardStats,
    getAllUsers,
    getAllDoctors,
    updateDoctorApproval,
    toggleUserStatus,
    getAllAppointments,
    deleteReview,
} = require('../controllers/adminController');
const { getAuditLogs } = require('../controllers/auditController');
const {
    getRevenueAnalytics,
    getAppointmentHeatmap,
    getDoctorPerformance,
    getPatientAnalytics,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes require admin role
router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/doctors', getAllDoctors);
router.post('/doctors', createDoctor);          // Admin creates doctor directly
router.get('/appointments', getAllAppointments);

router.post('/create-admin', createAdmin);          // NEW
router.put('/users/:id/role', changeUserRole);       // NEW
router.put('/doctors/:id/approval', updateDoctorApproval);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.delete('/reviews/:id', deleteReview);

// Audit logs
router.get('/audit-logs', getAuditLogs);

// Analytics
router.get('/analytics/revenue', getRevenueAnalytics);
router.get('/analytics/heatmap', getAppointmentHeatmap);
router.get('/analytics/doctors', getDoctorPerformance);
router.get('/analytics/patients', getPatientAnalytics);

// Doctor verification badge
router.put('/doctors/:id/verify', async (req, res) => {
    try {
        const Doctor = require('../models/Doctor');
        const User = require('../models/User');
        const { logAudit } = require('../utils/auditLogger');

        const doctor = await Doctor.findById(req.params.id).populate('user', 'name email');
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

        doctor.isVerified = !doctor.isVerified;
        if (doctor.isVerified) doctor.verifiedAt = new Date();
        await doctor.save();

        // Notify doctor
        const doctorUser = await User.findById(doctor.user._id);
        doctorUser.addNotification(
            doctor.isVerified
                ? '✅ Your profile has been verified! A verification badge is now displayed on your profile.'
                : 'Your verification badge has been removed.',
            'system'
        );
        await doctorUser.save({ validateBeforeSave: false });

        await logAudit({
            actor: req.user,
            action: doctor.isVerified ? 'VERIFY_DOCTOR' : 'UNVERIFY_DOCTOR',
            resource: 'doctor',
            resourceId: doctor._id,
            details: `${doctor.isVerified ? 'Verified' : 'Unverified'} Dr. ${doctor.user.name}`,
            req,
        });

        res.json({ success: true, doctor, message: `Doctor ${doctor.isVerified ? 'verified' : 'unverified'}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
