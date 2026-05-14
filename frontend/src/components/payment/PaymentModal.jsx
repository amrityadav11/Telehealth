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
import {
    FaLock,
    FaCreditCard,
    FaTimes,
    FaMobileAlt,
    FaUniversity,
    FaQrcode,
    FaDownload,
    FaCheckCircle,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { downloadReceiptPDF } from '../../utils/receiptPDF';

const stripePromise =
    process.env.REACT_APP_STRIPE_PUBLIC_KEY &&
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
    hidePostalCode: true,
};

const TABS = [
    { id: 'card', label: 'Card', icon: FaCreditCard },
    { id: 'upi', label: 'UPI', icon: FaMobileAlt },
    { id: 'qr', label: 'QR Code', icon: FaQrcode },
    { id: 'netbanking', label: 'Net Banking', icon: FaUniversity },
];

const BANKS = [
    'State Bank of India',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Kotak Mahindra Bank',
    'Punjab National Bank',
    'Bank of Baroda',
    'Canara Bank',
    'Union Bank of India',
    'IndusInd Bank',
];

// ── Receipt Success Screen ──────────────────────────────────────────────────
const ReceiptScreen = ({ appointment, onClose }) => (
    <div className="space-y-5 text-center">
        <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <FaCheckCircle className="text-green-500 text-4xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Payment Successful!</h3>
            <p className="text-gray-500 text-sm">
                Your appointment has been confirmed. A receipt has been sent to your email.
            </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-gray-500">Appointment ID</span>
                <span className="font-medium text-gray-900">{appointment.appointmentId || '—'}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-500">Doctor</span>
                <span className="font-medium text-gray-900">Dr. {appointment.doctor?.user?.name || '—'}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-bold text-green-600">₹ {appointment.payment?.amount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-500">Transaction ID</span>
                <span className="font-medium text-gray-900 text-xs">{appointment.payment?.transactionId || '—'}</span>
            </div>
        </div>

        <div className="flex gap-3">
            <button
                onClick={() => downloadReceiptPDF(appointment)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium transition-colors"
            >
                <FaDownload /> Download Receipt
            </button>
            <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
                Close
            </button>
        </div>
    </div>
);

// ── Card Tab — Real Stripe (must be inside <Elements>) ────────────────────
const StripeCardTab = ({ appointment, amount, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [cardError, setCardError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setCardError('');

        try {
            const { data } = await api.post('/payments/create-intent', {
                appointmentId: appointment._id,
            });

            if (!stripe || !elements) {
                setCardError('Stripe is not loaded. Please refresh and try again.');
                return;
            }

            const cardElement = elements.getElement(CardElement);
            if (!cardElement) {
                setCardError('Card element not found. Please refresh.');
                return;
            }

            const { error, paymentIntent } = await stripe.confirmCardPayment(
                data.clientSecret,
                { payment_method: { card: cardElement } }
            );

            if (error) {
                setCardError(error.message);
                return;
            }

            if (paymentIntent.status === 'succeeded') {
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
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                <div className="border border-gray-300 rounded-xl p-3.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white">
                    <CardElement options={CARD_ELEMENT_OPTIONS} />
                </div>
                {cardError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <FaTimes className="text-xs" /> {cardError}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
                <FaLock /> <span>256-bit SSL encrypted · Secured by Stripe</span>
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-colors"
            >
                {loading ? <><Spinner size="sm" /> Processing...</> : <><FaLock /> Pay ₹{amount}</>}
            </button>
        </form>
    );
};

// ── Card Tab — Mock / dev mode (no Stripe, no useStripe hook) ──────────────
const MockCardTab = ({ appointment, amount, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [cardError, setCardError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setCardError('');
        try {
            const { data } = await api.post('/payments/create-intent', {
                appointmentId: appointment._id,
            });
            toast.success('Payment processed successfully!');
            onSuccess(data.appointment || appointment);
        } catch (err) {
            const msg = err.response?.data?.message || 'Payment failed. Please try again.';
            setCardError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                <div className="border border-gray-300 rounded-xl p-3.5 bg-white">
                    <div className="text-sm text-gray-500 py-0.5">
                        <span className="font-medium text-gray-700">Test Mode:</span> Payment will be processed as mock
                    </div>
                </div>
                {cardError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <FaTimes className="text-xs" /> {cardError}
                    </p>
                )}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <strong>Development Mode:</strong> Stripe is not configured. Clicking "Pay" will simulate a successful payment.
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
                <FaLock /> <span>256-bit SSL encrypted · Secured by Stripe</span>
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-colors"
            >
                {loading ? <><Spinner size="sm" /> Processing...</> : <><FaLock /> Pay ₹{amount}</>}
            </button>
        </form>
    );
};

// ── UPI Tab ────────────────────────────────────────────────────────────────
const UPITab = ({ appointment, amount, onSuccess }) => {
    const [upiId, setUpiId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const validateUPI = (id) => /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/.test(id);

    const handlePay = async () => {
        if (!validateUPI(upiId)) {
            setError('Enter a valid UPI ID (e.g. name@upi)');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/payments/create-intent', {
                appointmentId: appointment._id,
                method: 'upi',
                upiId,
            });
            toast.success('UPI payment processed!');
            onSuccess(data.appointment || appointment);
        } catch (err) {
            const msg = err.response?.data?.message || 'Payment failed';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
                <FaMobileAlt className="text-purple-500 text-3xl mx-auto mb-2" />
                <p className="text-sm font-medium text-purple-800">Pay via UPI</p>
                <p className="text-xs text-purple-600 mt-1">Google Pay · PhonePe · Paytm · BHIM</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">UPI ID</label>
                <input
                    type="text"
                    value={upiId}
                    onChange={(e) => { setUpiId(e.target.value); setError(''); }}
                    placeholder="yourname@upi"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
                <FaLock /> <span>Secured UPI transaction</span>
            </div>

            <button
                onClick={handlePay}
                disabled={loading || !upiId}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-colors"
            >
                {loading ? <><Spinner size="sm" /> Processing...</> : <>Pay ₹{amount} via UPI</>}
            </button>
        </div>
    );
};

// ── QR Code Tab ────────────────────────────────────────────────────────────
const QRTab = ({ appointment, amount, onSuccess }) => {
    const [loading, setLoading] = useState(false);

    // Generate a deterministic QR-like placeholder using the appointment ID
    const qrData = `upi://pay?pa=telehealth@upi&pn=TeleHealth&am=${amount}&tn=APT-${appointment._id?.slice(-6)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}`;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const { data } = await api.post('/payments/create-intent', {
                appointmentId: appointment._id,
                method: 'upi',
            });
            toast.success('Payment confirmed!');
            onSuccess(data.appointment || appointment);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 bg-gray-50 rounded-xl p-5">
                <img
                    src={qrUrl}
                    alt="UPI QR Code"
                    className="w-44 h-44 rounded-lg border border-gray-200"
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
                <p className="text-sm font-medium text-gray-700">Scan with any UPI app</p>
                <p className="text-xs text-gray-500">Google Pay · PhonePe · Paytm · BHIM</p>
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-center">
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-xl font-bold text-gray-900">₹{amount}</p>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
                After scanning and paying, click <strong>"I've Paid"</strong> to confirm your appointment.
            </div>

            <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-colors"
            >
                {loading ? <><Spinner size="sm" /> Confirming...</> : <><FaCheckCircle /> I've Paid — Confirm</>}
            </button>
        </div>
    );
};

// ── Net Banking Tab ────────────────────────────────────────────────────────
const NetBankingTab = ({ appointment, amount, onSuccess }) => {
    const [selectedBank, setSelectedBank] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePay = async () => {
        if (!selectedBank) {
            toast.error('Please select a bank');
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/payments/create-intent', {
                appointmentId: appointment._id,
                method: 'netbanking',
                bank: selectedBank,
            });
            toast.success('Net banking payment processed!');
            onSuccess(data.appointment || appointment);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                <FaUniversity className="text-blue-500 text-3xl mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-800">Net Banking</p>
                <p className="text-xs text-blue-600 mt-1">All major Indian banks supported</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Bank</label>
                <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                >
                    <option value="">-- Choose your bank --</option>
                    {BANKS.map((bank) => (
                        <option key={bank} value={bank}>{bank}</option>
                    ))}
                </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
                <FaLock /> <span>Redirects to your bank's secure portal</span>
            </div>

            <button
                onClick={handlePay}
                disabled={loading || !selectedBank}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-colors"
            >
                {loading ? <><Spinner size="sm" /> Processing...</> : <><FaUniversity /> Pay ₹{amount} via Net Banking</>}
            </button>
        </div>
    );
};

// ── Inner modal content (tabs + forms) ────────────────────────────────────
const PaymentContent = ({ appointment, amount, onSuccess, onClose }) => {
    const [activeTab, setActiveTab] = useState('card');
    const [paidAppointment, setPaidAppointment] = useState(null);

    const handleSuccess = (appt) => {
        setPaidAppointment(appt);
    };

    if (paidAppointment) {
        return (
            <ReceiptScreen
                appointment={paidAppointment}
                onClose={() => {
                    onSuccess(paidAppointment);
                    onClose();
                }}
            />
        );
    }

    return (
        <div className="space-y-5">
            {/* Amount summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 flex items-center justify-between border border-blue-100">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Consultation Fee</p>
                    <p className="text-2xl font-bold text-gray-900">₹{amount}</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                    <p className="font-medium text-gray-700">Dr. {appointment.doctor?.user?.name || 'Doctor'}</p>
                    <p>{appointment.timeSlot?.startTime}</p>
                </div>
            </div>

            {/* Payment method tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === id
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Icon className="text-base" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div>
                {activeTab === 'card' && (
                    stripePromise ? (
                        <Elements stripe={stripePromise}>
                            <StripeCardTab appointment={appointment} amount={amount} onSuccess={handleSuccess} />
                        </Elements>
                    ) : (
                        <MockCardTab appointment={appointment} amount={amount} onSuccess={handleSuccess} />
                    )
                )}
                {activeTab === 'upi' && (
                    <UPITab appointment={appointment} amount={amount} onSuccess={handleSuccess} />
                )}
                {activeTab === 'qr' && (
                    <QRTab appointment={appointment} amount={amount} onSuccess={handleSuccess} />
                )}
                {activeTab === 'netbanking' && (
                    <NetBankingTab appointment={appointment} amount={amount} onSuccess={handleSuccess} />
                )}
            </div>
        </div>
    );
};

// ── Outer modal wrapper ────────────────────────────────────────────────────
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
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Choose your preferred payment method</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                        aria-label="Close"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                <PaymentContent
                    appointment={appointment}
                    amount={amount}
                    onSuccess={onSuccess}
                    onClose={onClose}
                />
            </div>
        </div>
    );
};

export default PaymentModal;
