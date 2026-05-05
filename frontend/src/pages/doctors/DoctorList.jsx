import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchDoctors, fetchCategories } from '../../store/slices/doctorSlice';
import DoctorCard from '../../components/doctors/DoctorCard';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';

const DoctorList = () => {
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const { doctors, categories, loading, total, pages, currentPage } = useSelector((s) => s.doctors);

    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || '',
        minFee: searchParams.get('minFee') || '',
        maxFee: searchParams.get('maxFee') || '',
        minRating: searchParams.get('minRating') || '',
        sortBy: searchParams.get('sortBy') || 'rating',
        page: 1,
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    useEffect(() => {
        const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
        dispatch(fetchDoctors(params));
        setSearchParams(params);
    }, [filters, dispatch]);

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    };

    const clearFilters = () => {
        setFilters({ search: '', category: '', minFee: '', maxFee: '', minRating: '', sortBy: 'rating', page: 1 });
    };

    const hasActiveFilters = filters.category || filters.minFee || filters.maxFee || filters.minRating;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Find a Doctor</h1>
                <p className="text-gray-600">{total} verified doctors available</p>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="input-field pl-10"
                        placeholder="Search by name or specialization..."
                    />
                </div>

                <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="input-field w-full sm:w-48"
                >
                    <option value="rating">Sort: Top Rated</option>
                    <option value="fee_asc">Sort: Fee (Low-High)</option>
                    <option value="fee_desc">Sort: Fee (High-Low)</option>
                    <option value="experience">Sort: Experience</option>
                    <option value="newest">Sort: Newest</option>
                </select>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-medium transition-colors ${hasActiveFilters ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <FaFilter />
                    Filters
                    {hasActiveFilters && <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">!</span>}
                </button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
                <div className="card mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className="input-field"
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Fee ($)</label>
                            <input
                                type="number"
                                value={filters.minFee}
                                onChange={(e) => handleFilterChange('minFee', e.target.value)}
                                className="input-field"
                                placeholder="0"
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Fee ($)</label>
                            <input
                                type="number"
                                value={filters.maxFee}
                                onChange={(e) => handleFilterChange('maxFee', e.target.value)}
                                className="input-field"
                                placeholder="500"
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
                            <select
                                value={filters.minRating}
                                onChange={(e) => handleFilterChange('minRating', e.target.value)}
                                className="input-field"
                            >
                                <option value="">Any Rating</option>
                                <option value="4">4+ Stars</option>
                                <option value="4.5">4.5+ Stars</option>
                            </select>
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 mt-3">
                            <FaTimes /> Clear all filters
                        </button>
                    )}
                </div>
            )}

            {/* Results */}
            {loading ? (
                <div className="py-20"><Spinner size="lg" /></div>
            ) : doctors.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-500 text-lg">No doctors found matching your criteria.</p>
                    <button onClick={clearFilters} className="btn-primary mt-4">Clear Filters</button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctors.map((doctor) => (
                            <DoctorCard key={doctor._id} doctor={doctor} />
                        ))}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={pages}
                        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
                    />
                </>
            )}
        </div>
    );
};

export default DoctorList;
