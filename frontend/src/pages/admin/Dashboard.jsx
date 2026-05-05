import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import StatusBadge from '../../components/common/StatusBadge';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { FaUsers, FaUserMd, FaCalendarAlt, FaDollarSign, FaClock, FaCheckCircle } from 'react-icons/fa';
import { format } from 'date-fns';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PIE_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#7c3aed'];

const StatCard = ({ icon: Icon, label, value, color, link, sub }) => (
    <Link to={link || '#'} className="card flex items-center gap-4 hover:shadow-md transition-shadow">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon className="text-white text-xl" />
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-gray-500 text-sm">{label}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
    </Link>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/stats').then(({ data }) => {
            setStats(data.stats);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="py-20"><Spinner size="lg" /></div>;

    // Format monthly data for charts
    const monthlyChartData = (stats?.monthlyStats || []).map((m) => ({
        name: MONTH_NAMES[m._id.month - 1],
        appointments: m.appointments,
        revenue: m.revenue,
    }));

    // Appointment status breakdown for pie chart
    const statusData = [
        { name: 'Completed', value: stats?.completedAppointments || 0 },
        { name: 'Pending', value: stats?.pendingAppointments || 0 },
        { name: 'Cancelled', value: (stats?.totalAppointments || 0) - (stats?.completedAppointments || 0) - (stats?.pendingAppointments || 0) },
    ].filter((d) => d.value > 0);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">Platform overview and analytics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={FaUsers} label="Total Users" value={stats?.totalUsers || 0} color="bg-blue-500" link="/admin/users" />
                <StatCard icon={FaUserMd} label="Active Doctors" value={stats?.totalDoctors || 0} color="bg-green-500" link="/admin/doctors" />
                <StatCard icon={FaCalendarAlt} label="Total Appointments" value={stats?.totalAppointments || 0} color="bg-purple-500" link="/admin/appointments" />
                <StatCard icon={FaDollarSign} label="Total Revenue" value={`$${(stats?.totalRevenue || 0).toLocaleString()}`} color="bg-yellow-500" sub="From completed appointments" />
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard icon={FaClock} label="Pending Appointments" value={stats?.pendingAppointments || 0} color="bg-orange-400" link="/admin/appointments" />
                <StatCard icon={FaCheckCircle} label="Completed" value={stats?.completedAppointments || 0} color="bg-teal-500" link="/admin/appointments" />
                <StatCard icon={FaUserMd} label="Pending Doctor Approvals" value={stats?.pendingDoctors || 0} color="bg-red-500" link="/admin/doctors" sub={stats?.pendingDoctors > 0 ? 'Needs review' : 'All clear'} />
            </div>

            {/* Pending Doctors Alert */}
            {stats?.pendingDoctors > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <p className="font-semibold text-yellow-800">
                                {stats.pendingDoctors} doctor{stats.pendingDoctors > 1 ? 's' : ''} awaiting approval
                            </p>
                            <p className="text-yellow-700 text-sm">Review and approve doctor profiles to allow them to receive appointments.</p>
                        </div>
                    </div>
                    <Link to="/admin/doctors" className="btn-primary text-sm whitespace-nowrap">Review Now</Link>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Revenue & Appointments Trend */}
                <div className="lg:col-span-2 card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Appointments (Last 6 Months)</h2>
                    {monthlyChartData.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-gray-400">No data yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={monthlyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorAppts" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value, name) => [
                                        name === 'revenue' ? `$${value.toLocaleString()}` : value,
                                        name === 'revenue' ? 'Revenue' : 'Appointments',
                                    ]}
                                />
                                <Legend />
                                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#colorRevenue)" strokeWidth={2} name="revenue" />
                                <Area yAxisId="right" type="monotone" dataKey="appointments" stroke="#16a34a" fill="url(#colorAppts)" strokeWidth={2} name="appointments" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Appointment Status Pie */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Appointment Status</h2>
                    {statusData.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-gray-400">No data yet</div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                        {statusData.map((_, idx) => (
                                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 mt-2">
                                {statusData.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                                            <span className="text-gray-600">{item.name}</span>
                                        </div>
                                        <span className="font-semibold text-gray-900">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Monthly Bar Chart */}
            {monthlyChartData.length > 0 && (
                <div className="card mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Appointments Breakdown</h2>
                    <ResponsiveContainer width="100%" height={200}>
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

            {/* Recent Appointments */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Appointments</h2>
                    <Link to="/admin/appointments" className="text-blue-600 text-sm hover:underline">View all</Link>
                </div>
                {!stats?.recentAppointments?.length ? (
                    <p className="text-gray-500 text-sm py-4">No appointments yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b border-gray-100">
                                    <th className="pb-3 font-medium">Patient</th>
                                    <th className="pb-3 font-medium">Doctor</th>
                                    <th className="pb-3 font-medium">Date</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats.recentAppointments.map((appt) => (
                                    <tr key={appt._id} className="hover:bg-gray-50">
                                        <td className="py-3 font-medium text-gray-800">{appt.patient?.name}</td>
                                        <td className="py-3 text-gray-600">{appt.doctor?.user?.name}</td>
                                        <td className="py-3 text-gray-500">{format(new Date(appt.appointmentDate), 'MMM d, yyyy')}</td>
                                        <td className="py-3"><StatusBadge status={appt.status} /></td>
                                        <td className="py-3 font-medium text-gray-800">${appt.payment?.amount}</td>
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

export default AdminDashboard;
