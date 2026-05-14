import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import { FaCheck, FaTimes, FaPlus, FaUserMd, FaFileExcel, FaShieldAlt } from 'react-icons/fa';
import { exportDoctorsExcel } from '../../utils/exportExcel';

const CATEGORIES = [
    'Cardiology', 'Dermatology', 'Neurology', 'Orthopedics',
    'Pediatrics', 'Psychiatry', 'Gynecology', 'Ophthalmology',
    'ENT', 'Oncology', 'Urology', 'Endocrinology',
    'Gastroenterology', 'Pulmonology', 'Nephrology', 'General Practice', 'Other',
];

const emptyForm = {
    name: '', email: '', password: '', phone: '',
    specialization: '', category: 'General Practice',
    experience: '', consultationFee: '', bio: '', licenseNumber: '',
};

const AdminDoctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ isApproved: '', page: 1 });
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(0);

    // Create doctor modal
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [creating, setCreating] = useState(false);
    const [exporting, setExporting] = useState(false);

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const params = { page: filter.page };
            if (filter.isApproved !== '') params.isApproved = filter.isApproved;
            const { data } = await api.get('/admin/doctors', { params });
            setDoctors(data.doctors);
            setTotal(data.total);
            setPages(data.pages);
        } catch {
            toast.error('Failed to fetch doctors');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDoctors(); }, [filter]);

    const handleApproval = async (doctorId, isApproved, rejectionReason = '') => {
        try {
            await api.put(`/admin/doctors/${doctorId}/approval`, { isApproved, rejectionReason });
            toast.success(`Doctor ${isApproved ? 'approved' : 'rejected'}`);
            fetchDoctors();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Action failed');
        }
    };

    const handleVerify = async (doctorId, currentlyVerified) => {
        try {
            await api.put(`/admin/doctors/${doctorId}/verify`);
            toast.success(`Doctor ${currentlyVerified ? 'unverified' : 'verified'} successfully`);
            fetchDoctors();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed');
        }
    };

    const handleFormChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCreateDoctor = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post('/admin/doctors', form);
            toast.success('Doctor created and approved successfully');
            setShowModal(false);
            setForm(emptyForm);
            fetchDoctors();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create doctor');
        } finally {
            setCreating(false);
        }
    };

    const handleExportDoctors = async () => {
        setExporting(true);
        try {
            const { data } = await api.get('/admin/doctors', { params: { limit: 10000 } });
            exportDoctorsExcel(data.doctors);
            toast.success('Doctors exported to Excel');
        } catch (err) {
            toast.error('Export failed');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Doctors</h1>
                    <p className="text-gray-500 text-sm mt-0.5">{total} total doctors</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportDoctors}
                        disabled={exporting}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-60"
                        title="Export doctors to Excel"
                    >
                        <FaFileExcel /> {exporting ? 'Exporting...' : 'Export Excel'}
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                    >
                        <FaPlus /> Add Doctor
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {[
                    { label: 'All', value: '' },
                    { label: 'Approved', value: 'true' },
                    { label: 'Pending', value: 'false' },
                ].map(({ label, value }) => (
                    <button
                        key={value}
                        onClick={() => setFilter((f) => ({ ...f, isApproved: value, page: 1 }))}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter.isApproved === value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="py-20"><Spinner size="lg" /></div>
            ) : doctors.length === 0 ? (
                <div className="card text-center py-16">
                    <FaUserMd className="text-gray-300 text-5xl mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No doctors found</p>
                    <p className="text-gray-400 text-sm mt-1">Click "Add Doctor" to create the first one</p>
                </div>
            ) : (
                <div className="card overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Doctor</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Specialization</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Fee</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {doctors.map((doc) => (
                                    <tr key={doc._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={doc.user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.user?.name || 'D')}&background=2563eb&color=fff&size=40`}
                                                    alt={doc.user?.name}
                                                    className="w-10 h-10 rounded-full"
                                                />
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{doc.user?.name}</p>
                                                    <p className="text-gray-500 text-xs">{doc.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-800">{doc.specialization}</p>
                                            <p className="text-xs text-gray-500">{doc.category}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-800">${doc.consultationFee}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${doc.isApproved
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {doc.isApproved ? 'Approved' : 'Pending'}
                                            </span>
                                            {doc.isVerified && (
                                                <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                    ✓ Verified
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2 flex-wrap">
                                                {!doc.isApproved && (
                                                    <button
                                                        onClick={() => handleApproval(doc._id, true)}
                                                        className="flex items-center gap-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
                                                    >
                                                        <FaCheck /> Approve
                                                    </button>
                                                )}
                                                {doc.isApproved && (
                                                    <button
                                                        onClick={() => {
                                                            const reason = window.prompt('Rejection reason:');
                                                            if (reason !== null) handleApproval(doc._id, false, reason);
                                                        }}
                                                        className="flex items-center gap-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
                                                    >
                                                        <FaTimes /> Revoke
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleVerify(doc._id, doc.isVerified)}
                                                    className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${doc.isVerified
                                                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    title={doc.isVerified ? 'Remove verification badge' : 'Grant verification badge'}
                                                >
                                                    <FaShieldAlt /> {doc.isVerified ? 'Unverify' : 'Verify'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Pagination
                currentPage={filter.page}
                totalPages={pages}
                onPageChange={(page) => setFilter((f) => ({ ...f, page }))}
            />

            {/* Create Doctor Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">Add New Doctor</h2>
                            <button
                                onClick={() => { setShowModal(false); setForm(emptyForm); }}
                                className="text-gray-400 hover:text-gray-600 text-xl"
                                aria-label="Close"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleCreateDoctor} className="px-6 py-5 space-y-4">
                            <p className="text-sm text-gray-500">Doctor will be automatically approved and visible on the platform.</p>

                            {/* Account Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleFormChange}
                                        className="input-field"
                                        placeholder="Dr. John Smith"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleFormChange}
                                        className="input-field"
                                        placeholder="doctor@example.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={form.password}
                                        onChange={handleFormChange}
                                        className="input-field"
                                        placeholder="Min 6 characters"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleFormChange}
                                        className="input-field"
                                        placeholder="+1-555-0100"
                                    />
                                </div>
                            </div>

                            {/* Professional Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
                                    <input
                                        type="text"
                                        name="specialization"
                                        value={form.specialization}
                                        onChange={handleFormChange}
                                        className="input-field"
                                        placeholder="e.g. Cardiologist"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                    <select
                                        name="category"
                                        value={form.category}
                                        onChange={handleFormChange}
                                        className="input-field"
                                        required
                                    >
                                        {CATEGORIES.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                                    <input
                                        type="number"
                                        name="experience"
                                        value={form.experience}
                                        onChange={handleFormChange}
                                        className="input-field"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee ($)</label>
                                    <input
                                        type="number"
                                        name="consultationFee"
                                        value={form.consultationFee}
                                        onChange={handleFormChange}
                                        className="input-field"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
                                    <input
                                        type="text"
                                        name="licenseNumber"
                                        value={form.licenseNumber}
                                        onChange={handleFormChange}
                                        className="input-field"
                                        placeholder="e.g. MD-12345"
                                        required
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                    <textarea
                                        name="bio"
                                        value={form.bio}
                                        onChange={handleFormChange}
                                        className="input-field resize-none"
                                        rows={3}
                                        placeholder="Brief description about the doctor..."
                                        maxLength={1000}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setForm(emptyForm); }}
                                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60"
                                >
                                    {creating ? 'Creating...' : 'Create Doctor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDoctors;
