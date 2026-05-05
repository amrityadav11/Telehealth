import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../store/slices/authSlice';
import { FaUser, FaEnvelope, FaPhone, FaCamera, FaLock, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../services/api';

const PatientProfile = () => {
    const dispatch = useDispatch();
    const { user, loading } = useSelector((s) => s.auth);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [pwLoading, setPwLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    // Sync form when user loads
    useEffect(() => {
        if (user) {
            setFormData({ name: user.name || '', phone: user.phone || '' });
        }
    }, [user]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('name', formData.name);
        if (formData.phone) data.append('phone', formData.phone);
        if (avatarFile) data.append('avatar', avatarFile);

        const result = await dispatch(updateProfile(data));
        if (!result.error) {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setPwLoading(true);
        try {
            await api.put('/auth/update-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            toast.success('Password updated successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update password');
        } finally {
            setPwLoading(false);
        }
    };

    const avatarSrc =
        avatarPreview ||
        user?.avatar?.url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=2563eb&color=fff&size=80`;

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-500 mb-6">Manage your personal information and account settings.</p>

            {/* Profile Card */}
            <div className="card mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-5">Personal Information</h2>

                <form onSubmit={handleProfileSubmit} className="space-y-5">
                    {/* Avatar upload */}
                    <div className="flex items-center gap-5">
                        <div className="relative flex-shrink-0">
                            <img
                                src={avatarSrc}
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover border-2 border-blue-100"
                            />
                            <label
                                htmlFor="avatar-upload"
                                className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow"
                                title="Change photo"
                            >
                                <FaCamera className="text-white text-xs" />
                            </label>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/jpeg,image/png,image/jpg"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">{user?.name}</p>
                            <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                            <p className="text-xs text-gray-400 mt-1">JPG or PNG, max 5MB</p>
                        </div>
                    </div>

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
                                placeholder="Your full name"
                                required
                            />
                        </div>
                    </div>

                    {/* Email (read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <div className="relative">
                            <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                value={user?.email || ''}
                                className="input-field pl-10 bg-gray-50 text-gray-500 cursor-not-allowed"
                                disabled
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <div className="relative">
                            <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="input-field pl-10"
                                placeholder="+1-555-0100"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex items-center gap-2"
                    >
                        {loading ? (
                            'Saving...'
                        ) : saved ? (
                            <><FaCheckCircle /> Saved!</>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </form>
            </div>

            {/* Account Stats */}
            <div className="card mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Info</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500">Account Type</p>
                        <p className="font-semibold text-gray-900 capitalize mt-1">{user?.role}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500">Email Verified</p>
                        <p className={`font-semibold mt-1 ${user?.isEmailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                            {user?.isEmailVerified ? '✓ Verified' : '⚠ Pending'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Change Password */}
            <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-5">Change Password</h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <div className="relative">
                            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="input-field pl-10"
                                placeholder="Enter current password"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <div className="relative">
                            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="input-field pl-10"
                                placeholder="Min 6 characters with a number"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <div className="relative">
                            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="input-field pl-10"
                                placeholder="Repeat new password"
                                required
                            />
                        </div>
                        {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                            <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                        )}
                    </div>

                    <button type="submit" disabled={pwLoading} className="btn-primary">
                        {pwLoading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PatientProfile;
