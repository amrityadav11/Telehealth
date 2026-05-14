import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import {
    FaEnvelope, FaLock, FaUserMd, FaEye, FaEyeSlash,
    FaMobileAlt, FaGoogle, FaShieldAlt,
} from 'react-icons/fa';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ── OTP Input component ───────────────────────────────────────────────────
const OTPInput = ({ value, onChange, length = 6 }) => {
    const inputs = useRef([]);

    const handleChange = (e, idx) => {
        const val = e.target.value.replace(/\D/g, '');
        if (!val) return;
        const digits = value.split('');
        digits[idx] = val[val.length - 1];
        onChange(digits.join(''));
        if (idx < length - 1) inputs.current[idx + 1]?.focus();
    };

    const handleKeyDown = (e, idx) => {
        if (e.key === 'Backspace') {
            const digits = value.split('');
            if (digits[idx]) {
                digits[idx] = '';
                onChange(digits.join(''));
            } else if (idx > 0) {
                inputs.current[idx - 1]?.focus();
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
        onChange(pasted.padEnd(length, '').slice(0, length));
        inputs.current[Math.min(pasted.length, length - 1)]?.focus();
    };

    return (
        <div className="flex gap-2 justify-center">
            {Array.from({ length }).map((_, idx) => (
                <input
                    key={idx}
                    ref={(el) => (inputs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[idx] || ''}
                    onChange={(e) => handleChange(e, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    onPaste={handlePaste}
                    className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    aria-label={`OTP digit ${idx + 1}`}
                />
            ))}
        </div>
    );
};

// ── Phone OTP Login ───────────────────────────────────────────────────────
const PhoneOTPLogin = ({ onBack }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('phone'); // 'phone' | 'otp'
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [devOtp, setDevOtp] = useState('');

    useEffect(() => {
        if (countdown > 0) {
            const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [countdown]);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!phone || phone.length < 10) {
            toast.error('Enter a valid phone number');
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/auth/send-otp', { phone });
            toast.success(data.message || 'OTP sent!');
            setStep('otp');
            setCountdown(60);
            // Dev mode: show OTP in UI
            if (data.devOtp) setDevOtp(data.devOtp);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (otp.length < 6) {
            toast.error('Enter the 6-digit OTP');
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/auth/verify-otp', { phone, otp });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            dispatch({ type: 'auth/login/fulfilled', payload: data });
            toast.success(`Welcome, ${data.user.name}!`);
            if (data.user.role === 'admin') navigate('/admin/dashboard');
            else if (data.user.role === 'doctor') navigate('/doctor/dashboard');
            else navigate('/patient/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            {step === 'phone' ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">+91</span>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                className="input-field pl-12"
                                placeholder="9876543210"
                                required
                                maxLength={10}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">We'll send a 6-digit OTP to this number</p>
                    </div>
                    <button
                        type="submit"
                        disabled={loading || phone.length < 10}
                        className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending OTP...</>
                        ) : (
                            <><FaMobileAlt /> Send OTP</>
                        )}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-5">
                    <div className="text-center">
                        <p className="text-sm text-gray-600">OTP sent to <strong>+91 {phone}</strong></p>
                        <button
                            type="button"
                            onClick={() => { setStep('phone'); setOtp(''); setDevOtp(''); }}
                            className="text-xs text-blue-600 hover:underline mt-1"
                        >
                            Change number
                        </button>
                    </div>

                    {devOtp && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
                            <p className="text-xs text-amber-700">Dev Mode OTP: <strong className="text-lg tracking-widest">{devOtp}</strong></p>
                        </div>
                    )}

                    <OTPInput value={otp} onChange={setOtp} length={6} />

                    <button
                        type="submit"
                        disabled={loading || otp.length < 6}
                        className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying...</>
                        ) : (
                            <><FaShieldAlt /> Verify & Login</>
                        )}
                    </button>

                    <div className="text-center">
                        {countdown > 0 ? (
                            <p className="text-xs text-gray-400">Resend OTP in {countdown}s</p>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSendOTP}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                Resend OTP
                            </button>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
};

// ── Google Sign-In ────────────────────────────────────────────────────────
const GoogleLogin = () => {
    const handleGoogleLogin = () => {
        // Redirect to backend Google OAuth
        window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/google`;
    };

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                <FaGoogle className="text-red-500 text-3xl mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Sign in with Google</p>
                <p className="text-xs text-gray-500 mt-1">Use your Google account for quick access</p>
            </div>
            <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 py-3 rounded-xl font-medium text-gray-700 transition-all"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
            </button>
            <p className="text-xs text-center text-gray-400">
                You'll be redirected to Google's secure sign-in page
            </p>
        </div>
    );
};

// ── Main Login Page ───────────────────────────────────────────────────────
const LOGIN_TABS = [
    { id: 'email', label: 'Email', icon: FaEnvelope },
    { id: 'phone', label: 'Phone OTP', icon: FaMobileAlt },
    { id: 'google', label: 'Google', icon: FaGoogle },
];

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, user, token } = useSelector((state) => state.auth);

    const [activeTab, setActiveTab] = useState('email');
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user && token) {
            if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
            else if (user.role === 'doctor') navigate('/doctor/dashboard', { replace: true });
            else navigate('/patient/dashboard', { replace: true });
        }
    }, [user, token, navigate]);

    useEffect(() => {
        return () => dispatch(clearError());
    }, [dispatch]);

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(loginUser(formData)).then((result) => {
            // If 2FA is required, redirect to the verify page
            if (result?.payload?.twoFactorRequired) {
                navigate('/verify-2fa', { state: { userId: result.payload.userId } });
            }
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
                        <FaUserMd className="text-white text-3xl" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
                    <p className="text-gray-600 mt-1">Sign in to your TeleHealth account</p>
                </div>

                <div className="card">
                    {/* Auth method tabs */}
                    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
                        {LOGIN_TABS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === id
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Icon className="text-sm" />
                                <span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Email + Password */}
                    {activeTab === 'email' && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <div className="relative">
                                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="input-field pl-10"
                                        placeholder="you@example.com"
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="input-field pl-10 pr-10"
                                        placeholder="••••••••"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                                    Forgot password?
                                </Link>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full py-3 text-base"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>
                    )}

                    {/* Phone OTP */}
                    {activeTab === 'phone' && (
                        <PhoneOTPLogin onBack={() => setActiveTab('email')} />
                    )}

                    {/* Google */}
                    {activeTab === 'google' && <GoogleLogin />}

                    <div className="relative my-5">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">
                            or
                        </div>
                    </div>

                    <p className="text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-blue-600 font-medium hover:underline">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
