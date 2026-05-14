import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer,
} from 'recharts';
import {
    FaChartLine, FaRupeeSign, FaUserMd, FaUsers,
    FaStar, FaCalendarAlt, FaArrowUp, FaArrowDown,
} from 'react-icons/fa';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const StatCard = ({ icon: Icon, label, value, sub, color, trend }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
                <Icon className="text-white text-lg" />
            </div>
            {trend !== undefined && (
                <span className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {trend >= 0 ? <FaArrowUp /> : <FaArrowDown />} {Math.abs(trend)}%
                </span>
            )}
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
);

const AdminAnalytics = () => {
    const [revenue, setRevenue] = useState(null);
    const [heatmap, setHeatmap] = useState(null);
    const [doctors, setDoctors] = useState(null);
    const [patients, setPatients] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('revenue');
    const [months, setMonths] = useState(12);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [revRes, heatRes, docRes, patRes] = await Promise.all([
                api.get('/admin/analytics/revenue', { params: { months } }),
                api.get('/admin/analytics/heatmap'),
                api.get('/admin/analytics/doctors'),
                api.get('/admin/analytics/patients', { params: { months } }),
            ]);
            setRevenue(revRes.data.analytics);
            setHeatmap(heatRes.data);
            setDoctors(docRes.data.performance);
            setPatients(patRes.data.analytics);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [months]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const monthlyRevenueData = (revenue?.monthlyRevenue || []).map((m) => ({
        name: MONTH_NAMES[m._id.month - 1],
        revenue: m.revenue,
        appointments: m.appointments,
    }));

    const newPatientsData = (patients?.newPatients || []).map((m) => ({
        name: MONTH_NAMES[m._id.month - 1],
        patients: m.count,
    }));

    // Build heatmap grid: 7 days x 24 hours
    const heatmapGrid = () => {
        if (!heatmap?.heatmap) return [];
        const grid = {};
        heatmap.heatmap.forEach((h) => {
            const key = `${h._id.dayOfWeek}-${h._id.hour}`;
            grid[key] = h.count;
        });
        const maxCount = Math.max(...Object.values(grid), 1);
        return { grid, maxCount };
    };
    const { grid: heatGrid, maxCount } = heatmapGrid();

    const getHeatColor = (count) => {
        if (!count) return 'bg-gray-100 dark:bg-gray-700';
        const intensity = count / maxCount;
        if (intensity > 0.75) return 'bg-blue-600';
        if (intensity > 0.5) return 'bg-blue-400';
        if (intensity > 0.25) return 'bg-blue-200';
        return 'bg-blue-100';
    };

    if (loading) return <div className="py-20"><Spinner size="lg" /></div>;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaChartLine className="text-blue-500" /> Advanced Analytics
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Platform-wide performance insights</p>
                </div>
                <select
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                    <option value={3}>Last 3 months</option>
                    <option value={6}>Last 6 months</option>
                    <option value={12}>Last 12 months</option>
                </select>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard icon={FaRupeeSign} label="Total Revenue" value={`₹${(revenue?.totalRevenue || 0).toLocaleString()}`} color="bg-green-500" sub={`${revenue?.totalAppointments || 0} appointments`} />
                <StatCard icon={FaRupeeSign} label="Net Revenue" value={`₹${(revenue?.netRevenue || 0).toLocaleString()}`} color="bg-emerald-600" sub={`After ₹${(revenue?.totalPayouts || 0).toLocaleString()} payouts`} />
                <StatCard icon={FaUsers} label="Total Patients" value={(patients?.totalPatients || 0).toLocaleString()} color="bg-blue-500" sub={`${patients?.returningPatients || 0} returning`} />
                <StatCard icon={FaUserMd} label="Active Doctors" value={(patients?.totalDoctors || 0).toLocaleString()} color="bg-purple-500" />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl w-fit overflow-x-auto">
                {['revenue', 'heatmap', 'doctors', 'patients'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                    >
                        {tab === 'heatmap' ? 'Appointment Heatmap' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Revenue Tab */}
            {activeTab === 'revenue' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Revenue & Appointments</h2>
                        {monthlyRevenueData.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data available</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={monthlyRevenueData}>
                                    <defs>
                                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(v, name) => [name === 'revenue' ? `₹${v.toLocaleString()}` : v, name === 'revenue' ? 'Revenue' : 'Appointments']} />
                                    <Legend />
                                    <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2} name="revenue" />
                                    <Bar yAxisId="right" dataKey="appointments" fill="#3b82f6" radius={[3, 3, 0, 0]} name="appointments" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Revenue by method */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Revenue by Payment Method</h2>
                            {(revenue?.revenueByMethod || []).length === 0 ? (
                                <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No data</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie data={revenue.revenueByMethod} dataKey="revenue" nameKey="_id" cx="50%" cy="50%" outerRadius={70} label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}>
                                            {revenue.revenueByMethod.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Revenue by appointment type */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Revenue by Appointment Type</h2>
                            {(revenue?.revenueByType || []).length === 0 ? (
                                <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No data</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={revenue.revenueByType}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                                        <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                                        <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Heatmap Tab */}
            {activeTab === 'heatmap' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                        <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Appointment Booking Heatmap</h2>
                        <p className="text-xs text-gray-400 mb-4">Darker = more appointments booked at that time</p>
                        <div className="overflow-x-auto">
                            <div className="min-w-[600px]">
                                {/* Hour labels */}
                                <div className="flex mb-1 ml-10">
                                    {Array.from({ length: 24 }, (_, h) => (
                                        <div key={h} className="flex-1 text-center text-xs text-gray-400">{h}</div>
                                    ))}
                                </div>
                                {/* Grid */}
                                {DAY_NAMES.map((day, dayIdx) => (
                                    <div key={day} className="flex items-center mb-1">
                                        <div className="w-10 text-xs text-gray-500 dark:text-gray-400 text-right pr-2">{day}</div>
                                        {Array.from({ length: 24 }, (_, h) => {
                                            const count = heatGrid?.[`${dayIdx + 1}-${h}`] || 0;
                                            return (
                                                <div
                                                    key={h}
                                                    className={`flex-1 h-6 mx-0.5 rounded-sm ${getHeatColor(count)} transition-colors`}
                                                    title={`${day} ${h}:00 — ${count} appointments`}
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="flex items-center gap-2 mt-3">
                            <span className="text-xs text-gray-400">Less</span>
                            {['bg-gray-100', 'bg-blue-100', 'bg-blue-200', 'bg-blue-400', 'bg-blue-600'].map((c, i) => (
                                <div key={i} className={`w-5 h-5 rounded-sm ${c}`} />
                            ))}
                            <span className="text-xs text-gray-400">More</span>
                        </div>
                    </div>

                    {/* Status Distribution */}
                    {heatmap?.statusDistribution?.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Appointment Status Distribution</h2>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={heatmap.statusDistribution} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}>
                                        {heatmap.statusDistribution.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

            {/* Doctors Tab */}
            {activeTab === 'doctors' && (
                <div className="space-y-6">
                    {/* Top by Revenue */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Top Doctors by Revenue</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                        <th className="px-5 py-3 font-medium">#</th>
                                        <th className="px-5 py-3 font-medium">Doctor</th>
                                        <th className="px-5 py-3 font-medium">Specialty</th>
                                        <th className="px-5 py-3 font-medium">Appointments</th>
                                        <th className="px-5 py-3 font-medium">Revenue</th>
                                        <th className="px-5 py-3 font-medium">Avg Fee</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {(doctors?.topByRevenue || []).map((d, i) => (
                                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-5 py-3 text-gray-400 font-medium">{i + 1}</td>
                                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{d.doctorName}</td>
                                            <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{d.specialization}</td>
                                            <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{d.totalAppointments}</td>
                                            <td className="px-5 py-3 font-semibold text-green-600">₹{d.totalRevenue?.toLocaleString()}</td>
                                            <td className="px-5 py-3 text-gray-500 dark:text-gray-400">₹{Math.round(d.avgFee)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Top by Rating */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Top Rated Doctors</h2>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-gray-700">
                            {(doctors?.topByRating || []).map((d, i) => (
                                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-400 font-medium w-5">{i + 1}</span>
                                        <img
                                            src={d.user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.user?.name || 'D')}&size=36`}
                                            alt={d.user?.name}
                                            className="w-9 h-9 rounded-full"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white text-sm">{d.user?.name}</p>
                                            <p className="text-xs text-gray-400">{d.specialization}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1 text-yellow-500">
                                            <FaStar className="text-xs" />
                                            <span className="font-semibold">{d.rating?.toFixed(1)}</span>
                                            <span className="text-gray-400 text-xs">({d.numReviews})</span>
                                        </div>
                                        <span className="text-gray-500 dark:text-gray-400">{d.totalAppointments} appts</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Patients Tab */}
            {activeTab === 'patients' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">New Patient Registrations</h2>
                        {newPatientsData.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={newPatientsData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="patients" fill="#3b82f6" radius={[4, 4, 0, 0]} name="New Patients" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Specialty Demand */}
                    {(patients?.specialtyDemand || []).length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="font-semibold text-gray-900 dark:text-white">Specialty Demand</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                            <th className="px-5 py-3 font-medium">Specialty</th>
                                            <th className="px-5 py-3 font-medium">Appointments</th>
                                            <th className="px-5 py-3 font-medium">Revenue</th>
                                            <th className="px-5 py-3 font-medium">Demand</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                        {patients.specialtyDemand.map((s, i) => {
                                            const maxAppts = patients.specialtyDemand[0]?.appointments || 1;
                                            const pct = Math.round((s.appointments / maxAppts) * 100);
                                            return (
                                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{s._id}</td>
                                                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{s.appointments}</td>
                                                    <td className="px-5 py-3 text-green-600 font-medium">₹{s.revenue?.toLocaleString()}</td>
                                                    <td className="px-5 py-3 w-40">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                                                            </div>
                                                            <span className="text-xs text-gray-400">{pct}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminAnalytics;
