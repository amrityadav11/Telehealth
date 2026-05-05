import React from 'react';

const statusConfig = {
    pending: { label: 'Pending', className: 'badge-pending' },
    confirmed: { label: 'Confirmed', className: 'badge-confirmed' },
    completed: { label: 'Completed', className: 'badge-completed' },
    cancelled: { label: 'Cancelled', className: 'badge-cancelled' },
    'no-show': { label: 'No Show', className: 'bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full' },
    paid: { label: 'Paid', className: 'badge-completed' },
    refunded: { label: 'Refunded', className: 'bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full' },
};

const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full' };
    return <span className={config.className}>{config.label}</span>;
};

export default StatusBadge;
