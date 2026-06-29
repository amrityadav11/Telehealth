import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
    FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaSearch, FaTimes,
} from 'react-icons/fa';
import Spinner from '../../components/common/Spinner';

const CATEGORIES = ['General', 'Diet', 'Fitness', 'Mental Health', 'Diseases', 'Lifestyle'];

const EMPTY_FORM = {
    title: '',
    summary: '',
    content: '',
    category: 'General',
    tags: '',
    coverImage: { url: '', public_id: '' },
    isPublished: true,
};

// ── Article Form Modal ────────────────────────────────────────────────────
const ArticleFormModal = ({ article, onClose, onSaved }) => {
    const isEdit = !!article;
    const [form, setForm] = useState(
        isEdit
            ? {
                title: article.title,
                summary: article.summary,
                content: article.content,
                category: article.category,
                tags: (article.tags || []).join(', '),
                coverImage: article.coverImage || { url: '', public_id: '' },
                isPublished: article.isPublished,
            }
            : { ...EMPTY_FORM }
    );
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.summary.trim() || !form.content.trim()) {
            toast.error('Title, summary, and content are required.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
            };
            if (isEdit) {
                await api.put(`/articles/${article._id}`, payload);
                toast.success('Article updated!');
            } else {
                await api.post('/articles', payload);
                toast.success('Article created!');
            }
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save article');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Article' : 'New Article'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input name="title" value={form.title} onChange={handleChange}
                            className="input-field" placeholder="Article title..." required />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select name="category" value={form.category} onChange={handleChange} className="input-field">
                            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Summary */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Summary * <span className="text-gray-400 font-normal">(shown in card)</span></label>
                        <textarea name="summary" value={form.summary} onChange={handleChange}
                            rows={2} className="input-field resize-none"
                            placeholder="Brief description..." required />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                        <textarea name="content" value={form.content} onChange={handleChange}
                            rows={10} className="input-field resize-y font-mono text-sm"
                            placeholder="Full article content..." required />
                    </div>

                    {/* Cover image URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL <span className="text-gray-400 font-normal">(optional)</span></label>
                        <input
                            value={form.coverImage.url}
                            onChange={(e) => setForm((prev) => ({ ...prev, coverImage: { ...prev.coverImage, url: e.target.value } }))}
                            className="input-field" placeholder="https://..." />
                        {form.coverImage.url && (
                            <img src={form.coverImage.url} alt="preview" className="mt-2 h-24 rounded-lg object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }} />
                        )}
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags <span className="text-gray-400 font-normal">(comma separated)</span></label>
                        <input name="tags" value={form.tags} onChange={handleChange}
                            className="input-field" placeholder="nutrition, diet, health..." />
                    </div>

                    {/* Published toggle */}
                    <div className="flex items-center gap-3">
                        <input type="checkbox" id="isPublished" name="isPublished"
                            checked={form.isPublished} onChange={handleChange}
                            className="w-4 h-4 text-blue-600 rounded" />
                        <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
                            Published (visible to patients)
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary flex-1">
                            {saving ? 'Saving...' : isEdit ? 'Update Article' : 'Create Article'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Main Admin Articles Page ──────────────────────────────────────────────
const AdminArticles = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editArticle, setEditArticle] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const fetchArticles = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/articles/admin/all');
            setArticles(data.articles);
        } catch (err) {
            toast.error('Failed to load articles');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchArticles(); }, [fetchArticles]);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this article? This cannot be undone.')) return;
        setDeleting(id);
        try {
            await api.delete(`/articles/${id}`);
            toast.success('Article deleted');
            setArticles((prev) => prev.filter((a) => a._id !== id));
        } catch (err) {
            toast.error('Failed to delete');
        } finally {
            setDeleting(null);
        }
    };

    const handleTogglePublish = async (article) => {
        try {
            await api.put(`/articles/${article._id}`, { isPublished: !article.isPublished });
            toast.success(article.isPublished ? 'Article unpublished' : 'Article published');
            setArticles((prev) =>
                prev.map((a) => a._id === article._id ? { ...a, isPublished: !a.isPublished } : a)
            );
        } catch (err) {
            toast.error('Failed to update');
        }
    };

    const filtered = articles.filter((a) =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Health Hub Articles</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage health tips and articles for patients</p>
                </div>
                <button
                    onClick={() => { setEditArticle(null); setShowForm(true); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <FaPlus /> New Article
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-sm">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search articles..."
                    className="input-field pl-9"
                />
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : filtered.length === 0 ? (
                <div className="card text-center py-16 text-gray-400">
                    <div className="text-4xl mb-3">📰</div>
                    <p className="font-medium text-gray-600">No articles yet</p>
                    <p className="text-sm mt-1">Click "New Article" to create your first health article</p>
                </div>
            ) : (
                <div className="card p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-100">
                                    <th className="px-4 py-3 font-medium">Title</th>
                                    <th className="px-4 py-3 font-medium">Category</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Views</th>
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((article) => (
                                    <tr key={article._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 truncate max-w-[260px]">{article.title}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{article.readTime} min read</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                                {article.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${article.isPublished
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {article.isPublished ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{article.views || 0}</td>
                                        <td className="px-4 py-3 text-gray-400 text-xs">
                                            {new Date(article.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Toggle publish */}
                                                <button
                                                    onClick={() => handleTogglePublish(article)}
                                                    title={article.isPublished ? 'Unpublish' : 'Publish'}
                                                    className={`p-1.5 rounded-lg transition-colors ${article.isPublished
                                                            ? 'text-green-600 hover:bg-green-50'
                                                            : 'text-gray-400 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {article.isPublished ? <FaEye /> : <FaEyeSlash />}
                                                </button>
                                                {/* Edit */}
                                                <button
                                                    onClick={() => { setEditArticle(article); setShowForm(true); }}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </button>
                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDelete(article._id)}
                                                    disabled={deleting === article._id}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                                                    title="Delete"
                                                >
                                                    <FaTrash />
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

            {/* Form modal */}
            {showForm && (
                <ArticleFormModal
                    article={editArticle}
                    onClose={() => { setShowForm(false); setEditArticle(null); }}
                    onSaved={fetchArticles}
                />
            )}
        </div>
    );
};

export default AdminArticles;
