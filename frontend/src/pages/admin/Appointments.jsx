import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import { format } from 'date-fns';

const AdminAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: '', page: 1 });
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(0);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const params = { page: filter.page };
            if (filter.status) params.status = filter.status;
            const { data } = await api.get('/admin/appointments', { params });
            setAppointments(data.appointments);
            setTotal(data.total);
            setPages(data.pages);
        } catch (err) {
            toast.error('Failed to fetch appointments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAppointments(); }, [filter]);

    const statuses = ['', 'pending', 'confirmed', 'completed', 'cancelled'];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">All Appointments</h1>
                <span className="text-gray-500 text-sm">{total} total</span>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {statuses.map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter((f) => ({ ...f, status: s, page: 1 }))}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter.status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="py-20"><Spinner size="lg" /></div>
            ) : (
                <div className="card overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Patient</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Doctor</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {appointments.map((appt) => (
                                    <tr key={appt._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-xs text-gray-500 font-mono">{appt.appointmentId}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-900">{appt.patient?.name}</p>
                                            <p className="text-xs text-gray-500">{appt.patient?.email}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-900">{appt.doctor?.user?.name}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-800">{format(new Date(appt.appointmentDate), 'MMM d, yyyy')}</p>
                                            <p className="text-xs text-gray-500">{appt.timeSlot?.startTime}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">${appt.payment?.amount}</td>
                                        <td className="px-6 py-4"><StatusBadge status={appt.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Pagination
                currentPage={filter.page}
                totalPages={pages}
                onPageChange={(page) => setFilter((f) => ({ ...f, page }))}
            />
        </div>
    );
};

export default AdminAppointments;
