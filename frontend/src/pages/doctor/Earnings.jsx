import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { FaDollarSign, FaCheckCircle, FaStar, FaChartLine } from 'react-icons/fa';

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, apptRes] = await Promise.all([
                    api.get('/doctors/my/stats'),
                    api.get('/appointments/doctor-appointments', {
                        params: { status: 'completed', limit: 10 },
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

    if (loading) return <div className="py-20"><Spinner size="lg" /></div>;

    const monthlyChartData = (stats?.monthlyEarnings || []).map((m) => ({
        name: MONTH_NAMES[m._id.month - 1],
        earnings: m.earnings,
        appointments: m.count,
    }));

    // Calculate this month's earnings
    const now = new Date();
    const thisMonthData = monthlyChartData.find(
        (m) => m.name === MONTH_NAMES[now.getMonth()]
    );

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Earnings Report</h1>
                <p className="text-gray-500 text-sm mt-1">Your financial performance overview</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={FaDollarSign}
                    label="Total Earnings"
                    value={`$${(stats?.totalEarnings || 0).toLocaleString()}`}
                    color="bg-green-500"
                    sub="All time"
                />
                <StatCard
                    icon={FaChartLine}
                    label="This Month"
                    value={`$${(thisMonthData?.earnings || 0).toLocaleString()}`}
                    color="bg-blue-500"
                    sub={`${thisMonthData?.appointments || 0} appointments`}
                />
                <StatCard
                    icon={FaCheckCircle}
                    label="Completed"
                    value={stats?.completed || 0}
                    color="bg-teal-500"
                    sub="Appointments"
                />
                <StatCard
                    icon={FaStar}
                    label="Rating"
                    value={stats?.rating ? stats.rating.toFixed(1) : 'N/A'}
                    color="bg-yellow-500"
                    sub={`${stats?.numReviews || 0} reviews`}
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
                            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                            <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Earnings']} />
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

            {/* Recent Payments */}
            <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h2>
                {recentPayments.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4">No completed appointments yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b border-gray-100">
                                    <th className="pb-3 font-medium">Patient</th>
                                    <th className="pb-3 font-medium">Date</th>
                                    <th className="pb-3 font-medium">Time</th>
                                    <th className="pb-3 font-medium">Amount</th>
                                    <th className="pb-3 font-medium">Payment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentPayments.map((appt) => (
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
                                        <td className="py-3 font-semibold text-green-600">${appt.payment?.amount}</td>
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
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorEarnings;
