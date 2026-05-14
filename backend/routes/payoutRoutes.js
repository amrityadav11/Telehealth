const express = require('express');
const router = express.Router();
const {
    requestPayout,
    getMyPayouts,
    getEarningsBreakdown,
    getAllPayouts,
    processPayout,
} = require('../controllers/payoutController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Doctor routes
router.post('/request', authorize('doctor'), requestPayout);
router.get('/my-payouts', authorize('doctor'), getMyPayouts);
router.get('/earnings-breakdown', authorize('doctor'), getEarningsBreakdown);

// Admin routes
router.get('/admin/all', authorize('admin'), getAllPayouts);
router.put('/admin/:id/process', authorize('admin'), processPayout);

module.exports = router;
