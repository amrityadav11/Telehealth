const asyncHandler = require('express-async-handler');
const Appointment = require('../models/Appointment');

// Conditionally load Stripe
let stripe;
try {
    if (process.env.STRIPE_SECRET_KEY) {
        stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    }
} catch (e) {
    console.warn('Stripe not configured, using mock payments');
}

// @desc    Create Stripe payment intent
// @route   POST /api/payments/create-intent
// @access  Private (Patient)
const createPaymentIntent = asyncHandler(async (req, res) => {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId).populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name' },
    });

    if (!appointment) {
        res.status(404);
        throw new Error('Appointment not found');
    }

    if (appointment.patient.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized');
    }

    if (appointment.payment.status === 'paid') {
        res.status(400);
        throw new Error('Appointment already paid');
    }

    if (!stripe) {
        // Mock payment for development
        appointment.payment.status = 'paid';
        appointment.payment.method = 'mock';
        appointment.payment.transactionId = `mock_${Date.now()}`;
        appointment.payment.paidAt = new Date();
        await appointment.save();

        return res.json({
            success: true,
            mock: true,
            message: 'Mock payment processed successfully',
            appointment,
        });
    }

    // Real Stripe payment
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(appointment.payment.amount * 100), // cents
        currency: 'usd',
        metadata: {
            appointmentId: appointment._id.toString(),
            patientId: req.user._id.toString(),
        },
    });

    res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        amount: appointment.payment.amount,
    });
});

// @desc    Confirm payment after Stripe success
// @route   POST /api/payments/confirm
// @access  Private (Patient)
const confirmPayment = asyncHandler(async (req, res) => {
    const { appointmentId, paymentIntentId } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
        res.status(404);
        throw new Error('Appointment not found');
    }

    if (appointment.patient.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized');
    }

    // Verify with Stripe
    if (stripe && paymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
            res.status(400);
            throw new Error('Payment not successful');
        }
    }

    appointment.payment.status = 'paid';
    appointment.payment.method = stripe ? 'stripe' : 'mock';
    appointment.payment.transactionId = paymentIntentId || `mock_${Date.now()}`;
    appointment.payment.paidAt = new Date();
    await appointment.save();

    // Send payment receipt email
    try {
        const { sendEmail } = require('../utils/sendEmail');
        const populatedAppt = await appointment.populate([
            { path: 'patient', select: 'name email' },
            { path: 'doctor', populate: { path: 'user', select: 'name' } },
        ]);
        await sendEmail({
            email: populatedAppt.patient.email,
            template: 'paymentReceipt',
            data: {
                patientName: populatedAppt.patient.name,
                doctorName: populatedAppt.doctor.user.name,
                date: populatedAppt.appointmentDate.toDateString(),
                time: populatedAppt.timeSlot.startTime,
                amount: populatedAppt.payment.amount,
                transactionId: populatedAppt.payment.transactionId,
                appointmentId: populatedAppt.appointmentId,
            },
        });
    } catch (err) {
        console.error('Receipt email error:', err.message);
    }

    res.json({ success: true, message: 'Payment confirmed', appointment });
});

// @desc    Stripe webhook handler
// @route   POST /api/payments/webhook
// @access  Public (Stripe)
const stripeWebhook = asyncHandler(async (req, res) => {
    if (!stripe) {
        return res.json({ received: true });
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        res.status(400);
        throw new Error(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const { appointmentId } = paymentIntent.metadata;

        await Appointment.findByIdAndUpdate(appointmentId, {
            'payment.status': 'paid',
            'payment.transactionId': paymentIntent.id,
            'payment.paidAt': new Date(),
        });
    }

    res.json({ received: true });
});

// @desc    Request refund
// @route   POST /api/payments/refund
// @access  Private (Patient/Admin)
const requestRefund = asyncHandler(async (req, res) => {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
        res.status(404);
        throw new Error('Appointment not found');
    }

    if (appointment.payment.status !== 'paid') {
        res.status(400);
        throw new Error('No payment to refund');
    }

    if (appointment.status !== 'cancelled') {
        res.status(400);
        throw new Error('Only cancelled appointments can be refunded');
    }

    if (stripe && appointment.payment.transactionId && !appointment.payment.transactionId.startsWith('mock_')) {
        await stripe.refunds.create({
            payment_intent: appointment.payment.transactionId,
        });
    }

    appointment.payment.status = 'refunded';
    await appointment.save();

    res.json({ success: true, message: 'Refund processed successfully' });
});

module.exports = { createPaymentIntent, confirmPayment, stripeWebhook, requestRefund };
