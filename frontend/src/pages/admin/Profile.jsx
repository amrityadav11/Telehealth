import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../store/slices/authSlice';
import {
    FaUser, FaEnvelope, FaPhone, FaCamera, FaLock,
    FaCheckCircle, FaShieldAlt, FaUserShield, FaKey,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AdminProfile = () => {
    const dispatch = useDispatch();
    const { user, loading } = useSelector((s) => s.auth);

    const [formData, setFormData] = useState({ name: '', phone: '' });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [saved, setSaved] = useState(false);

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [pwLoading, setPwLoading] = useState(false);

    const [twoFAEnabled, setTwoFAEnabled] = useState(false);
    const [twoFALoading, setTwoFALoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({ name: user.name || '', phone: user.phone || '' });
            setTwoFAEnabled(user.twoFactorEnabled || false);
        }
    }, [user]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
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

    const handleToggle2FA = async () => {
        setTwoFALoading(true);
        try {
            const { data } = await api.put('/auth/toggle-2fa');
            setTwoFAEnabled(data.twoFactorEnabled);
            toast.success(data.message);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to toggle 2FA');
        } finally {
            setTwoFALoading(false);
        }
    };

    const avatarSrc =
        avatarPreview ||
        user?.avatar?.url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'A')}&background=2563eb&color=fff&size=80`;

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FaUserShield className="text-blue-600" /> Admin Profile
                </h1>
                <p className="text-gray-500 text-sm mt-1">Manage your account settings and security</p>
            </div>

            {/* Profile Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-5">Personal Information</h2>

                <form onSubmit={handleProfileSubmit} className="space-y-5">
                    {/* Avatar */}
                    <div className="flex items-center gap-5">
                        <div className="relative flex-shrink-0">
                            <img
                                src={avatarSrc}
                                alt="Admin avatar"
                                className="w-20 h-20 rounded-full object-cover border-2 border-blue-100"
                            />
                            <label
                                htmlFor="admin-avatar"
                                className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow"
                                title="Change photo"
                            >
                                <FaCamera className="text-white text-xs" />
                            </label>
                            <input
                                id="admin-avatar"
                                type="file"
                                accept="image/jpeg,image/png,image/jpg"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">{user?.name}</p>
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium mt-1">
                                <FaUserShield className="text-xs" /> Administrator
                            </span>
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
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 pl-10 bg-gray-50 text-gray-500 cursor-not-allowed"
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
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="+1-555-0100"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : saved ? <><FaCheckCircle /> Saved!</> : 'Save Changes'}
                    </button>
                </form>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Info</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500">Role</p>
                        <p className="font-semibold text-gray-900 mt-1 capitalize">{user?.role}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500">Email Verified</p>
                        <p className={`font-semibold mt-1 ${user?.isEmailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                            {user?.isEmailVerified ? '✓ Verified' : '⚠ Pending'}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500">Last Login</p>
                        <p className="font-semibold text-gray-900 mt-1 text-xs">
                            {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500">Account Status</p>
                        <p className="font-semibold text-green-600 mt-1">✓ Active</p>
                    </div>
                </div>
            </div>

            {/* Security — 2FA */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <FaShieldAlt className="text-blue-500" /> Two-Factor Authentication
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    Add an extra layer of security. When enabled, you'll need to enter a 6-digit code sent to your email every time you log in.
                </p>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                        <p className="font-medium text-gray-800 text-sm">
                            {twoFAEnabled ? '🔒 2FA is enabled' : '🔓 2FA is disabled'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {twoFAEnabled
                                ? 'Your account is protected with email OTP on login'
                                : 'Enable to require email OTP on every login'}
                        </p>
                    </div>
                    <button
                        onClick={handleToggle2FA}
                        disabled={twoFALoading}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${twoFAEnabled ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                        role="switch"
                        aria-checked={twoFAEnabled}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${twoFAEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <FaKey className="text-blue-500" /> Change Password
                </h2>
                <p className="text-sm text-gray-500 mb-5">Use a strong password with at least 6 characters and one number.</p>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <div className="relative">
                            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Repeat new password"
                                required
                            />
                        </div>
                        {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                            <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={pwLoading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {pwLoading ? 'Updating...' : <><FaKey /> Update Password</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminProfile;
