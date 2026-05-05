import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import { FaSearch, FaToggleOn, FaToggleOff, FaUserShield, FaPlus } from 'react-icons/fa';
import { format } from 'date-fns';

const roleBadge = {
    admin: 'bg-purple-100 text-purple-800',
    doctor: 'bg-blue-100 text-blue-800',
    patient: 'bg-gray-100 text-gray-800',
};

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ role: '', search: '', page: 1 });
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(0);
    const [roleModal, setRoleModal] = useState(null); // user to change role

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = { page: filter.page };
            if (filter.role) params.role = filter.role;
            if (filter.search) params.search = filter.search;
            const { data } = await api.get('/admin/users', { params });
            setUsers(data.users);
            setTotal(data.total);
            setPages(data.pages);
        } catch (err) {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, [filter]);

    const handleToggleStatus = async (userId) => {
        try {
            const { data } = await api.put(`/admin/users/${userId}/toggle-status`);
            toast.success(data.message);
            setUsers((prev) =>
                prev.map((u) => u._id === userId ? { ...u, isActive: !u.isActive } : u)
            );
        } catch (err) {
            toast.error(err.response?.data?.message || 'Action failed');
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const { data } = await api.put(`/admin/users/${userId}/role`, { role: newRole });
            toast.success(data.message);
            setUsers((prev) =>
                prev.map((u) => u._id === userId ? { ...u, role: newRole } : u)
            );
            setRoleModal(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Role change failed');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
                    <p className="text-gray-500 text-sm mt-1">{total} total accounts</p>
                </div>
                <Link
                    to="/admin/create-admin"
                    className="flex items-center gap-2 btn-primary text-sm whitespace-nowrap"
                >
                    <FaPlus /> Create Admin
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={filter.search}
                        onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value, page: 1 }))}
                        className="input-field pl-10"
                        placeholder="Search by name or email..."
                    />
                </div>
                <select
                    value={filter.role}
                    onChange={(e) => setFilter((f) => ({ ...f, role: e.target.value, page: 1 }))}
                    className="input-field w-full sm:w-44"
                >
                    <option value="">All Roles</option>
                    <option value="patient">Patients</option>
                    <option value="doctor">Doctors</option>
                    <option value="admin">Admins</option>
                </select>
            </div>

            {loading ? (
                <div className="py-20"><Spinner size="lg" /></div>
            ) : users.length === 0 ? (
                <div className="card text-center py-12 text-gray-500">No users found.</div>
            ) : (
                <div className="card overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                        {/* User info */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={
                                                        user.avatar?.url ||
                                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=${user.role === 'admin' ? '7c3aed' : user.role === 'doctor' ? '2563eb' : '6b7280'
                                                        }&color=fff&size=40`
                                                    }
                                                    alt={user.name}
                                                    className="w-10 h-10 rounded-full flex-shrink-0"
                                                />
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                                                    <p className="text-gray-500 text-xs">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role badge */}
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${roleBadge[user.role] || 'bg-gray-100 text-gray-800'}`}>
                                                {user.role === 'admin' && '🛡️ '}{user.role}
                                            </span>
                                        </td>

                                        {/* Joined date */}
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {format(new Date(user.createdAt), 'MMM d, yyyy')}
                                        </td>

                                        {/* Active status */}
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {user.isActive ? '● Active' : '● Inactive'}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {/* Promote to admin button (only for non-admins) */}
                                                {user.role !== 'admin' && (
                                                    <button
                                                        onClick={() => setRoleModal(user)}
                                                        className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                                                        title="Change role"
                                                    >
                                                        <FaUserShield className="text-xs" /> Role
                                                    </button>
                                                )}

                                                {/* Toggle active/inactive (not for admins) */}
                                                {user.role !== 'admin' && (
                                                    <button
                                                        onClick={() => handleToggleStatus(user._id)}
                                                        className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${user.isActive
                                                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            }`}
                                                    >
                                                        {user.isActive
                                                            ? <><FaToggleOff /> Deactivate</>
                                                            : <><FaToggleOn /> Activate</>
                                                        }
                                                    </button>
                                                )}

                                                {user.role === 'admin' && (
                                                    <span className="text-xs text-gray-400 italic">Admin account</span>
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

            {/* Role Change Modal */}
            {roleModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Change Role</h3>
                        <p className="text-gray-500 text-sm mb-5">
                            Change role for <strong>{roleModal.name}</strong>
                        </p>

                        <div className="space-y-2 mb-6">
                            {[
                                { role: 'patient', label: '🧑 Patient', desc: 'Can book appointments' },
                                { role: 'doctor', label: '👨‍⚕️ Doctor', desc: 'Can manage appointments & consultations' },
                                { role: 'admin', label: '🛡️ Admin', desc: 'Full platform access' },
                            ].map(({ role, label, desc }) => (
                                <button
                                    key={role}
                                    onClick={() => handleRoleChange(roleModal._id, role)}
                                    disabled={roleModal.role === role}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all ${roleModal.role === role
                                            ? 'border-blue-500 bg-blue-50 cursor-default'
                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm">{label}</p>
                                        <p className="text-xs text-gray-500">{desc}</p>
                                    </div>
                                    {roleModal.role === role && (
                                        <span className="text-xs text-blue-600 font-semibold">Current</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {roleModal.role !== 'admin' && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-4">
                                ⚠️ Promoting to Admin grants full access to all platform data.
                            </div>
                        )}

                        <button
                            onClick={() => setRoleModal(null)}
                            className="btn-secondary w-full"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
