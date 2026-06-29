import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
    FaSearch, FaLeaf, FaDumbbell, FaBrain, FaVirus, FaHeart,
    FaStar, FaClock, FaEye, FaArrowLeft, FaTimes,
} from 'react-icons/fa';
import Spinner from '../../components/common/Spinner';

const CATEGORIES = ['All', 'Diet', 'Fitness', 'Mental Health', 'Diseases', 'Lifestyle', 'General'];

const CATEGORY_META = {
    All: { icon: FaStar, color: 'bg-blue-100 text-blue-700', badge: 'bg-blue-600' },
    Diet: { icon: FaLeaf, color: 'bg-green-100 text-green-700', badge: 'bg-green-600' },
    Fitness: { icon: FaDumbbell, color: 'bg-orange-100 text-orange-700', badge: 'bg-orange-500' },
    'Mental Health': { icon: FaBrain, color: 'bg-purple-100 text-purple-700', badge: 'bg-purple-600' },
    Diseases: { icon: FaVirus, color: 'bg-red-100 text-red-700', badge: 'bg-red-600' },
    Lifestyle: { icon: FaHeart, color: 'bg-pink-100 text-pink-700', badge: 'bg-pink-600' },
    General: { icon: FaStar, color: 'bg-gray-100 text-gray-700', badge: 'bg-gray-600' },
};

const COVER_FALLBACKS = {
    Diet: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
    Fitness: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
    'Mental Health': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80',
    Diseases: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
    Lifestyle: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80',
    General: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80',
};

// ── Article Card ──────────────────────────────────────────────────────────
const ArticleCard = ({ article, onClick }) => {
    const meta = CATEGORY_META[article.category] || CATEGORY_META.General;
    const Icon = meta.icon;
    const cover = article.coverImage?.url || COVER_FALLBACKS[article.category] || COVER_FALLBACKS.General;

    return (
        <button
            onClick={() => onClick(article)}
            className="card p-0 overflow-hidden text-left hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group flex flex-col"
        >
            {/* Cover image */}
            <div className="relative h-44 overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                    src={cover}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.src = COVER_FALLBACKS.General; }}
                />
                <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full text-white ${meta.badge}`}>
                    {article.category}
                </span>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {article.title}
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 flex-1">
                    {article.summary}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <FaClock className="text-xs" />
                        <span>{article.readTime} min read</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <FaEye className="text-xs" />
                        <span>{article.views || 0}</span>
                    </div>
                </div>
            </div>
        </button>
    );
};

// ── Article Detail Modal ──────────────────────────────────────────────────
const ArticleModal = ({ articleId, onClose }) => {
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!articleId) return;
        setLoading(true);
        api.get(`/articles/${articleId}`)
            .then(({ data }) => setArticle(data.article))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [articleId]);

    const meta = article ? (CATEGORY_META[article.category] || CATEGORY_META.General) : null;
    const cover = article?.coverImage?.url || (article ? COVER_FALLBACKS[article.category] : COVER_FALLBACKS.General);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {loading ? (
                    <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
                ) : !article ? (
                    <div className="p-8 text-center text-gray-500">Article not found.</div>
                ) : (
                    <>
                        {/* Cover */}
                        <div className="relative h-52 overflow-hidden rounded-t-2xl">
                            <img src={cover} alt={article.title} className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = COVER_FALLBACKS.General; }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <button
                                onClick={onClose}
                                className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
                            >
                                <FaTimes />
                            </button>
                            <div className="absolute bottom-4 left-4 right-4">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full text-white ${meta.badge} mb-2 inline-block`}>
                                    {article.category}
                                </span>
                                <h2 className="text-white font-bold text-lg leading-tight">{article.title}</h2>
                            </div>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-100 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><FaClock /> {article.readTime} min read</span>
                            <span className="flex items-center gap-1"><FaEye /> {article.views} views</span>
                            {article.author?.name && <span>By {article.author.name}</span>}
                            <span className="ml-auto">{new Date(article.createdAt).toLocaleDateString()}</span>
                        </div>

                        {/* Summary */}
                        <div className="px-6 pt-4 pb-2">
                            <p className="text-gray-600 text-sm italic border-l-4 border-blue-400 pl-3">{article.summary}</p>
                        </div>

                        {/* Content */}
                        <div className="px-6 pb-6 prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                            {article.content}
                        </div>

                        {/* Tags */}
                        {article.tags?.length > 0 && (
                            <div className="px-6 pb-6 flex flex-wrap gap-2">
                                {article.tags.map((tag) => (
                                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// ── Main HealthHub Page ───────────────────────────────────────────────────
const HealthHub = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [category, setCategory] = useState('All');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedId, setSelectedId] = useState(null);

    const fetchArticles = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 12 };
            if (category !== 'All') params.category = category;
            if (search) params.search = search;
            const { data } = await api.get('/articles', { params });
            setArticles(data.articles);
            setTotalPages(data.pages);
            setTotal(data.total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, category, search]);

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    // Reset page when filter changes
    useEffect(() => {
        setPage(1);
    }, [category, search]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearch(searchInput);
    };

    const clearSearch = () => {
        setSearch('');
        setSearchInput('');
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    🌿 Health Hub
                </h1>
                <p className="text-gray-500 mt-1">
                    Daily health tips, articles, and wellness guidance curated for you.
                </p>
            </div>

            {/* Search + Category filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search articles, tips..."
                            className="input-field pl-9 pr-8"
                        />
                        {searchInput && (
                            <button type="button" onClick={clearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <FaTimes className="text-xs" />
                            </button>
                        )}
                    </div>
                    <button type="submit" className="btn-primary px-5">Search</button>
                </form>
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2 mb-6">
                {CATEGORIES.map((cat) => {
                    const meta = CATEGORY_META[cat] || CATEGORY_META.General;
                    const Icon = meta.icon;
                    const isActive = category === cat;
                    return (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${isActive
                                    ? `${meta.badge} text-white border-transparent shadow-sm`
                                    : `${meta.color} border-transparent hover:shadow-sm`
                                }`}
                        >
                            <Icon className="text-xs" />
                            {cat}
                        </button>
                    );
                })}
            </div>

            {/* Results count */}
            {!loading && (
                <p className="text-sm text-gray-500 mb-4">
                    {total} article{total !== 1 ? 's' : ''}
                    {category !== 'All' ? ` in ${category}` : ''}
                    {search ? ` matching "${search}"` : ''}
                </p>
            )}

            {/* Articles grid */}
            {loading ? (
                <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : articles.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <div className="text-5xl mb-4">📰</div>
                    <p className="font-medium text-gray-600">No articles found</p>
                    <p className="text-sm mt-1">Try a different search or category</p>
                    {(search || category !== 'All') && (
                        <button onClick={() => { clearSearch(); setCategory('All'); }}
                            className="btn-secondary mt-4 text-sm">
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {articles.map((article) => (
                        <ArticleCard key={article._id} article={article} onClick={(a) => setSelectedId(a._id)} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="btn-secondary text-sm disabled:opacity-40"
                    >
                        ← Prev
                    </button>
                    <span className="text-sm text-gray-600">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="btn-secondary text-sm disabled:opacity-40"
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Article detail modal */}
            {selectedId && (
                <ArticleModal articleId={selectedId} onClose={() => setSelectedId(null)} />
            )}
        </div>
    );
};

export default HealthHub;
