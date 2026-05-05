import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

const StarRating = ({ rating = 0, maxStars = 5, size = 'sm', interactive = false, onChange }) => {
    const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' };

    const renderStar = (index) => {
        const filled = rating >= index + 1;
        const half = !filled && rating >= index + 0.5;

        if (interactive) {
            return (
                <button
                    key={index}
                    type="button"
                    onClick={() => onChange && onChange(index + 1)}
                    className={`${sizes[size]} text-yellow-400 hover:scale-110 transition-transform`}
                    aria-label={`Rate ${index + 1} stars`}
                >
                    {filled ? <FaStar /> : <FaRegStar />}
                </button>
            );
        }

        return (
            <span key={index} className={`${sizes[size]} text-yellow-400`}>
                {filled ? <FaStar /> : half ? <FaStarHalfAlt /> : <FaRegStar />}
            </span>
        );
    };

    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: maxStars }, (_, i) => renderStar(i))}
        </div>
    );
};

export default StarRating;
