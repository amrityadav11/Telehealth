import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import {
    FaUsers, FaPlus, FaTimes, FaTrash, FaEdit,
    FaUserCircle, FaHeartbeat, FaCalendarAlt,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const RELATIONSHIPS = ['spouse', 'child', 'parent', 'sibling', 'grandparent', 'other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''];

const REL_COLORS = {
    spouse: 'bg-pink-100 text-pink-700',
    child: 'bg-blue-100 text-blue-700',
    parent: 'bg-purple-100 text-purple-700',
    sibling: 'bg-green-100 text-green-700',
    grandparent: 'bg-amber-100 text-amber-700',
    other: 'bg-gray-100 text-gray-700',
};

const REL_EMOJIS = { spouse: '💑', child: '👶', parent: '👨‍👩‍👦', sibling: '👫', grandparent: '👴', other: '👤' };

const emptyForm = {
    name: '', relationship: 'child', dateOfBirth: '', gender: 'male',
    bloodGroup: '', phone: '', allergies: '', medicalConditions: '', notes: '',
};

const FamilyProfiles = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/family');
            setMembers(data.members);
        } catch {
            toast.error('Failed to load family members');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMembers(); }, [fetchMembers]);

    const openAdd = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };
    const openEdit = (m) => {
        setForm({
            name: m.name,
            relationship: m.relationship,
            dateOfBirth: m.dateOfBirth ? m.dateOfBirth.split('T')[0] : '',
            gender: m.gender || 'male',
            bloodGroup: m.bloodGroup || '',
            phone: m.phone || '',
            allergies: (m.allergies || []).join(', '),
            medicalConditions: (m.medicalConditions || []).join(', '),
            notes: m.notes || '',
        });
        setEditingId(m._id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                allergies: form.allergies.split(',').map((s) => s.trim()).filter(Boolean),
                medicalConditions: form.medicalConditions.split(',').map((s) => s.trim()).filter(Boolean),
            };
            if (editingId) {
                const { data } = await api.put(`/family/${editingId}`, payload);
                setMembers((prev) => prev.map((m) => m._id === editingId ? data.member : m));
                toast.success('Updated successfully');
            } else {
                const { data } = await api.post('/family', payload);
                setMembers((prev) => [data.member, ...prev]);
                toast.success('Family member added!');
            }
            setShowForm(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this family member?')) return;
        try {
            await api.delete(`/family/${id}`);
            setMembers((prev) => prev.filter((m) => m._id !== id));
            toast.success('Removed');
        } catch {
            toast.error('Failed to remove');
        }
    };

    const getAge = (dob) => {
        if (!dob) return null;
        const diff = Date.now() - new Date(dob).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaUsers className="text-blue-500" /> Family Profiles
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Manage your family members and book appointments on their behalf
                    </p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <FaPlus /> Add Member
                </button>
            </div>

            {loading ? (
                <div className="py-20"><Spinner size="lg" /></div>
            ) : members.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center py-16">
                    <FaUsers className="text-gray-300 text-5xl mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No family members added yet</p>
                    <p className="text-gray-400 text-sm mt-1">Add family members to book appointments on their behalf</p>
                    <button onClick={openAdd} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        Add First Member
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {members.map((m) => {
                        const age = getAge(m.dateOfBirth);
                        return (
                            <div key={m._id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-full flex items-center justify-center text-2xl">
                                            {REL_EMOJIS[m.relationship] || '👤'}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{m.name}</h3>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${REL_COLORS[m.relationship] || 'bg-gray-100 text-gray-700'}`}>
                                                {m.relationship}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => openEdit(m)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                            <FaEdit className="text-sm" />
                                        </button>
                                        <button onClick={() => handleDelete(m._id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                            <FaTrash className="text-sm" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5 text-sm">
                                    {age !== null && (
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                            <FaUserCircle className="text-xs" />
                                            <span>{age} years old · {m.gender}</span>
                                        </div>
                                    )}
                                    {m.bloodGroup && (
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                            <FaHeartbeat className="text-xs text-red-400" />
                                            <span>Blood Group: <span className="font-medium text-red-500">{m.bloodGroup}</span></span>
                                        </div>
                                    )}
                                    {m.allergies?.length > 0 && (
                                        <div className="flex items-start gap-2 text-gray-500 dark:text-gray-400">
                                            <span className="text-xs mt-0.5">⚠️</span>
                                            <span className="text-xs">Allergies: {m.allergies.join(', ')}</span>
                                        </div>
                                    )}
                                    {m.medicalConditions?.length > 0 && (
                                        <div className="flex items-start gap-2 text-gray-500 dark:text-gray-400">
                                            <span className="text-xs mt-0.5">🏥</span>
                                            <span className="text-xs">Conditions: {m.medicalConditions.join(', ')}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Book appointment for this member */}
                                <Link
                                    to={`/doctors?bookedFor=${m._id}&bookedForName=${encodeURIComponent(m.name)}`}
                                    className="mt-4 flex items-center justify-center gap-2 w-full py-2 border border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <FaCalendarAlt className="text-xs" /> Book Appointment for {m.name.split(' ')[0]}
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingId ? 'Edit Family Member' : 'Add Family Member'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                                    <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Full name" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relationship *</label>
                                    <select value={form.relationship} onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white capitalize">
                                        {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                                    <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                                    <input type="date" value={form.dateOfBirth} onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
                                    <select value={form.bloodGroup} onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                        <option value="">Unknown</option>
                                        {BLOOD_GROUPS.filter(Boolean).map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                    <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="+91 98765 43210" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allergies (comma-separated)</label>
                                    <input type="text" value={form.allergies} onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Penicillin, Peanuts, Dust" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medical Conditions (comma-separated)</label>
                                    <input type="text" value={form.medicalConditions} onChange={(e) => setForm((f) => ({ ...f, medicalConditions: e.target.value }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Diabetes, Hypertension, Asthma" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                                    <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                        rows={2} placeholder="Any additional notes..." />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-60">
                                    {saving ? 'Saving...' : editingId ? 'Update' : 'Add Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FamilyProfiles;
