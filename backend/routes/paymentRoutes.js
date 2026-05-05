const express = require('express');
const router = express.Router();
const {
    createPaymentIntent,
    confirmPayment,
    stripeWebhook,
    requestRefund,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Stripe webhook needs raw body
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

router.post('/create-intent', protect, authorize('patient'), createPaymentIntent);
router.post('/confirm', protect, authorize('patient'), confirmPayment);
router.post('/refund', protect, requestRefund);

module.exports = router;
