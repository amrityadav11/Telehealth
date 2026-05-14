import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import {
    FaMoneyBillWave, FaPlus, FaTimes, FaCheckCircle,
    FaClock, FaTimesCircle, FaWallet, FaChartBar,
} from 'react-icons/fa';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: FaClock },
    processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700', icon: FaClock },
    completed: { label: 'Paid', color: 'bg-green-100 text-green-700', icon: FaCheckCircle },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: FaTimesCircle },
};

const DoctorPayouts = () => {
    const [payouts, setPayouts] = useState([]);
    const [summary, setSummary] = useState(null);
    const [breakdown, setBreakdown] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const [form, setForm] = useState({
        amount: '',
        method: 'bank_transfer',
        bankDetails: {
            accountName: '',
            accountNumber: '',
            ifscCode: '',
            bankName: '',
            upiId: '',
        },
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [payoutsRes, breakdownRes] = await Promise.all([
                api.get('/payouts/my-payouts'),
                api.get('/payouts/earnings-breakdown'),
            ]);
            setPayouts(payoutsRes.data.payouts);
            setSummary(payoutsRes.data.summary);
            setBreakdown(breakdownRes.data);
        } catch {
            toast.error('Failed to load payout data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.amount || Number(form.amount) < 1) {
            toast.error('Enter a valid amount');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/payouts/request', form);
            toast.success('Payout request submitted!');
            setShowForm(false);
            setForm({ amount: '', method: 'bank_transfer', bankDetails: { accountName: '', accountNumber: '', ifscCode: '', bankName: '', upiId: '' } });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    const monthlyChartData = (breakdown?.monthlyEarnings || []).map((m) => ({
        name: MONTH_NAMES[m._id.month - 1],
        earnings: m.earnings,
        appointments: m.appointments,
    }));

    if (loading) return <div className="py-20"><Spinner size="lg" /></div>;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaMoneyBillWave className="text-green-500" /> Payouts
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your earnings and withdrawal requests</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <FaPlus /> Request Payout
                </button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                                <FaChartBar className="text-green-600" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Earnings</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{summary.totalEarnings?.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FaCheckCircle className="text-blue-600" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Paid Out</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{summary.totalPaidOut?.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                                <FaWallet className="text-purple-600" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Available Balance</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">₹{summary.availableBalance?.toLocaleString()}</p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl w-fit">
                {['overview', 'history'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <>
                    {/* Monthly Earnings Chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 mb-6">
                        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Earnings</h2>
                        {monthlyChartData.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No earnings data yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={monthlyChartData}>
                                    <defs>
                                        <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                                    <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Earnings']} />
                                    <Area type="monotone" dataKey="earnings" stroke="#16a34a" fill="url(#earningsGrad)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Earnings by type */}
                    {breakdown?.byType?.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Earnings by Appointment Type</h2>
                            <ResponsiveContainer width="100%" height={160}>
                                <BarChart data={breakdown.byType}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                                    <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Earnings']} />
                                    <Bar dataKey="earnings" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'history' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Payout History</h2>
                    </div>
                    {payouts.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">
                            <FaMoneyBillWave className="text-3xl mx-auto mb-2" />
                            <p className="text-sm">No payout requests yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50 dark:divide-gray-700">
                            {payouts.map((payout) => {
                                const cfg = STATUS_CONFIG[payout.status] || STATUS_CONFIG.pending;
                                const Icon = cfg.icon;
                                return (
                                    <div key={payout._id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-semibold text-gray-900 dark:text-white">₹{payout.amount?.toLocaleString()}</p>
                                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                                                    <Icon className="text-xs" /> {cfg.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                {payout.method?.replace('_', ' ')} · {format(new Date(payout.createdAt), 'MMM d, yyyy')}
                                            </p>
                                            {payout.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{payout.notes}</p>}
                                        </div>
                                        <div className="text-right">
                                            {payout.transactionId && (
                                                <p className="text-xs text-gray-400">TXN: {payout.transactionId}</p>
                                            )}
                                            {payout.processedAt && (
                                                <p className="text-xs text-gray-400">{format(new Date(payout.processedAt), 'MMM d, yyyy')}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Request Payout Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Request Payout</h2>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                            {summary && (
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-sm">
                                    <p className="text-green-700 dark:text-green-300 font-medium">
                                        Available Balance: ₹{summary.availableBalance?.toLocaleString()}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹) *</label>
                                <input
                                    type="number"
                                    value={form.amount}
                                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Enter amount"
                                    min={1}
                                    max={summary?.availableBalance}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                                <select
                                    value={form.method}
                                    onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="upi">UPI</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>

                            {form.method === 'upi' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UPI ID</label>
                                    <input
                                        type="text"
                                        value={form.bankDetails.upiId}
                                        onChange={(e) => setForm((f) => ({ ...f, bankDetails: { ...f.bankDetails, upiId: e.target.value } }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="yourname@upi"
                                    />
                                </div>
                            ) : form.method === 'bank_transfer' ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
                                            <input
                                                type="text"
                                                value={form.bankDetails.accountName}
                                                onChange={(e) => setForm((f) => ({ ...f, bankDetails: { ...f.bankDetails, accountName: e.target.value } }))}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="Full name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name</label>
                                            <input
                                                type="text"
                                                value={form.bankDetails.bankName}
                                                onChange={(e) => setForm((f) => ({ ...f, bankDetails: { ...f.bankDetails, bankName: e.target.value } }))}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="Bank name"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number</label>
                                        <input
                                            type="text"
                                            value={form.bankDetails.accountNumber}
                                            onChange={(e) => setForm((f) => ({ ...f, bankDetails: { ...f.bankDetails, accountNumber: e.target.value } }))}
                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="Account number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IFSC Code</label>
                                        <input
                                            type="text"
                                            value={form.bankDetails.ifscCode}
                                            onChange={(e) => setForm((f) => ({ ...f, bankDetails: { ...f.bankDetails, ifscCode: e.target.value } }))}
                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="IFSC code"
                                        />
                                    </div>
                                </div>
                            ) : null}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-60">
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorPayouts;
