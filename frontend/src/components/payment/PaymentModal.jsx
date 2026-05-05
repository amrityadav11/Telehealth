import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import api from '../../services/api';
import Spinner from '../common/Spinner';
import { FaLock, FaCreditCard, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

const stripePromise = process.env.REACT_APP_STRIPE_PUBLIC_KEY &&
    !process.env.REACT_APP_STRIPE_PUBLIC_KEY.includes('placeholder')
    ? loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY)
    : null;

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            color: '#1f2937',
            fontFamily: '"Inter", sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': { color: '#9ca3af' },
        },
        invalid: { color: '#ef4444', iconColor: '#ef4444' },
    },
};

// Inner form — uses Stripe hooks, must be inside <Elements>
const CheckoutForm = ({ appointment, amount, onSuccess, onClose }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [cardError, setCardError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);
        setCardError('');

        try {
            // 1. Create payment intent on backend
            const { data } = await api.post('/payments/create-intent', {
                appointmentId: appointment._id,
            });

            // 2. Mock payment (no real Stripe key)
            if (data.mock) {
                toast.success('Payment processed successfully!');
                onSuccess(appointment);
                return;
            }

            // 3. Real Stripe payment
            const { error, paymentIntent } = await stripe.confirmCardPayment(
                data.clientSecret,
                {
                    payment_method: {
                        card: elements.getElement(CardElement),
                    },
                }
            );

            if (error) {
                setCardError(error.message);
                return;
            }

            if (paymentIntent.status === 'succeeded') {
                // 4. Confirm on backend
                const { data: confirmData } = await api.post('/payments/confirm', {
                    appointmentId: appointment._id,
                    paymentIntentId: paymentIntent.id,
                });
                toast.success('Payment successful!');
                onSuccess(confirmData.appointment);
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Payment failed. Please try again.';
            setCardError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Amount summary */}
            <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">Consultation Fee</p>
                    <p className="text-2xl font-bold text-gray-900">${amount}</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                    <p>{appointment.doctor?.user?.name || 'Doctor'}</p>
                    <p>{appointment.timeSlot?.startTime}</p>
                </div>
            </div>

            {/* Card input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FaCreditCard className="text-blue-500" /> Card Details
                </label>
                <div className="border border-gray-300 rounded-lg p-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all bg-white">
                    {stripePromise ? (
                        <CardElement options={CARD_ELEMENT_OPTIONS} />
                    ) : (
                        <div className="text-sm text-gray-500 py-1">
                            <span className="font-medium text-gray-700">Test Mode:</span> Payment will be processed as mock
                        </div>
                    )}
                </div>
                {cardError && (
                    <p className="mt-2 text-sm text-red-600">{cardError}</p>
                )}
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
                <FaLock />
                <span>Your payment is secured with 256-bit SSL encryption</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="btn-secondary flex-1"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <><Spinner size="sm" /> Processing...</>
                    ) : (
                        <><FaLock /> Pay ${amount}</>
                    )}
                </button>
            </div>
        </form>
    );
};

// Outer modal wrapper
const PaymentModal = ({ appointment, onSuccess, onClose }) => {
    if (!appointment) return null;

    const amount = appointment.payment?.amount || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                {stripePromise ? (
                    <Elements stripe={stripePromise}>
                        <CheckoutForm
                            appointment={appointment}
                            amount={amount}
                            onSuccess={onSuccess}
                            onClose={onClose}
                        />
                    </Elements>
                ) : (
                    // No Stripe key — mock payment UI
                    <MockPaymentForm
                        appointment={appointment}
                        amount={amount}
                        onSuccess={onSuccess}
                        onClose={onClose}
                    />
                )}
            </div>
        </div>
    );
};

// Mock payment form when Stripe is not configured
const MockPaymentForm = ({ appointment, amount, onSuccess, onClose }) => {
    const [loading, setLoading] = useState(false);

    const handleMockPay = async () => {
        setLoading(true);
        try {
            const { data } = await api.post('/payments/create-intent', {
                appointmentId: appointment._id,
            });
            toast.success('Payment processed successfully!');
            onSuccess(data.appointment || appointment);
        } catch (err) {
            const msg = err.response?.data?.message || 'Payment failed';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Amount summary */}
            <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">Consultation Fee</p>
                    <p className="text-2xl font-bold text-gray-900">${amount}</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                    <p>{appointment.doctor?.user?.name || 'Doctor'}</p>
                    <p>{appointment.timeSlot?.startTime}</p>
                </div>
            </div>

            {/* Dev notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <strong>Development Mode:</strong> Stripe is not configured. Clicking "Pay" will simulate a successful payment.
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
                <FaLock />
                <span>Your payment is secured with 256-bit SSL encryption</span>
            </div>

            <div className="flex gap-3 pt-1">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="btn-secondary flex-1"
                >
                    Cancel
                </button>
                <button
                    onClick={handleMockPay}
                    disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <><Spinner size="sm" /> Processing...</>
                    ) : (
                        <><FaLock /> Pay ${amount}</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default PaymentModal;
