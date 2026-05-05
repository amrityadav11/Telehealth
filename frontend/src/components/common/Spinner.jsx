import React from 'react';

const Spinner = ({ size = 'md', color = 'blue' }) => {
    const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
    return (
        <div className="flex justify-center items-center">
            <div
                className={`${sizes[size]} border-4 border-${color}-200 border-t-${color}-600 rounded-full animate-spin`}
                role="status"
                aria-label="Loading"
            />
        </div>
    );
};

export const PageSpinner = () => (
    <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
    </div>
);

export default Spinner;
