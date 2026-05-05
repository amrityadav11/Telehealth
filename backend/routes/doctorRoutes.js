const express = require('express');
const router = express.Router();
const {
    getDoctors,
    getDoctor,
    updateDoctorProfile,
    getMyProfile,
    getAvailableSlots,
    getDoctorStats,
    getCategories,
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { doctorProfileValidator } = require('../middleware/validationMiddleware');

// ── IMPORTANT: specific named routes MUST come before /:id param routes ──

// Public static routes
router.get('/categories', getCategories);

// Protected doctor routes (must be before /:id)
router.get('/my/profile', protect, authorize('doctor'), getMyProfile);
router.put('/my/profile', protect, authorize('doctor'), updateDoctorProfile);
router.get('/my/stats', protect, authorize('doctor'), getDoctorStats);

// Public list route
router.get('/', getDoctors);

// Public param routes (must be last)
router.get('/:id/slots', getAvailableSlots);
router.get('/:id', getDoctor);

module.exports = router;
