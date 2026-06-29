import React, { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { FaDollarSign, FaCheckCircle, FaStar, FaChartLine, FaFileExcel, FaCalendarAlt, FaTrophy } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
    <div className="card">
        <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
                <Icon className="text-white" />
            </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-gray-500 text-sm">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
);

const DoctorEarnings = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recentPayments, setRecentPayments] = useState([]);
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, apptRes] = await Promise.all([
                    api.get('/doctors/my/stats'),
                    api.get('/appointments/doctor-appointments', {
                        params: { status: 'completed', limit: 100 },
                    }),
                ]);
                setStats(statsRes.data.stats);
                setRecentPayments(apptRes.data.appointments);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const monthlyChartData = useMemo(() => {
        return (stats?.monthlyEarnings || []).map((m) => ({
            name: MONTH_NAMES[m._id.month - 1],
            month: m._id.month,
            year: m._id.year,
            earnings: m.earnings,
            appointments: m.count,
        }));
    }, [stats]);

    // Filtered payments
    const filteredPayments = useMemo(() => {
        return recentPayments.filter((appt) => {
            const d = new Date(appt.appointmentDate);
            const monthMatch = filterMonth === '' || d.getMonth() + 1 === Number(filterMonth);
            const yearMatch = filterYear === '' || d.getFullYear() === Number(filterYear);
            return monthMatch && yearMatch;
        });
    }, [recentPayments, filterMonth, filterYear]);

    // Summary calculations
    const now = new Date();
    const thisMonthData = monthlyChartData.find(
        (m) => m.name === MONTH_NAMES[now.getMonth()] && m.year === now.getFullYear()
    );

    const avgPerAppointment = useMemo(() => {
        if (!stats?.completed || stats.completed === 0) return 0;
        return Math.round((stats.totalEarnings || 0) / stats.completed);
    }, [stats]);

    const bestMonth = useMemo(() => {
        if (!monthlyChartData.length) return null;
        return monthlyChartData.reduce((best, m) => (m.earnings > (best?.earnings || 0) ? m : best), null);
    }, [monthlyChartData]);

    // Export to Excel
    const handleExportExcel = () => {
        const rows = filteredPayments.map((appt) => ({
            Patient: appt.patient?.name || 'N/A',
            Date: new Date(appt.appointmentDate).toLocaleDateString(),
            Time: appt.timeSlot?.startTime || '',
            Amount: appt.payment?.amount || 0,
            'Payment Status': appt.payment?.status || '',
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Earnings');
        XLSX.writeFile(wb, `earnings_${filterMonth ? MONTH_NAMES[filterMonth - 1] : 'all'}_${filterYear || now.getFullYear()}.xlsx`);
    };

    // Available years from data
    const availableYears = useMemo(() => {
        const years = new Set(recentPayments.map((a) => new Date(a.appointmentDate).getFullYear()));
        years.add(now.getFullYear());
        return Array.from(years).sort((a, b) => b - a);
    }, [recentPayments]);

    if (loading) return <div className="py-20"><Spinner size="lg" /></div>;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Earnings Report</h1>
                    <p className="text-gray-500 text-sm mt-1">Your financial performance overview</p>
                </div>
                <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                    <FaFileExcel /> Export to Excel
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={FaDollarSign}
                    label="Total Earnings"
                    value={`₹${(stats?.totalEarnings || 0).toLocaleString()}`}
                    color="bg-green-500"
                    sub="All time"
                />
                <StatCard
                    icon={FaChartLine}
                    label="This Month"
                    value={`₹${(thisMonthData?.earnings || 0).toLocaleString()}`}
                    color="bg-blue-500"
                    sub={`${thisMonthData?.appointments || 0} appointments`}
                />
                <StatCard
                    icon={FaCheckCircle}
                    label="Avg per Appointment"
                    value={`₹${avgPerAppointment.toLocaleString()}`}
                    color="bg-teal-500"
                    sub={`${stats?.completed || 0} completed`}
                />
                <StatCard
                    icon={FaTrophy}
                    label="Best Month"
                    value={bestMonth ? `₹${bestMonth.earnings.toLocaleString()}` : 'N/A'}
                    color="bg-yellow-500"
                    sub={bestMonth ? `${bestMonth.name} ${bestMonth.year}` : ''}
                />
            </div>

            {/* Earnings Trend Chart */}
            <div className="card mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Earnings Trend (Last 6 Months)</h2>
                {monthlyChartData.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-gray-400">
                        No earnings data yet. Complete appointments to see your earnings here.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={monthlyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
                            <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Earnings']} />
                            <Area type="monotone" dataKey="earnings" stroke="#16a34a" fill="url(#earningsGrad)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Monthly Appointments Bar */}
            {monthlyChartData.length > 0 && (
                <div className="card mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Appointments</h2>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={monthlyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="appointments" fill="#2563eb" radius={[4, 4, 0, 0]} name="Appointments" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Per-Patient Earnings Breakdown */}
            <div className="card">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">Per-Patient Earnings Breakdown</h2>
                    <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-gray-400" />
                        <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Months</option>
                            {MONTH_NAMES.map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Years</option>
                            {availableYears.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        {(filterMonth || filterYear) && (
                            <button
                                onClick={() => { setFilterMonth(''); setFilterYear(''); }}
                                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {filteredPayments.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4 text-center">No payments found for the selected period.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b border-gray-100">
                                    <th className="pb-3 font-medium">Patient</th>
                                    <th className="pb-3 font-medium">Date</th>
                                    <th className="pb-3 font-medium">Time</th>
                                    <th className="pb-3 font-medium">Amount</th>
                                    <th className="pb-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredPayments.map((appt) => (
                                    <tr key={appt._id} className="hover:bg-gray-50">
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={appt.patient?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.patient?.name || 'P')}&size=32`}
                                                    alt={appt.patient?.name}
                                                    className="w-7 h-7 rounded-full"
                                                />
                                                <span className="font-medium text-gray-800">{appt.patient?.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-gray-600">
                                            {new Date(appt.appointmentDate).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 text-gray-600">{appt.timeSlot?.startTime}</td>
                                        <td className="py-3 font-semibold text-green-600">₹{appt.payment?.amount}</td>
                                        <td className="py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${appt.payment?.status === 'paid'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {appt.payment?.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-gray-200">
                                    <td colSpan={3} className="py-3 font-semibold text-gray-700">
                                        Total ({filteredPayments.length} appointments)
                                    </td>
                                    <td className="py-3 font-bold text-green-700 text-base">
                                        ₹{filteredPayments.reduce((sum, a) => sum + (a.payment?.amount || 0), 0).toLocaleString()}
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorEarnings;
