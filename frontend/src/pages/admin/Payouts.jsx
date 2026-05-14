import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
    FaMoneyBillWave, FaCheckCircle, FaClock, FaTimesCircle,
    FaTimes, FaSearch,
} from 'react-icons/fa';

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: FaClock },
    processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700', icon: FaClock },
    completed: { label: 'Paid', color: 'bg-green-100 text-green-700', icon: FaCheckCircle },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: FaTimesCircle },
};

const AdminPayouts = () => {
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('pending');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedPayout, setSelectedPayout] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [processForm, setProcessForm] = useState({ status: 'completed', transactionId: '', notes: '' });

    const fetchPayouts = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 15 };
            if (filterStatus) params.status = filterStatus;
            const { data } = await api.get('/payouts/admin/all', { params });
            setPayouts(data.payouts);
            setPages(data.pages);
            setTotal(data.total);
        } catch {
            toast.error('Failed to load payouts');
        } finally {
            setLoading(false);
        }
    }, [page, filterStatus]);

    useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

    const handleProcess = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const { data } = await api.put(`/payouts/admin/${selectedPayout._id}/process`, processForm);
            toast.success(`Payout ${processForm.status}`);
            setPayouts((prev) => prev.map((p) => p._id === selectedPayout._id ? data.payout : p));
            setSelectedPayout(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to process payout');
        } finally {
            setProcessing(false);
        }
    };

    const StatusBadge = ({ status }) => {
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
        const Icon = cfg.icon;
        return (
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                <Icon className="text-xs" /> {cfg.label}
            </span>
        );
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaMoneyBillWave className="text-green-500" /> Payout Requests
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{total} request{total !== 1 ? 's' : ''}</p>
                </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {['', 'pending', 'processing', 'completed', 'rejected'].map((s) => (
                    <button
                        key={s}
                        onClick={() => { setFilterStatus(s); setPage(1); }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
                    >
                        {s === '' ? 'All' : STATUS_CONFIG[s]?.label || s}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="py-20"><Spinner size="lg" /></div>
            ) : payouts.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center py-16">
                    <FaMoneyBillWave className="text-gray-300 text-5xl mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No payout requests found</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                    <th className="px-5 py-3 font-medium">Doctor</th>
                                    <th className="px-5 py-3 font-medium">Amount</th>
                                    <th className="px-5 py-3 font-medium">Method</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 font-medium">Requested</th>
                                    <th className="px-5 py-3 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {payouts.map((payout) => (
                                    <tr key={payout._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-5 py-3">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{payout.doctor?.user?.name}</p>
                                                <p className="text-xs text-gray-400">{payout.doctor?.user?.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 font-semibold text-green-600">₹{payout.amount?.toLocaleString()}</td>
                                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400 capitalize">{payout.method?.replace('_', ' ')}</td>
                                        <td className="px-5 py-3"><StatusBadge status={payout.status} /></td>
                                        <td className="px-5 py-3 text-gray-400 text-xs">{format(new Date(payout.createdAt), 'MMM d, yyyy')}</td>
                                        <td className="px-5 py-3">
                                            {payout.status === 'pending' && (
                                                <button
                                                    onClick={() => { setSelectedPayout(payout); setProcessForm({ status: 'completed', transactionId: '', notes: '' }); }}
                                                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    Process
                                                </button>
                                            )}
                                            {payout.transactionId && (
                                                <p className="text-xs text-gray-400">TXN: {payout.transactionId}</p>
                                            )}
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
                    {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                        <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>{p}</button>
                    ))}
                </div>
            )}

            {/* Process Modal */}
            {selectedPayout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Process Payout</h2>
                            <button onClick={() => setSelectedPayout(null)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">{selectedPayout.doctor?.user?.name}</span> — ₹{selectedPayout.amount?.toLocaleString()} via {selectedPayout.method?.replace('_', ' ')}
                            </p>
                            {selectedPayout.bankDetails?.accountNumber && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Account: {selectedPayout.bankDetails.accountNumber} · IFSC: {selectedPayout.bankDetails.ifscCode}
                                </p>
                            )}
                            {selectedPayout.bankDetails?.upiId && (
                                <p className="text-xs text-gray-400 mt-1">UPI: {selectedPayout.bankDetails.upiId}</p>
                            )}
                        </div>
                        <form onSubmit={handleProcess} className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action</label>
                                <select
                                    value={processForm.status}
                                    onChange={(e) => setProcessForm((f) => ({ ...f, status: e.target.value }))}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="processing">Mark as Processing</option>
                                    <option value="completed">Mark as Paid</option>
                                    <option value="rejected">Reject</option>
                                </select>
                            </div>
                            {processForm.status === 'completed' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction ID</label>
                                    <input
                                        type="text"
                                        value={processForm.transactionId}
                                        onChange={(e) => setProcessForm((f) => ({ ...f, transactionId: e.target.value }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Bank/UPI transaction ID"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                                <textarea
                                    value={processForm.notes}
                                    onChange={(e) => setProcessForm((f) => ({ ...f, notes: e.target.value }))}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                    rows={2}
                                    placeholder="Optional notes for the doctor..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setSelectedPayout(null)} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                                    Cancel
                                </button>
                                <button type="submit" disabled={processing} className={`flex-1 py-2.5 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-60 ${processForm.status === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                    {processing ? 'Processing...' : 'Confirm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPayouts;
