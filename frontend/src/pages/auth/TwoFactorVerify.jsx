import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FaShieldAlt, FaEnvelope } from 'react-icons/fa';

const TwoFactorVerify = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    // userId passed via navigation state
    const { userId } = location.state || {};

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (!userId) navigate('/login', { replace: true });
        inputRefs.current[0]?.focus();
    }, [userId, navigate]);

    // Countdown timer for resend
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleChange = (idx, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[idx] = value.slice(-1);
        setOtp(newOtp);
        if (value && idx < 5) inputRefs.current[idx + 1]?.focus();
    };

    const handleKeyDown = (idx, e) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
            inputRefs.current[idx - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            inputRefs.current[5]?.focus();
        }
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length !== 6) { toast.error('Enter the 6-digit code'); return; }

        setLoading(true);
        try {
            const { data } = await api.post('/auth/verify-2fa', { userId, otp: code });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Sync Redux state
            dispatch({ type: 'auth/loginUser/fulfilled', payload: data });

            toast.success(`Welcome back, ${data.user.name}!`);

            const role = data.user.role;
            if (role === 'admin') navigate('/admin/dashboard', { replace: true });
            else if (role === 'doctor') navigate('/doctor/dashboard', { replace: true });
            else navigate('/patient/dashboard', { replace: true });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid OTP');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            await api.post('/auth/resend-2fa', { userId });
            toast.success('New OTP sent to your email');
            setCountdown(60);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-md">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                        <FaShieldAlt className="text-blue-600 text-3xl" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                    Two-Factor Verification
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-8 flex items-center justify-center gap-1">
                    <FaEnvelope className="text-gray-400" />
                    Enter the 6-digit code sent to your email
                </p>

                {/* OTP Input */}
                <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
                    {otp.map((digit, idx) => (
                        <input
                            key={idx}
                            ref={(el) => (inputRefs.current[idx] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(idx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(idx, e)}
                            className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all dark:bg-gray-700 dark:text-white
                                ${digit
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-400'
                                }`}
                        />
                    ))}
                </div>

                <button
                    onClick={handleVerify}
                    disabled={loading || otp.join('').length !== 6}
                    className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50 mb-4"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Verifying...
                        </span>
                    ) : 'Verify & Login'}
                </button>

                {/* Resend */}
                <div className="text-center">
                    {countdown > 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Resend code in <span className="font-semibold text-blue-600">{countdown}s</span>
                        </p>
                    ) : (
                        <button
                            onClick={handleResend}
                            disabled={resending}
                            className="text-sm text-blue-600 hover:underline font-medium disabled:opacity-50"
                        >
                            {resending ? 'Sending...' : 'Resend OTP'}
                        </button>
                    )}
                </div>

                <button
                    onClick={() => navigate('/login')}
                    className="w-full mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 text-center"
                >
                    ← Back to Login
                </button>
            </div>
        </div>
    );
};

export default TwoFactorVerify;
