const express = require('express');
const router = express.Router();
const {
    createReview,
    getDoctorReviews,
    updateReview,
    deleteReview,
    moderateReview,
    getAllReviews,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { reviewValidator } = require('../middleware/validationMiddleware');

router.post('/', protect, authorize('patient'), reviewValidator, createReview);
router.get('/admin/all', protect, authorize('admin'), getAllReviews);
router.get('/doctor/:doctorId', getDoctorReviews);
router.put('/:id', protect, authorize('patient'), reviewValidator, updateReview);
router.put('/:id/moderate', protect, authorize('admin'), moderateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
