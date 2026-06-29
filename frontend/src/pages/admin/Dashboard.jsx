import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import StatusBadge from '../../components/common/StatusBadge';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
    FaUsers, FaUserMd, FaCalendarAlt, FaDollarSign,
    FaClock, FaCheckCircle, FaSignInAlt, FaSignOutAlt,
    FaUserCheck, FaUserClock, FaClipboardList, FaTimes,
} from 'react-icons/fa';
import { format } from 'date-fns';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PIE_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#7c3aed'];

const ACTION_COLORS = {
    LOGIN: 'bg-green-100 text-green-700',
    LOGIN_2FA: 'bg-green-100 text-green-700',
    LOGIN_FAILED: 'bg-red-100 text-red-700',
    LOGOUT: 'bg-gray-100 text-gray-600',
    APPROVE_DOCTOR: 'bg-blue-100 text-blue-700',
    REJECT_DOCTOR: 'bg-red-100 text-red-700',
    VERIFY_DOCTOR: 'bg-purple-100 text-purple-700',
    ACTIVATE_USER: 'bg-green-100 text-green-700',
    DEACTIVATE_USER: 'bg-orange-100 text-orange-700',
    ENABLE_2FA: 'bg-indigo-100 text-indigo-700',
    DISABLE_2FA: 'bg-yellow-100 text-yellow-700',
};

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
        api.get('/admin/stats')
            .then(({ data }) => { setStats(data.stats); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="py-20"><Spinner size="lg" /></div>;

    const monthlyChartData = (stats?.monthlyStats || []).map((m) => ({
        name: MONTH_NAMES[m._id.month - 1],
        appointments: m.appointments,
        revenue: m.revenue,
    }));

    const statusData = [
        { name: 'Completed', value: stats?.completedAppointments || 0 },
        { name: 'Pending', value: stats?.pendingAppointments || 0 },
        { name: 'Cancelled', value: stats?.cancelledAppointments || 0 },
    ].filter((d) => d.value > 0);

    const doctorData = [
        { name: 'Approved', value: stats?.totalDoctors || 0 },
        { name: 'Pending', value: stats?.pendingDoctors || 0 },
    ].filter((d) => d.value > 0);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">Platform overview and analytics</p>
            </div>

            {/* ── Row 1: Main stats ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <StatCard icon={FaUsers} label="Total Users" value={stats?.totalUsers || 0} color="bg-blue-500" link="/admin/users" />
                <StatCard icon={FaUserMd} label="Active Doctors" value={stats?.totalDoctors || 0} color="bg-green-500" link="/admin/doctors" sub={`${stats?.totalDoctorsAll || 0} total registered`} />
                <StatCard icon={FaCalendarAlt} label="Total Appointments" value={stats?.totalAppointments || 0} color="bg-purple-500" link="/admin/appointments" />
                <StatCard icon={FaDollarSign} label="Total Revenue" value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`} color="bg-yellow-500" sub="From completed appointments" />
            </div>

            {/* ── Row 2: Secondary stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <StatCard icon={FaClock} label="Pending Appts" value={stats?.pendingAppointments || 0} color="bg-orange-400" link="/admin/appointments" />
                <StatCard icon={FaCheckCircle} label="Completed" value={stats?.completedAppointments || 0} color="bg-teal-500" link="/admin/appointments" />
                <StatCard icon={FaTimes} label="Cancelled" value={stats?.cancelledAppointments || 0} color="bg-red-400" link="/admin/appointments" />
                <StatCard icon={FaUserCheck} label="Approved Doctors" value={stats?.totalDoctors || 0} color="bg-green-600" link="/admin/doctors" />
                <StatCard icon={FaUserClock} label="Pending Doctors" value={stats?.pendingDoctors || 0} color="bg-amber-500" link="/admin/doctors" sub={stats?.pendingDoctors > 0 ? 'Needs review' : 'All clear'} />
                <StatCard icon={FaUsers} label="Total Patients" value={stats?.totalPatients || 0} color="bg-sky-500" link="/admin/users" />
            </div>

            {/* ── Pending Doctors Alert ── */}
            {stats?.pendingDoctors > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <p className="font-semibold text-yellow-800">
                                {stats.pendingDoctors} doctor{stats.pendingDoctors > 1 ? 's' : ''} awaiting approval
                            </p>
                            <p className="text-yellow-700 text-sm">Review and approve to allow them to receive appointments.</p>
                        </div>
                    </div>
                    <Link to="/admin/doctors" className="btn-primary text-sm whitespace-nowrap">Review Now</Link>
                </div>
            )}

            {/* ── Login / Logout Activity ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="card flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FaSignInAlt className="text-white text-xl" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalLogins || 0}</p>
                        <p className="text-gray-500 text-sm">Total Logins</p>
                        <p className="text-xs text-gray-400">All time successful logins</p>
                    </div>
                    <Link to="/admin/audit-logs" className="ml-auto text-xs text-blue-600 hover:underline whitespace-nowrap">View logs →</Link>
                </div>
                <div className="card flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FaSignOutAlt className="text-white text-xl" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalLogouts || 0}</p>
                        <p className="text-gray-500 text-sm">Total Logouts</p>
                        <p className="text-xs text-gray-400">All time logout events</p>
                    </div>
                    <Link to="/admin/audit-logs" className="ml-auto text-xs text-blue-600 hover:underline whitespace-nowrap">View logs →</Link>
                </div>
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
                                <Tooltip formatter={(value, name) => [
                                    name === 'revenue' ? `₹${value.toLocaleString()}` : value,
                                    name === 'revenue' ? 'Revenue' : 'Appointments',
                                ]} />
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
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                        {statusData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
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

            {/* ── Doctor Breakdown + Monthly Bar ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Doctor Status Pie */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Doctor Status</h2>
                    <p className="text-xs text-gray-400 mb-3">{stats?.totalDoctorsAll || 0} total registered</p>
                    {doctorData.length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No doctors yet</div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={140}>
                                <PieChart>
                                    <Pie data={doctorData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                                        <Cell fill="#16a34a" />
                                        <Cell fill="#f59e0b" />
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 mt-2">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-600" /><span className="text-gray-600">Approved</span></div>
                                    <span className="font-bold text-green-700">{stats?.totalDoctors || 0}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /><span className="text-gray-600">Pending</span></div>
                                    <span className="font-bold text-yellow-700">{stats?.pendingDoctors || 0}</span>
                                </div>
                            </div>
                            <Link to="/admin/doctors" className="mt-3 block text-center text-xs text-blue-600 hover:underline">Manage Doctors →</Link>
                        </>
                    )}
                </div>

                {/* Monthly Bar Chart */}
                <div className="lg:col-span-2 card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Appointments</h2>
                    {monthlyChartData.length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-gray-400">No data yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={monthlyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="appointments" fill="#2563eb" radius={[4, 4, 0, 0]} name="Appointments" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* ── Recent Audit Logs ── */}
            {stats?.recentAuditLogs?.length > 0 && (
                <div className="card mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <FaClipboardList className="text-blue-500" /> Recent Activity
                        </h2>
                        <Link to="/admin/audit-logs" className="text-blue-600 text-sm hover:underline">View all →</Link>
                    </div>
                    <div className="space-y-2">
                        {stats.recentAuditLogs.map((log, idx) => (
                            <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                                    {log.action.replace(/_/g, ' ')}
                                </span>
                                <span className="text-sm text-gray-700 font-medium truncate">{log.actorName}</span>
                                <span className="text-xs text-gray-400 capitalize">{log.actorRole}</span>
                                {log.details && <span className="text-xs text-gray-500 truncate flex-1">{log.details}</span>}
                                <span className="text-xs text-gray-400 whitespace-nowrap ml-auto">
                                    {format(new Date(log.createdAt), 'MMM d, HH:mm')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Recent Appointments ── */}
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
                                        <td className="py-3 font-medium text-gray-800">₹{appt.payment?.amount?.toLocaleString()}</td>
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
