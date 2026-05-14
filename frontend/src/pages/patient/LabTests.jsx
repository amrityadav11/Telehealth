import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
    FaFlask, FaPlus, FaTimes, FaUpload, FaTrash, FaEye,
    FaShareAlt, FaCheckCircle, FaClock, FaExclamationTriangle,
} from 'react-icons/fa';

const TEST_TYPES = [
    'Blood Test', 'Urine Test', 'X-Ray', 'MRI', 'CT Scan', 'Ultrasound',
    'ECG', 'Biopsy', 'Stool Test', 'Thyroid Test', 'Lipid Profile',
    'Liver Function', 'Kidney Function', 'Blood Sugar', 'Complete Blood Count', 'Other',
];

const STATUS_CONFIG = {
    ordered: { label: 'Ordered', color: 'bg-blue-100 text-blue-700', icon: FaClock },
    sample_collected: { label: 'Sample Collected', color: 'bg-yellow-100 text-yellow-700', icon: FaClock },
    processing: { label: 'Processing', color: 'bg-purple-100 text-purple-700', icon: FaClock },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: FaCheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: FaTimes },
};

const LabTests = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedTest, setSelectedTest] = useState(null);
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        testName: '',
        testType: 'Blood Test',
        scheduledDate: '',
        labName: '',
        labAddress: '',
        notes: '',
        price: '',
        priority: 'routine',
    });

    const fetchTests = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 10 };
            if (filterStatus) params.status = filterStatus;
            const { data } = await api.get('/lab-tests/my-tests', { params });
            setTests(data.labTests);
            setPages(data.pages);
            setTotal(data.total);
        } catch {
            toast.error('Failed to load lab tests');
        } finally {
            setLoading(false);
        }
    }, [page, filterStatus]);

    useEffect(() => { fetchTests(); }, [fetchTests]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/lab-tests', form);
            toast.success('Lab test ordered successfully!');
            setShowForm(false);
            setForm({ testName: '', testType: 'Blood Test', scheduledDate: '', labName: '', labAddress: '', notes: '', price: '', priority: 'routine' });
            fetchTests();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to order test');
        }
    };

    const handleUploadReport = async (testId, file) => {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }

        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const { data } = await api.put(`/lab-tests/${testId}/upload-report`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Report uploaded!');
            setTests((prev) => prev.map((t) => t._id === testId ? data.labTest : t));
            if (selectedTest?._id === testId) setSelectedTest(data.labTest);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleToggleShare = async (testId, current) => {
        try {
            const { data } = await api.put(`/lab-tests/${testId}`, { isSharedWithDoctor: !current });
            setTests((prev) => prev.map((t) => t._id === testId ? data.labTest : t));
            toast.success(data.labTest.isSharedWithDoctor ? 'Shared with doctor' : 'Hidden from doctor');
        } catch {
            toast.error('Failed to update sharing');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this lab test?')) return;
        try {
            await api.delete(`/lab-tests/${id}`);
            toast.success('Deleted');
            setTests((prev) => prev.filter((t) => t._id !== id));
        } catch {
            toast.error('Delete failed');
        }
    };

    const StatusBadge = ({ status }) => {
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ordered;
        const Icon = cfg.icon;
        return (
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                <Icon className="text-xs" /> {cfg.label}
            </span>
        );
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaFlask className="text-purple-500" /> Lab Tests
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{total} test{total !== 1 ? 's' : ''} total</p>
                </div>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <FaPlus /> Order Test
                </button>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {['', 'ordered', 'sample_collected', 'processing', 'completed', 'cancelled'].map((s) => (
                    <button
                        key={s}
                        onClick={() => { setFilterStatus(s); setPage(1); }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
                    >
                        {s === '' ? 'All' : STATUS_CONFIG[s]?.label || s}
                    </button>
                ))}
            </div>

            {/* Tests List */}
            {loading ? (
                <div className="py-20"><Spinner size="lg" /></div>
            ) : tests.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center py-16">
                    <FaFlask className="text-gray-300 text-5xl mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No lab tests found</p>
                    <button onClick={() => setShowForm(true)} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        Order First Test
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {tests.map((test) => (
                        <div key={test._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{test.testName}</h3>
                                        <StatusBadge status={test.status} />
                                        {test.priority !== 'routine' && (
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${test.priority === 'stat' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {test.priority.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{test.testType}</p>
                                    {test.labName && <p className="text-xs text-gray-400 mt-0.5">📍 {test.labName}</p>}
                                    {test.scheduledDate && (
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            📅 Scheduled: {format(new Date(test.scheduledDate), 'MMM d, yyyy')}
                                        </p>
                                    )}
                                    {test.results?.isAbnormal && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <FaExclamationTriangle className="text-amber-500 text-xs" />
                                            <span className="text-xs text-amber-600 font-medium">Abnormal result</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* View report */}
                                    {test.report?.url && (
                                        <a
                                            href={test.report.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 px-2 py-1 rounded-lg"
                                        >
                                            <FaEye className="text-xs" /> Report
                                        </a>
                                    )}

                                    {/* Upload report */}
                                    {!test.report?.url && test.status !== 'cancelled' && (
                                        <>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 border border-green-200 px-2 py-1 rounded-lg disabled:opacity-50"
                                            >
                                                <FaUpload className="text-xs" /> Upload
                                            </button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                className="hidden"
                                                onChange={(e) => handleUploadReport(test._id, e.target.files[0])}
                                            />
                                        </>
                                    )}

                                    {/* Share toggle */}
                                    <button
                                        onClick={() => handleToggleShare(test._id, test.isSharedWithDoctor)}
                                        title={test.isSharedWithDoctor ? 'Shared with doctor' : 'Share with doctor'}
                                        className={`p-1.5 rounded-lg border transition-colors ${test.isSharedWithDoctor ? 'text-green-600 border-green-200 bg-green-50' : 'text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        <FaShareAlt className="text-xs" />
                                    </button>

                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(test._id)}
                                        className="p-1.5 text-red-400 hover:text-red-600 border border-red-100 hover:border-red-200 rounded-lg transition-colors"
                                    >
                                        <FaTrash className="text-xs" />
                                    </button>
                                </div>
                            </div>

                            {/* Results summary */}
                            {test.results?.summary && (
                                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Results Summary</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{test.results.summary}</p>
                                    {test.results.interpretation && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{test.results.interpretation}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}

            {/* Order Test Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Order Lab Test</h2>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Test Name *</label>
                                <input
                                    type="text"
                                    value={form.testName}
                                    onChange={(e) => setForm((f) => ({ ...f, testName: e.target.value }))}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="e.g. Complete Blood Count"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Test Type</label>
                                    <select
                                        value={form.testType}
                                        onChange={(e) => setForm((f) => ({ ...f, testType: e.target.value }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        {TEST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                                    <select
                                        value={form.priority}
                                        onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="routine">Routine</option>
                                        <option value="urgent">Urgent</option>
                                        <option value="stat">STAT</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scheduled Date</label>
                                <input
                                    type="date"
                                    value={form.scheduledDate}
                                    onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lab Name</label>
                                <input
                                    type="text"
                                    value={form.labName}
                                    onChange={(e) => setForm((f) => ({ ...f, labName: e.target.value }))}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="e.g. City Diagnostics"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lab Address</label>
                                <input
                                    type="text"
                                    value={form.labAddress}
                                    onChange={(e) => setForm((f) => ({ ...f, labAddress: e.target.value }))}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Lab address"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        value={form.price}
                                        onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="0"
                                        min={0}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                    rows={2}
                                    placeholder="Any special instructions..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm">
                                    Order Test
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabTests;
