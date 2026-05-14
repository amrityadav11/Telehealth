import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import { format } from 'date-fns';
import {
    FaClipboardList, FaSignInAlt, FaSignOutAlt, FaSearch,
    FaUserCheck, FaUserTimes, FaShieldAlt, FaFilter,
} from 'react-icons/fa';

const ACTION_COLORS = {
    LOGIN: 'bg-green-100 text-green-700',
    LOGIN_2FA: 'bg-green-100 text-green-700',
    LOGIN_FAILED: 'bg-red-100 text-red-700',
    LOGOUT: 'bg-gray-100 text-gray-600',
    APPROVE_DOCTOR: 'bg-blue-100 text-blue-700',
    REJECT_DOCTOR: 'bg-red-100 text-red-700',
    VERIFY_DOCTOR: 'bg-purple-100 text-purple-700',
    UNVERIFY_DOCTOR: 'bg-orange-100 text-orange-700',
    ACTIVATE_USER: 'bg-green-100 text-green-700',
    DEACTIVATE_USER: 'bg-orange-100 text-orange-700',
    ENABLE_2FA: 'bg-indigo-100 text-indigo-700',
    DISABLE_2FA: 'bg-yellow-100 text-yellow-700',
};

const ROLE_COLORS = {
    admin: 'bg-purple-100 text-purple-700',
    doctor: 'bg-blue-100 text-blue-700',
    patient: 'bg-green-100 text-green-700',
};

const STATUS_COLORS = {
    success: 'bg-green-100 text-green-700',
    failure: 'bg-red-100 text-red-700',
};

const ACTIONS = [
    'LOGIN', 'LOGIN_2FA', 'LOGIN_FAILED', 'LOGOUT',
    'APPROVE_DOCTOR', 'REJECT_DOCTOR', 'VERIFY_DOCTOR',
    'ACTIVATE_USER', 'DEACTIVATE_USER',
    'ENABLE_2FA', 'DISABLE_2FA',
];

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);

    // Summary counts
    const [summary, setSummary] = useState({
        logins: 0, logouts: 0, loginFailed: 0,
        approvals: 0, rejections: 0,
    });

    const [filters, setFilters] = useState({
        action: '',
        actorRole: '',
        search: '',
    });

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (filters.action) params.action = filters.action;
            if (filters.actorRole) params.actorRole = filters.actorRole;
            if (filters.search) params.search = filters.search;

            const { data } = await api.get('/admin/audit-logs', { params });
            setLogs(data.logs);
            setTotal(data.total);
            setPages(data.pages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    // Fetch summary counts (no filters)
    const fetchSummary = async () => {
        try {
            const [loginRes, logoutRes, failRes, approveRes, rejectRes] = await Promise.all([
                api.get('/admin/audit-logs', { params: { action: 'LOGIN', limit: 1 } }),
                api.get('/admin/audit-logs', { params: { action: 'LOGOUT', limit: 1 } }),
                api.get('/admin/audit-logs', { params: { action: 'LOGIN_FAILED', limit: 1 } }),
                api.get('/admin/audit-logs', { params: { action: 'APPROVE_DOCTOR', limit: 1 } }),
                api.get('/admin/audit-logs', { params: { action: 'REJECT_DOCTOR', limit: 1 } }),
            ]);
            setSummary({
                logins: loginRes.data.total,
                logouts: logoutRes.data.total,
                loginFailed: failRes.data.total,
                approvals: approveRes.data.total,
                rejections: rejectRes.data.total,
            });
        } catch { }
    };

    useEffect(() => { fetchLogs(); }, [fetchLogs]);
    useEffect(() => { fetchSummary(); }, []);

    const handleFilterChange = (key, value) => {
        setFilters((f) => ({ ...f, [key]: value }));
        setPage(1);
    };

    const handleClearFilters = () => {
        setFilters({ action: '', actorRole: '', search: '' });
        setPage(1);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FaClipboardList className="text-blue-500" /> Audit Logs
                </h1>
                <p className="text-gray-500 text-sm mt-1">Track all admin actions, logins, and system events</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div className="card text-center py-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleFilterChange('action', 'LOGIN')}>
                    <FaSignInAlt className="text-green-500 text-2xl mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{summary.logins}</p>
                    <p className="text-xs text-gray-500">Logins</p>
                </div>
                <div className="card text-center py-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleFilterChange('action', 'LOGOUT')}>
                    <FaSignOutAlt className="text-gray-500 text-2xl mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{summary.logouts}</p>
                    <p className="text-xs text-gray-500">Logouts</p>
                </div>
                <div className="card text-center py-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleFilterChange('action', 'LOGIN_FAILED')}>
                    <FaUserTimes className="text-red-500 text-2xl mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{summary.loginFailed}</p>
                    <p className="text-xs text-gray-500">Failed Logins</p>
                </div>
                <div className="card text-center py-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleFilterChange('action', 'APPROVE_DOCTOR')}>
                    <FaUserCheck className="text-blue-500 text-2xl mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{summary.approvals}</p>
                    <p className="text-xs text-gray-500">Doctor Approvals</p>
                </div>
                <div className="card text-center py-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleFilterChange('action', 'REJECT_DOCTOR')}>
                    <FaShieldAlt className="text-purple-500 text-2xl mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{summary.rejections}</p>
                    <p className="text-xs text-gray-500">Rejections</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="flex flex-wrap gap-3 items-end">
                    {/* Search */}
                    <div className="flex-1 min-w-[180px]">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                placeholder="Name, action, details..."
                                className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Action filter */}
                    <div className="min-w-[160px]">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
                        <select
                            value={filters.action}
                            onChange={(e) => handleFilterChange('action', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Actions</option>
                            {ACTIONS.map((a) => (
                                <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>

                    {/* Role filter */}
                    <div className="min-w-[130px]">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                        <select
                            value={filters.actorRole}
                            onChange={(e) => handleFilterChange('actorRole', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="doctor">Doctor</option>
                            <option value="patient">Patient</option>
                        </select>
                    </div>

                    {/* Clear */}
                    {(filters.action || filters.actorRole || filters.search) && (
                        <button
                            onClick={handleClearFilters}
                            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                        >
                            <FaFilter className="text-xs" /> Clear
                        </button>
                    )}

                    <p className="ml-auto text-sm text-gray-500 self-end">{total} records</p>
                </div>
            </div>

            {/* Logs Table */}
            {loading ? (
                <div className="py-20"><Spinner size="lg" /></div>
            ) : logs.length === 0 ? (
                <div className="card text-center py-16">
                    <FaClipboardList className="text-gray-300 text-5xl mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No audit logs found</p>
                    <p className="text-gray-400 text-sm mt-1">Logs will appear here as actions are performed</p>
                </div>
            ) : (
                <div className="card overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Details</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                                            {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                                            {log.actorName || log.actor?.name || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[log.actorRole] || 'bg-gray-100 text-gray-600'}`}>
                                                {log.actorRole || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate text-xs">
                                            {log.details || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[log.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                                            {log.ipAddress || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                    >
                        ← Prev
                    </button>
                    {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {p}
                        </button>
                    ))}
                    <button
                        onClick={() => setPage((p) => Math.min(pages, p + 1))}
                        disabled={page === pages}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
};

export default AuditLogs;
