import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FaUserShield, FaEnvelope, FaLock, FaUser, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';

const CreateAdmin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [created, setCreated] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post('/admin/create-admin', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });
            setCreated(data.admin);
            toast.success('Admin account created!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create admin');
        } finally {
            setLoading(false);
        }
    };

    if (created) {
        return (
            <div className="max-w-lg mx-auto px-4 py-16 text-center">
                <div className="card">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaCheckCircle className="text-green-600 text-3xl" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Created!</h2>
                    <div className="bg-gray-50 rounded-xl p-4 text-left mt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Name</span>
                            <span className="font-medium text-gray-900">{created.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Email</span>
                            <span className="font-medium text-gray-900">{created.email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Role</span>
                            <span className="font-medium text-purple-600 capitalize">{created.role}</span>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => { setCreated(null); setFormData({ name: '', email: '', password: '', confirmPassword: '' }); }}
                            className="btn-secondary flex-1"
                        >
                            Create Another
                        </button>
                        <button onClick={() => navigate('/admin/users')} className="btn-primary flex-1">
                            View All Users
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto px-4 py-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm"
            >
                <FaArrowLeft /> Back
            </button>

            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <FaUserShield className="text-purple-600 text-lg" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Create Admin Account</h1>
                    <p className="text-gray-500 text-sm">New admin will have full platform access</p>
                </div>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <div className="relative">
                            <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input-field pl-10"
                                placeholder="Admin full name"
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <div className="relative">
                            <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="input-field pl-10"
                                placeholder="admin@example.com"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="input-field pl-10"
                                placeholder="Min 6 characters"
                                required
                            />
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <div className="relative">
                            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="input-field pl-10"
                                placeholder="Repeat password"
                                required
                            />
                        </div>
                        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                            <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                        )}
                    </div>

                    {/* Warning */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                        ⚠️ Admin accounts have full access to all platform data and settings.
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                        {loading ? 'Creating...' : 'Create Admin Account'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateAdmin;
