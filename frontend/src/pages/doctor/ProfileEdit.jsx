import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../../store/slices/authSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';
import { FaPlus, FaTrash, FaCamera, FaCheckCircle, FaLock, FaEnvelope, FaPhone } from 'react-icons/fa';

const CATEGORIES = [
    'Cardiology', 'Dermatology', 'Neurology', 'Orthopedics', 'Pediatrics',
    'Psychiatry', 'Gynecology', 'Ophthalmology', 'ENT', 'Oncology',
    'Urology', 'Endocrinology', 'Gastroenterology', 'Pulmonology',
    'Nephrology', 'General Practice', 'Other',
];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DoctorProfileEdit = () => {
    const dispatch = useDispatch();
    const { user, loading: authLoading } = useSelector((s) => s.auth);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [activeTab, setActiveTab] = useState('basic');

    // Password change state
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwLoading, setPwLoading] = useState(false);

    useEffect(() => {
        api.get('/doctors/my/profile')
            .then(({ data }) => {
                setProfile(data.doctor);
                setLoading(false);
            })
            .catch((err) => {
                toast.error('Failed to load profile');
                setLoading(false);
            });
    }, []);

    const handleChange = (field, value) =>
        setProfile((prev) => ({ ...prev, [field]: value }));

    const handleAvailabilityChange = (idx, field, value) => {
        const updated = [...(profile.availability || [])];
        updated[idx] = { ...updated[idx], [field]: value };
        setProfile((prev) => ({ ...prev, availability: updated }));
    };

    const addAvailability = () => {
        setProfile((prev) => ({
            ...prev,
            availability: [
                ...(prev.availability || []),
                { day: 'Monday', startTime: '09:00', endTime: '17:00', slotDuration: 30, isAvailable: true },
            ],
        }));
    };

    const removeAvailability = (idx) => {
        setProfile((prev) => ({
            ...prev,
            availability: prev.availability.filter((_, i) => i !== idx),
        }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleAvatarSave = async () => {
        if (!avatarFile) return;
        const data = new FormData();
        data.append('name', user.name);
        data.append('avatar', avatarFile);
        const result = await dispatch(updateProfile(data));
        if (!result.error) {
            setAvatarFile(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/doctors/my/profile', {
                specialization: profile.specialization,
                category: profile.category,
                experience: profile.experience,
                consultationFee: profile.consultationFee,
                bio: profile.bio,
                licenseNumber: profile.licenseNumber,
                hospitalAffiliation: profile.hospitalAffiliation,
                languages: profile.languages,
                availability: profile.availability,
                education: profile.education,
            });
            setSaved(true);
            toast.success('Profile updated successfully!');
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setPwLoading(true);
        try {
            await api.put('/auth/update-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            toast.success('Password updated!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update password');
        } finally {
            setPwLoading(false);
        }
    };

    if (loading) return <div className="py-20"><Spinner size="lg" /></div>;
    if (!profile) return <div className="text-center py-20 text-gray-500">Profile not found.</div>;

    const avatarSrc =
        avatarPreview ||
        user?.avatar?.url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'D')}&background=2563eb&color=fff&size=80`;

    const tabs = [
        { id: 'basic', label: 'Basic Info' },
        { id: 'availability', label: 'Availability' },
        { id: 'education', label: 'Education' },
        { id: 'account', label: 'Account' },
    ];

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Doctor Profile</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your professional information</p>
                </div>
                {!profile.isApproved && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1.5 rounded-full">
                        ⏳ Pending Approval
                    </span>
                )}
                {profile.isApproved && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1.5 rounded-full">
                        ✓ Approved
                    </span>
                )}
            </div>

            {/* Avatar section */}
            <div className="card mb-6">
                <div className="flex items-center gap-5">
                    <div className="relative flex-shrink-0">
                        <img
                            src={avatarSrc}
                            alt="Profile"
                            className="w-20 h-20 rounded-full object-cover border-2 border-blue-100"
                        />
                        <label
                            htmlFor="doc-avatar"
                            className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow"
                        >
                            <FaCamera className="text-white text-xs" />
                        </label>
                        <input id="doc-avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-blue-600 text-sm">{profile.specialization}</p>
                        <p className="text-gray-500 text-xs">{user?.email}</p>
                    </div>
                    {avatarFile && (
                        <button
                            type="button"
                            onClick={handleAvatarSave}
                            disabled={authLoading}
                            className="btn-primary text-sm"
                        >
                            {authLoading ? 'Saving...' : 'Save Photo'}
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit}>
                {/* ── Basic Info Tab ─────────────────────────────────────────── */}
                {activeTab === 'basic' && (
                    <div className="card space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
                                <input
                                    type="text"
                                    value={profile.specialization || ''}
                                    onChange={(e) => handleChange('specialization', e.target.value)}
                                    className="input-field"
                                    placeholder="e.g. Cardiologist"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                <select
                                    value={profile.category || ''}
                                    onChange={(e) => handleChange('category', e.target.value)}
                                    className="input-field"
                                    required
                                >
                                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years) *</label>
                                <input
                                    type="number"
                                    value={profile.experience ?? 0}
                                    onChange={(e) => handleChange('experience', Number(e.target.value))}
                                    className="input-field"
                                    min="0"
                                    max="60"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹) *</label>
                                <input
                                    type="number"
                                    value={profile.consultationFee ?? 0}
                                    onChange={(e) => handleChange('consultationFee', Number(e.target.value))}
                                    className="input-field"
                                    min="0"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
                                <input
                                    type="text"
                                    value={profile.licenseNumber || ''}
                                    onChange={(e) => handleChange('licenseNumber', e.target.value)}
                                    className="input-field"
                                    placeholder="e.g. MD-CA-12345"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Affiliation</label>
                                <input
                                    type="text"
                                    value={profile.hospitalAffiliation || ''}
                                    onChange={(e) => handleChange('hospitalAffiliation', e.target.value)}
                                    className="input-field"
                                    placeholder="e.g. City General Hospital"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Languages (comma-separated)</label>
                            <input
                                type="text"
                                value={(profile.languages || []).join(', ')}
                                onChange={(e) =>
                                    handleChange('languages', e.target.value.split(',').map((l) => l.trim()).filter(Boolean))
                                }
                                className="input-field"
                                placeholder="English, Spanish, French"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bio <span className="text-gray-400 font-normal">({(profile.bio || '').length}/1000)</span>
                            </label>
                            <textarea
                                value={profile.bio || ''}
                                onChange={(e) => handleChange('bio', e.target.value)}
                                className="input-field resize-none"
                                rows={4}
                                maxLength={1000}
                                placeholder="Tell patients about your expertise, approach, and experience..."
                            />
                        </div>

                        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                            {saving ? 'Saving...' : saved ? <><FaCheckCircle /> Saved!</> : 'Save Profile'}
                        </button>
                    </div>
                )}

                {/* ── Availability Tab ───────────────────────────────────────── */}
                {activeTab === 'availability' && (
                    <div className="card">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h3 className="font-semibold text-gray-900">Weekly Schedule</h3>
                                <p className="text-sm text-gray-500 mt-0.5">Set your availability for each day of the week</p>
                            </div>
                        </div>

                        {/* Visual Weekly Calendar Grid */}
                        <div className="grid grid-cols-1 gap-3">
                            {DAYS.map((day) => {
                                const slot = (profile.availability || []).find((s) => s.day === day);
                                const isActive = slot?.isAvailable ?? false;

                                // Calculate slot count
                                const slotCount = (() => {
                                    if (!slot || !isActive) return 0;
                                    const [sh, sm] = slot.startTime.split(':').map(Number);
                                    const [eh, em] = slot.endTime.split(':').map(Number);
                                    const totalMins = (eh * 60 + em) - (sh * 60 + sm);
                                    return totalMins > 0 ? Math.floor(totalMins / (slot.slotDuration || 30)) : 0;
                                })();

                                const toggleDay = () => {
                                    const existing = (profile.availability || []).findIndex((s) => s.day === day);
                                    if (existing >= 0) {
                                        const updated = [...profile.availability];
                                        updated[existing] = { ...updated[existing], isAvailable: !updated[existing].isAvailable };
                                        setProfile((prev) => ({ ...prev, availability: updated }));
                                    } else {
                                        setProfile((prev) => ({
                                            ...prev,
                                            availability: [
                                                ...(prev.availability || []),
                                                { day, startTime: '09:00', endTime: '17:00', slotDuration: 30, isAvailable: true },
                                            ],
                                        }));
                                    }
                                };

                                const updateSlotField = (field, value) => {
                                    const existing = (profile.availability || []).findIndex((s) => s.day === day);
                                    if (existing >= 0) {
                                        const updated = [...profile.availability];
                                        updated[existing] = { ...updated[existing], [field]: value };
                                        setProfile((prev) => ({ ...prev, availability: updated }));
                                    }
                                };

                                return (
                                    <div
                                        key={day}
                                        className={`rounded-xl border-2 transition-all ${isActive
                                            ? 'border-blue-200 bg-blue-50'
                                            : 'border-gray-100 bg-gray-50 opacity-70'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4 p-4">
                                            {/* Day toggle */}
                                            <div className="flex items-center gap-3 w-32 flex-shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={toggleDay}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
                                                    aria-label={`Toggle ${day}`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`}
                                                    />
                                                </button>
                                                <span className={`font-semibold text-sm ${isActive ? 'text-blue-700' : 'text-gray-400'}`}>
                                                    {day.slice(0, 3)}
                                                </span>
                                            </div>

                                            {isActive && slot ? (
                                                <>
                                                    {/* Time range picker */}
                                                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs text-gray-500 whitespace-nowrap">From</span>
                                                            <input
                                                                type="time"
                                                                value={slot.startTime}
                                                                onChange={(e) => updateSlotField('startTime', e.target.value)}
                                                                className="input-field text-sm py-1.5 w-28"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs text-gray-500 whitespace-nowrap">To</span>
                                                            <input
                                                                type="time"
                                                                value={slot.endTime}
                                                                onChange={(e) => updateSlotField('endTime', e.target.value)}
                                                                className="input-field text-sm py-1.5 w-28"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs text-gray-500 whitespace-nowrap">Slot</span>
                                                            <select
                                                                value={slot.slotDuration}
                                                                onChange={(e) => updateSlotField('slotDuration', Number(e.target.value))}
                                                                className="input-field text-sm py-1.5 w-24"
                                                            >
                                                                <option value={15}>15 min</option>
                                                                <option value={30}>30 min</option>
                                                                <option value={45}>45 min</option>
                                                                <option value={60}>60 min</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Slot count badge */}
                                                    <div className="flex-shrink-0 text-center">
                                                        <div className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                                            {slotCount} slots
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">Not available</span>
                                            )}
                                        </div>

                                        {/* Visual time bar */}
                                        {isActive && slot && (
                                            <div className="px-4 pb-3">
                                                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    {(() => {
                                                        const [sh, sm] = slot.startTime.split(':').map(Number);
                                                        const [eh, em] = slot.endTime.split(':').map(Number);
                                                        const startPct = ((sh * 60 + sm) / (24 * 60)) * 100;
                                                        const endPct = ((eh * 60 + em) / (24 * 60)) * 100;
                                                        const width = Math.max(0, endPct - startPct);
                                                        return (
                                                            <div
                                                                className="absolute h-full bg-blue-500 rounded-full"
                                                                style={{ left: `${startPct}%`, width: `${width}%` }}
                                                            />
                                                        );
                                                    })()}
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                    <span>12am</span>
                                                    <span>6am</span>
                                                    <span>12pm</span>
                                                    <span>6pm</span>
                                                    <span>12am</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <button type="submit" disabled={saving} className="btn-primary mt-5 flex items-center gap-2">
                            {saving ? 'Saving...' : saved ? <><FaCheckCircle /> Saved!</> : 'Save Schedule'}
                        </button>
                    </div>
                )}

                {/* ── Education Tab ──────────────────────────────────────────── */}
                {activeTab === 'education' && (
                    <div className="card">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-gray-900">Education & Qualifications</h3>
                            <button
                                type="button"
                                onClick={() =>
                                    setProfile((prev) => ({
                                        ...prev,
                                        education: [...(prev.education || []), { degree: '', institution: '', year: '' }],
                                    }))
                                }
                                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                <FaPlus className="text-xs" /> Add
                            </button>
                        </div>

                        {(profile.education || []).length === 0 ? (
                            <p className="text-gray-500 text-sm py-4">No education records added yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {profile.education.map((edu, idx) => (
                                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <input
                                            type="text"
                                            value={edu.degree || ''}
                                            onChange={(e) => {
                                                const updated = [...profile.education];
                                                updated[idx] = { ...updated[idx], degree: e.target.value };
                                                handleChange('education', updated);
                                            }}
                                            className="input-field text-sm"
                                            placeholder="Degree (e.g. MD)"
                                        />
                                        <input
                                            type="text"
                                            value={edu.institution || ''}
                                            onChange={(e) => {
                                                const updated = [...profile.education];
                                                updated[idx] = { ...updated[idx], institution: e.target.value };
                                                handleChange('education', updated);
                                            }}
                                            className="input-field text-sm"
                                            placeholder="Institution"
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={edu.year || ''}
                                                onChange={(e) => {
                                                    const updated = [...profile.education];
                                                    updated[idx] = { ...updated[idx], year: Number(e.target.value) };
                                                    handleChange('education', updated);
                                                }}
                                                className="input-field text-sm flex-1"
                                                placeholder="Year"
                                                min="1950"
                                                max={new Date().getFullYear()}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleChange('education', profile.education.filter((_, i) => i !== idx))}
                                                className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button type="submit" disabled={saving} className="btn-primary mt-5 flex items-center gap-2">
                            {saving ? 'Saving...' : saved ? <><FaCheckCircle /> Saved!</> : 'Save Education'}
                        </button>
                    </div>
                )}
            </form>

            {/* ── Account Tab (outside form) ─────────────────────────────── */}
            {activeTab === 'account' && (
                <div className="space-y-6">
                    {/* Account info */}
                    <div className="card">
                        <h3 className="font-semibold text-gray-900 mb-4">Account Information</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <FaEnvelope className="text-gray-400" />
                                <div>
                                    <p className="text-gray-500 text-xs">Email</p>
                                    <p className="font-medium text-gray-900">{user?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <FaPhone className="text-gray-400" />
                                <div>
                                    <p className="text-gray-500 text-xs">Phone</p>
                                    <p className="font-medium text-gray-900">{user?.phone || 'Not set'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Change password */}
                    <div className="card">
                        <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            {[
                                { key: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password' },
                                { key: 'newPassword', label: 'New Password', placeholder: 'Min 6 characters with a number' },
                                { key: 'confirmPassword', label: 'Confirm Password', placeholder: 'Repeat new password' },
                            ].map(({ key, label, placeholder }) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                    <div className="relative">
                                        <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="password"
                                            value={passwordData[key]}
                                            onChange={(e) => setPasswordData({ ...passwordData, [key]: e.target.value })}
                                            className="input-field pl-10"
                                            placeholder={placeholder}
                                            required
                                        />
                                    </div>
                                </div>
                            ))}
                            <button type="submit" disabled={pwLoading} className="btn-primary">
                                {pwLoading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorProfileEdit;
