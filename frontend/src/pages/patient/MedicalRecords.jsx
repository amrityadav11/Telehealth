import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
    FaFileMedical, FaUpload, FaTrash,
    FaShareAlt, FaLock, FaFileImage, FaFilePdf, FaFileAlt, FaTimes, FaPlus,
    FaEye,
} from 'react-icons/fa';

const RECORD_TYPES = [
    { value: 'lab_report', label: 'Lab Report', color: 'bg-blue-100 text-blue-700' },
    { value: 'prescription', label: 'Prescription', color: 'bg-green-100 text-green-700' },
    { value: 'imaging', label: 'Imaging / X-Ray', color: 'bg-purple-100 text-purple-700' },
    { value: 'vaccination', label: 'Vaccination', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'discharge_summary', label: 'Discharge Summary', color: 'bg-red-100 text-red-700' },
    { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700' },
];

const getTypeStyle = (type) =>
    RECORD_TYPES.find((t) => t.value === type)?.color || 'bg-gray-100 text-gray-700';

const getTypeLabel = (type) =>
    RECORD_TYPES.find((t) => t.value === type)?.label || 'Other';

const FileIcon = ({ mimeType }) => {
    if (mimeType?.includes('pdf')) return <FaFilePdf className="text-red-500 text-2xl" />;
    if (mimeType?.includes('image')) return <FaFileImage className="text-blue-500 text-2xl" />;
    return <FaFileAlt className="text-gray-500 text-2xl" />;
};

const MedicalRecords = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [filterType, setFilterType] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        title: '',
        description: '',
        recordType: 'other',
        tags: '',
        file: null,
    });
    const [preview, setPreview] = useState(null);

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 12 };
            if (filterType) params.recordType = filterType;
            const { data } = await api.get('/medical-records', { params });
            setRecords(data.records);
            setPages(data.pages);
            setTotal(data.total);
        } catch (err) {
            toast.error('Failed to load records');
        } finally {
            setLoading(false);
        }
    }, [page, filterType]);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be under 5MB');
            return;
        }
        setForm((f) => ({ ...f, file }));
        if (file.type.startsWith('image/')) {
            setPreview(URL.createObjectURL(file));
        } else {
            setPreview(null);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!form.file) { toast.error('Please select a file'); return; }
        if (!form.title.trim()) { toast.error('Title is required'); return; }

        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', form.file);
            fd.append('title', form.title.trim());
            fd.append('description', form.description.trim());
            fd.append('recordType', form.recordType);
            fd.append('tags', form.tags);

            await api.post('/medical-records', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Record uploaded successfully!');
            setShowUpload(false);
            setForm({ title: '', description: '', recordType: 'other', tags: '', file: null });
            setPreview(null);
            fetchRecords();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this record? This cannot be undone.')) return;
        try {
            await api.delete(`/medical-records/${id}`);
            toast.success('Record deleted');
            setRecords((prev) => prev.filter((r) => r._id !== id));
            setTotal((t) => t - 1);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed');
        }
    };

    const handleToggleShare = async (id) => {
        try {
            const { data } = await api.put(`/medical-records/${id}/share`);
            setRecords((prev) => prev.map((r) => r._id === id ? data.record : r));
            toast.success(data.record.isSharedWithDoctor ? 'Shared with doctors' : 'Hidden from doctors');
        } catch {
            toast.error('Failed to update sharing');
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaFileMedical className="text-blue-500" /> Medical Records
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {total} record{total !== 1 ? 's' : ''} · Securely stored
                    </p>
                </div>
                <button
                    onClick={() => setShowUpload(true)}
                    className="flex items-center gap-2 btn-primary text-sm"
                >
                    <FaPlus /> Upload Record
                </button>
            </div>

            {/* Type Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                <button
                    onClick={() => { setFilterType(''); setPage(1); }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterType === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
                >
                    All
                </button>
                {RECORD_TYPES.map((t) => (
                    <button
                        key={t.value}
                        onClick={() => { setFilterType(t.value); setPage(1); }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterType === t.value ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Records Grid */}
            {loading ? (
                <div className="py-20"><Spinner size="lg" /></div>
            ) : records.length === 0 ? (
                <div className="card dark:bg-gray-800 text-center py-16">
                    <FaFileMedical className="text-gray-300 text-5xl mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No records found</p>
                    <p className="text-gray-400 text-sm mt-1">Upload your first medical record to get started</p>
                    <button onClick={() => setShowUpload(true)} className="btn-primary mt-4 text-sm">
                        Upload Now
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {records.map((record) => (
                        <div key={record._id} className="card dark:bg-gray-800 hover:shadow-md transition-shadow flex flex-col">
                            {/* File preview / icon */}
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                    {record.file?.mimeType?.startsWith('image/') ? (
                                        <img
                                            src={record.file.url}
                                            alt={record.title}
                                            className="w-12 h-12 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <FileIcon mimeType={record.file?.mimeType} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{record.title}</p>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getTypeStyle(record.recordType)}`}>
                                        {getTypeLabel(record.recordType)}
                                    </span>
                                </div>
                            </div>

                            {record.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{record.description}</p>
                            )}

                            {/* Tags */}
                            {record.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {record.tags.map((tag, i) => (
                                        <span key={i} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
                                <p className="text-xs text-gray-400 mb-2">
                                    {format(new Date(record.createdAt), 'MMM d, yyyy')}
                                </p>
                                <div className="flex items-center gap-2">
                                    {/* View/Download */}
                                    <a
                                        href={record.file?.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 px-2 py-1 rounded-lg transition-colors"
                                        title="View file"
                                    >
                                        <FaEye className="text-xs" /> View
                                    </a>

                                    {/* Share toggle */}
                                    <button
                                        onClick={() => handleToggleShare(record._id)}
                                        title={record.isSharedWithDoctor ? 'Shared with doctors — click to hide' : 'Hidden from doctors — click to share'}
                                        className={`flex items-center gap-1 text-xs font-medium border px-2 py-1 rounded-lg transition-colors ${record.isSharedWithDoctor
                                            ? 'text-green-600 border-green-200 hover:bg-green-50'
                                            : 'text-gray-400 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {record.isSharedWithDoctor ? <FaShareAlt className="text-xs" /> : <FaLock className="text-xs" />}
                                        {record.isSharedWithDoctor ? 'Shared' : 'Private'}
                                    </button>

                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(record._id)}
                                        className="ml-auto text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                        title="Delete record"
                                    >
                                        <FaTrash className="text-xs" />
                                    </button>
                                </div>
                            </div>
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

            {/* Upload Modal */}
            {showUpload && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Upload Medical Record</h2>
                            <button onClick={() => { setShowUpload(false); setPreview(null); }} className="text-gray-400 hover:text-gray-600">
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleUpload} className="px-6 py-5 space-y-4">
                            {/* File drop zone */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                            >
                                {preview ? (
                                    <img src={preview} alt="Preview" className="max-h-32 mx-auto rounded-lg object-contain" />
                                ) : form.file ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <FaFileAlt className="text-blue-500 text-2xl" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{form.file.name}</span>
                                    </div>
                                ) : (
                                    <>
                                        <FaUpload className="text-gray-400 text-3xl mx-auto mb-2" />
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload or drag & drop</p>
                                        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — max 5MB</p>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                    className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="e.g. Blood Test Report - Jan 2025"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Record Type</label>
                                <select
                                    value={form.recordType}
                                    onChange={(e) => setForm((f) => ({ ...f, recordType: e.target.value }))}
                                    className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    {RECORD_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                    className="input-field resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    rows={2}
                                    placeholder="Optional notes about this record..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
                                <input
                                    type="text"
                                    value={form.tags}
                                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                                    className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="e.g. blood, cholesterol, 2025"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowUpload(false); setPreview(null); }}
                                    className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading...</>
                                    ) : (
                                        <><FaUpload /> Upload</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicalRecords;
