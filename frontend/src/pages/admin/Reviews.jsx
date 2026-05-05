import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import StarRating from '../../components/common/StarRating';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash, FaTrash } from 'react-icons/fa';
import { format } from 'date-fns';

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all | visible | hidden
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchReviews = async (p = 1, f = filter) => {
        setLoading(true);
        try {
            const params = { page: p, limit: 20 };
            if (f === 'visible') params.isVisible = true;
            if (f === 'hidden') params.isVisible = false;
            const { data } = await api.get('/reviews/admin/all', { params });
            setReviews(data.reviews);
            setPages(data.pages);
            setTotal(data.total);
        } catch (err) {
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews(page, filter);
    }, [page, filter]);

    const handleModerate = async (id, isVisible) => {
        try {
            await api.put(`/reviews/${id}/moderate`, { isVisible });
            toast.success(isVisible ? 'Review approved and visible' : 'Review hidden');
            setReviews((prev) => prev.map((r) => r._id === id ? { ...r, isVisible } : r));
        } catch (err) {
            toast.error('Failed to update review');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Permanently delete this review?')) return;
        try {
            await api.delete(`/reviews/${id}`);
            toast.success('Review deleted');
            setReviews((prev) => prev.filter((r) => r._id !== id));
            setTotal((t) => t - 1);
        } catch (err) {
            toast.error('Failed to delete review');
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Review Moderation</h1>
                    <p className="text-gray-500 text-sm mt-1">{total} total reviews</p>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6">
                {['all', 'visible', 'hidden'].map((f) => (
                    <button
                        key={f}
                        onClick={() => { setFilter(f); setPage(1); }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="py-20"><Spinner size="lg" /></div>
            ) : reviews.length === 0 ? (
                <div className="card text-center py-12 text-gray-500">No reviews found.</div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review._id} className={`card ${!review.isVisible ? 'opacity-60 border-l-4 border-red-300' : ''}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <img
                                        src={review.patient?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.patient?.name || 'P')}&size=40`}
                                        alt={review.patient?.name}
                                        className="w-10 h-10 rounded-full flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-gray-900">{review.patient?.name}</span>
                                            <span className="text-gray-400 text-sm">→</span>
                                            <span className="text-blue-600 text-sm">Dr. {review.doctor?.user?.name}</span>
                                            <StarRating rating={review.rating} size="sm" />
                                            {!review.isVisible && (
                                                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Hidden</span>
                                            )}
                                        </div>
                                        <p className="text-gray-600 text-sm mt-1">{review.comment}</p>
                                        <p className="text-gray-400 text-xs mt-1">
                                            {format(new Date(review.createdAt), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleModerate(review._id, !review.isVisible)}
                                        title={review.isVisible ? 'Hide review' : 'Show review'}
                                        className={`p-2 rounded-lg transition-colors ${review.isVisible
                                            ? 'text-yellow-600 hover:bg-yellow-50'
                                            : 'text-green-600 hover:bg-green-50'
                                            }`}
                                    >
                                        {review.isVisible ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(review._id)}
                                        title="Delete review"
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <FaTrash />
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
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminReviews;
