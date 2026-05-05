import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    const delta = 2;
    const left = currentPage - delta;
    const right = currentPage + delta + 1;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= left && i < right)) {
            pages.push(i);
        }
    }

    const withEllipsis = [];
    let prev;
    for (const page of pages) {
        if (prev && page - prev > 1) withEllipsis.push('...');
        withEllipsis.push(page);
        prev = page;
    }

    return (
        <div className="flex items-center justify-center gap-1 mt-6">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
            >
                <FaChevronLeft className="text-sm" />
            </button>

            {withEllipsis.map((page, idx) =>
                page === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-3 py-2 text-gray-400">...</span>
                ) : (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${currentPage === page
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                    >
                        {page}
                    </button>
                )
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
            >
                <FaChevronRight className="text-sm" />
            </button>
        </div>
    );
};

export default Pagination;
