const express = require('express');
const router = express.Router();
const {
    createAdmin,
    changeUserRole,
    getDashboardStats,
    getAllUsers,
    getAllDoctors,
    updateDoctorApproval,
    toggleUserStatus,
    getAllAppointments,
    deleteReview,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes require admin role
router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/doctors', getAllDoctors);
router.get('/appointments', getAllAppointments);

router.post('/create-admin', createAdmin);          // NEW
router.put('/users/:id/role', changeUserRole);       // NEW
router.put('/doctors/:id/approval', updateDoctorApproval);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.delete('/reviews/:id', deleteReview);

module.exports = router;
