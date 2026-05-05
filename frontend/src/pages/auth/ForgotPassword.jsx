import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
            toast.success('Reset email sent!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="card">
                    <Link to="/login" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 text-sm">
                        <FaArrowLeft /> Back to login
                    </Link>

                    {sent ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaEnvelope className="text-green-600 text-2xl" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
                            <p className="text-gray-600">We sent a password reset link to <strong>{email}</strong></p>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot password?</h2>
                            <p className="text-gray-600 mb-6">Enter your email and we'll send you a reset link.</p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <div className="relative">
                                        <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="input-field pl-10"
                                            placeholder="you@example.com"
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
