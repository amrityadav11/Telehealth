import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import { format } from 'date-fns';
import { FaDownload, FaFileExcel } from 'react-icons/fa';
import { downloadReceiptPDF } from '../../utils/receiptPDF';
import * as XLSX from 'xlsx';

const AdminAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: '', page: 1 });
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(0);
    const [exporting, setExporting] = useState(false);

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

    const handleExportAppointments = async () => {
        setExporting(true);
        try {
            const { data } = await api.get('/admin/appointments', { params: { limit: 10000 } });
            const rows = [
                ['Appointment ID', 'Patient', 'Patient Email', 'Doctor', 'Date', 'Time', 'Type', 'Status', 'Payment Status', 'Amount', 'Transaction ID'],
                ...data.appointments.map((a) => [
                    a.appointmentId || '—',
                    a.patient?.name || '—',
                    a.patient?.email || '—',
                    a.doctor?.user?.name || '—',
                    a.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString('en-IN') : '—',
                    a.timeSlot?.startTime || '—',
                    a.type || '—',
                    a.status || '—',
                    a.payment?.status || '—',
                    a.payment?.amount || 0,
                    a.payment?.transactionId || '—',
                ]),
            ];
            const ws = XLSX.utils.aoa_to_sheet(rows);
            ws['!cols'] = rows[0].map((h) => ({ wch: Math.max(h.length + 4, 14) }));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Appointments');
            XLSX.writeFile(wb, `telehealth-appointments-${new Date().toISOString().slice(0, 10)}.xlsx`);
            toast.success('Appointments exported to Excel');
        } catch (err) {
            toast.error('Export failed');
        } finally {
            setExporting(false);
        }
    };

    const statuses = ['', 'pending', 'confirmed', 'completed', 'cancelled'];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">All Appointments</h1>
                    <span className="text-gray-500 text-sm">{total} total</span>
                </div>
                <button
                    onClick={handleExportAppointments}
                    disabled={exporting}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-60"
                >
                    <FaFileExcel /> {exporting ? 'Exporting...' : 'Export Excel'}
                </button>
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
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Payment</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Receipt</th>
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
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{appt.payment?.amount}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${appt.payment?.status === 'paid'
                                                    ? 'bg-green-100 text-green-700'
                                                    : appt.payment?.status === 'refunded'
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {appt.payment?.status || 'pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4"><StatusBadge status={appt.status} /></td>
                                        <td className="px-6 py-4">
                                            {appt.payment?.status === 'paid' && (
                                                <button
                                                    onClick={() => downloadReceiptPDF(appt)}
                                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 hover:border-blue-400 px-2 py-1 rounded-lg transition-colors"
                                                    title="Download Receipt"
                                                >
                                                    <FaDownload /> PDF
                                                </button>
                                            )}
                                        </td>
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
