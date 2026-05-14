import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
    FaUserMd, FaCheckCircle, FaClipboardList, FaClock,
    FaUpload, FaArrowRight, FaArrowLeft, FaIdCard,
} from 'react-icons/fa';

const CATEGORIES = [
    'Cardiology', 'Dermatology', 'Neurology', 'Orthopedics', 'Pediatrics',
    'Psychiatry', 'Gynecology', 'Ophthalmology', 'ENT', 'Oncology',
    'Urology', 'Endocrinology', 'Gastroenterology', 'Pulmonology',
    'Nephrology', 'General Practice', 'Other',
];

const STEPS = [
    { id: 1, label: 'Basic Info', icon: FaUserMd },
    { id: 2, label: 'Credentials', icon: FaIdCard },
    { id: 3, label: 'Availability', icon: FaClock },
    { id: 4, label: 'Review', icon: FaClipboardList },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DoctorOnboarding = () => {
    const { user } = useSelector((s) => s.auth);
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        specialization: '',
        category: 'General Practice',
        experience: '',
        consultationFee: '',
        bio: '',
        licenseNumber: '',
        hospitalAffiliation: '',
        languages: '',
        education: [{ degree: '', institution: '', year: '' }],
        availability: [
            { day: 'Monday', startTime: '09:00', endTime: '17:00', slotDuration: 30, isAvailable: true },
            { day: 'Tuesday', startTime: '09:00', endTime: '17:00', slotDuration: 30, isAvailable: true },
            { day: 'Wednesday', startTime: '09:00', endTime: '17:00', slotDuration: 30, isAvailable: true },
            { day: 'Thursday', startTime: '09:00', endTime: '17:00', slotDuration: 30, isAvailable: true },
            { day: 'Friday', startTime: '09:00', endTime: '17:00', slotDuration: 30, isAvailable: true },
            { day: 'Saturday', startTime: '09:00', endTime: '13:00', slotDuration: 30, isAvailable: false },
            { day: 'Sunday', startTime: '09:00', endTime: '13:00', slotDuration: 30, isAvailable: false },
        ],
    });

    useEffect(() => {
        api.get('/doctors/my/profile')
            .then(({ data }) => {
                setProfile(data.doctor);
                // Pre-fill if already has data
                if (data.doctor.specialization && data.doctor.specialization !== 'General') {
                    setForm((f) => ({
                        ...f,
                        specialization: data.doctor.specialization || '',
                        category: data.doctor.category || 'General Practice',
                        experience: data.doctor.experience || '',
                        consultationFee: data.doctor.consultationFee || '',
                        bio: data.doctor.bio || '',
                        licenseNumber: data.doctor.licenseNumber !== 'PENDING' ? data.doctor.licenseNumber : '',
                        hospitalAffiliation: data.doctor.hospitalAffiliation || '',
                        languages: (data.doctor.languages || []).join(', '),
                        education: data.doctor.education?.length ? data.doctor.education : [{ degree: '', institution: '', year: '' }],
                        availability: data.doctor.availability?.length ? data.doctor.availability : f.availability,
                    }));
                }
                // If already approved, redirect to dashboard
                if (data.doctor.isApproved) {
                    navigate('/doctor/dashboard');
                }
            })
            .catch(() => toast.error('Failed to load profile'))
            .finally(() => setLoading(false));
    }, [navigate]);

    const handleSubmit = async () => {
        setSaving(true);
        try {
            await api.put('/doctors/my/profile', {
                specialization: form.specialization,
                category: form.category,
                experience: Number(form.experience),
                consultationFee: Number(form.consultationFee),
                bio: form.bio,
                licenseNumber: form.licenseNumber,
                hospitalAffiliation: form.hospitalAffiliation,
                languages: form.languages.split(',').map((l) => l.trim()).filter(Boolean),
                education: form.education.filter((e) => e.degree),
                availability: form.availability,
            });
            toast.success('Profile submitted for review!');
            navigate('/doctor/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const canProceed = () => {
        if (step === 1) return form.specialization && form.category && form.experience !== '' && form.consultationFee !== '';
        if (step === 2) return form.licenseNumber.trim().length > 3;
        return true;
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-10 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4">
                        <FaUserMd className="text-white text-2xl" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Your Doctor Profile</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Fill in your details to get approved and start receiving patients</p>
                </div>

                {/* Pending banner if already submitted */}
                {profile && !profile.isApproved && profile.licenseNumber !== 'PENDING' && (
                    <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl flex items-center gap-3">
                        <FaClock className="text-yellow-500 text-xl flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">Profile Under Review</p>
                            <p className="text-yellow-700 dark:text-yellow-400 text-xs mt-0.5">Your profile has been submitted and is awaiting admin approval. You can update your details below.</p>
                        </div>
                    </div>
                )}

                {/* Step Progress */}
                <div className="flex items-center justify-between mb-8 px-2">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        const done = step > s.id;
                        const active = step === s.id;
                        return (
                            <React.Fragment key={s.id}>
                                <div className="flex flex-col items-center gap-1">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${done ? 'bg-green-500' : active ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                        {done ? <FaCheckCircle className="text-white" /> : <Icon className={active ? 'text-white' : 'text-gray-400'} />}
                                    </div>
                                    <span className={`text-xs font-medium ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'}`}>{s.label}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-2 mb-5 ${step > s.id ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">

                    {/* Step 1 — Basic Info */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Basic Information</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Specialization *</label>
                                    <input type="text" value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="e.g. Cardiologist" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                                    <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Experience (years) *</label>
                                    <input type="number" value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        min={0} max={60} placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Consultation Fee (₹) *</label>
                                    <input type="number" value={form.consultationFee} onChange={(e) => setForm((f) => ({ ...f, consultationFee: e.target.value }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        min={0} placeholder="500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hospital Affiliation</label>
                                    <input type="text" value={form.hospitalAffiliation} onChange={(e) => setForm((f) => ({ ...f, hospitalAffiliation: e.target.value }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="e.g. City General Hospital" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Languages</label>
                                    <input type="text" value={form.languages} onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="English, Hindi, Tamil" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                                <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                    rows={3} maxLength={1000} placeholder="Tell patients about your expertise..." />
                            </div>
                        </div>
                    )}

                    {/* Step 2 — Credentials */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Credentials & Education</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medical License Number *</label>
                                <input type="text" value={form.licenseNumber} onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value }))}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="e.g. MCI-12345-2020" />
                                <p className="text-xs text-gray-400 mt-1">This will be verified by our admin team before approval.</p>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Education</label>
                                    <button type="button" onClick={() => setForm((f) => ({ ...f, education: [...f.education, { degree: '', institution: '', year: '' }] }))}
                                        className="text-xs text-blue-600 border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                                        + Add
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {form.education.map((edu, idx) => (
                                        <div key={idx} className="grid grid-cols-3 gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                            <input type="text" value={edu.degree} onChange={(e) => { const u = [...form.education]; u[idx] = { ...u[idx], degree: e.target.value }; setForm((f) => ({ ...f, education: u })); }}
                                                className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="Degree (MBBS)" />
                                            <input type="text" value={edu.institution} onChange={(e) => { const u = [...form.education]; u[idx] = { ...u[idx], institution: e.target.value }; setForm((f) => ({ ...f, education: u })); }}
                                                className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="Institution" />
                                            <div className="flex gap-1">
                                                <input type="number" value={edu.year} onChange={(e) => { const u = [...form.education]; u[idx] = { ...u[idx], year: e.target.value }; setForm((f) => ({ ...f, education: u })); }}
                                                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    placeholder="Year" min={1950} max={2030} />
                                                {form.education.length > 1 && (
                                                    <button type="button" onClick={() => setForm((f) => ({ ...f, education: f.education.filter((_, i) => i !== idx) }))}
                                                        className="text-red-400 hover:text-red-600 px-1">✕</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">📋 Verification Process</p>
                                <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                                    <li>• Your license number will be verified by our admin team</li>
                                    <li>• Approval typically takes 1–2 business days</li>
                                    <li>• You'll receive an email notification once approved</li>
                                    <li>• You can update your profile at any time</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Step 3 — Availability */}
                    {step === 3 && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Set Your Availability</h2>
                            <div className="space-y-2">
                                {DAYS.map((day) => {
                                    const slot = form.availability.find((s) => s.day === day);
                                    const isActive = slot?.isAvailable ?? false;
                                    const toggle = () => setForm((f) => ({
                                        ...f,
                                        availability: f.availability.map((s) => s.day === day ? { ...s, isAvailable: !s.isAvailable } : s),
                                    }));
                                    const update = (field, value) => setForm((f) => ({
                                        ...f,
                                        availability: f.availability.map((s) => s.day === day ? { ...s, [field]: value } : s),
                                    }));
                                    return (
                                        <div key={day} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${isActive ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30'}`}>
                                            <button type="button" onClick={toggle}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                            </button>
                                            <span className={`w-20 text-sm font-medium flex-shrink-0 ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-400'}`}>{day.slice(0, 3)}</span>
                                            {isActive && slot ? (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <input type="time" value={slot.startTime} onChange={(e) => update('startTime', e.target.value)}
                                                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    <span className="text-gray-400 text-xs">to</span>
                                                    <input type="time" value={slot.endTime} onChange={(e) => update('endTime', e.target.value)}
                                                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    <select value={slot.slotDuration} onChange={(e) => update('slotDuration', Number(e.target.value))}
                                                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                                        <option value={15}>15 min</option>
                                                        <option value={30}>30 min</option>
                                                        <option value={45}>45 min</option>
                                                        <option value={60}>60 min</option>
                                                    </select>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Not available</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 4 — Review */}
                    {step === 4 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Review & Submit</h2>
                            <div className="space-y-3">
                                {[
                                    { label: 'Specialization', value: form.specialization },
                                    { label: 'Category', value: form.category },
                                    { label: 'Experience', value: `${form.experience} years` },
                                    { label: 'Consultation Fee', value: `₹${form.consultationFee}` },
                                    { label: 'License Number', value: form.licenseNumber },
                                    { label: 'Hospital', value: form.hospitalAffiliation || '—' },
                                    { label: 'Languages', value: form.languages || '—' },
                                ].map((item) => (
                                    <div key={item.label} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Available Days</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {form.availability.filter((s) => s.isAvailable).map((s) => s.day.slice(0, 3)).join(', ') || 'None'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl mt-4">
                                <p className="text-sm text-green-800 dark:text-green-300">
                                    ✅ By submitting, your profile will be sent for admin review. You'll be notified once approved.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => setStep((s) => s - 1)}
                            disabled={step === 1}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                        >
                            <FaArrowLeft className="text-xs" /> Back
                        </button>

                        {step < 4 ? (
                            <button
                                type="button"
                                onClick={() => setStep((s) => s + 1)}
                                disabled={!canProceed()}
                                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-40 transition-colors"
                            >
                                Next <FaArrowRight className="text-xs" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
                            >
                                {saving ? 'Submitting...' : <><FaCheckCircle /> Submit for Review</>}
                            </button>
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-4">
                    Already submitted?{' '}
                    <button onClick={() => navigate('/doctor/dashboard')} className="text-blue-600 hover:underline">
                        Go to Dashboard
                    </button>
                </p>
            </div>
        </div>
    );
};

export default DoctorOnboarding;
