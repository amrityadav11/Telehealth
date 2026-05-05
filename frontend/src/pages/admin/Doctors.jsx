import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import { FaCheck, FaTimes, FaSearch } from 'react-icons/fa';

const AdminDoctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ isApproved: '', search: '', page: 1 });
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(0);

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter.isApproved !== '') params.isApproved = filter.isApproved;
            params.page = filter.page;
            const { data } = await api.get('/admin/doctors', { params });
            setDoctors(data.doctors);
            setTotal(data.total);
            setPages(data.pages);
        } catch (err) {
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

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Manage Doctors</h1>
                <span className="text-gray-500 text-sm">{total} total</span>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
                <div className="flex gap-2">
                    {[
                        { label: 'All', value: '' },
                        { label: 'Approved', value: 'true' },
                        { label: 'Pending', value: 'false' },
                    ].map(({ label, value }) => (
                        <button
                            key={value}
                            onClick={() => setFilter((f) => ({ ...f, isApproved: value, page: 1 }))}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter.isApproved === value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="py-20"><Spinner size="lg" /></div>
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
                                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${doc.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {doc.isApproved ? 'Approved' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
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
        </div>
    );
};

export default AdminDoctors;
