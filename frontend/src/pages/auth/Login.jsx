import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { FaEnvelope, FaLock, FaUserMd, FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, user, token } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    // Redirect after login — watch user role
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
        dispatch(loginUser(formData));
    };

    const fillDemo = (role) => {
        const creds = {
            admin: { email: 'admin@telemed.com', password: 'Admin@123' },
            doctor: { email: 'sarah@telemed.com', password: 'Doctor@123' },
            patient: { email: 'john@example.com', password: 'Patient@123' },
        };
        setFormData(creds[role]);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                        <FaUserMd className="text-white text-3xl" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
                    <p className="text-gray-600 mt-1">Sign in to your TeleMed account</p>
                </div>

                <div className="card">
                    {/* Demo quick-fill */}
                    <div className="mb-6">
                        <p className="text-xs text-gray-500 mb-2 text-center font-medium">Quick demo login:</p>
                        <div className="flex gap-2">
                            {['admin', 'doctor', 'patient'].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => fillDemo(role)}
                                    className="flex-1 py-2 text-xs border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 capitalize font-medium text-gray-600 transition-colors"
                                >
                                    {role === 'admin' ? '🛡️ Admin' : role === 'doctor' ? '👨‍⚕️ Doctor' : '🧑 Patient'}
                                </button>
                            ))}
                        </div>
                    </div>

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
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-600 mt-6">
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
