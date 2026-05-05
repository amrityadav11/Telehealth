import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { FaCalendarAlt, FaUserMd, FaCheckCircle, FaTimesCircle, FaSearch } from 'react-icons/fa';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/common/Spinner';
import { format } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="card flex items-center gap-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon className="text-white text-xl" />
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-gray-500 text-sm">{label}</p>
        </div>
    </div>
);

const PatientDashboard = () => {
    const { user } = useSelector((s) => s.auth);
    const [stats, setStats] = useState(null);
    const [recentAppointments, setRecentAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, apptRes] = await Promise.all([
                    api.get('/patients/stats'),
                    api.get('/appointments/my-appointments', { params: { limit: 5 } }),
                ]);
                setStats(statsRes.data.stats);
                setRecentAppointments(apptRes.data.appointments);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="py-20"><Spinner size="lg" /></div>;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-gray-600 mt-1">Manage your health appointments and consultations.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={FaCalendarAlt} label="Total Appointments" value={stats?.total || 0} color="bg-blue-500" />
                <StatCard icon={FaUserMd} label="Pending" value={stats?.pending || 0} color="bg-yellow-500" />
                <StatCard icon={FaCheckCircle} label="Completed" value={stats?.completed || 0} color="bg-green-500" />
                <StatCard icon={FaTimesCircle} label="Cancelled" value={stats?.cancelled || 0} color="bg-red-500" />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <Link
                    to="/doctors"
                    className="card flex items-center gap-4 hover:shadow-md transition-shadow group"
                >
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FaSearch className="text-blue-600 text-xl" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">Find a Doctor</h3>
                        <p className="text-gray-500 text-sm">Browse 500+ verified specialists</p>
                    </div>
                </Link>

                <Link
                    to="/patient/appointments"
                    className="card flex items-center gap-4 hover:shadow-md transition-shadow group"
                >
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <FaCalendarAlt className="text-green-600 text-xl" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-green-600">My Appointments</h3>
                        <p className="text-gray-500 text-sm">View and manage your bookings</p>
                    </div>
                </Link>
            </div>

            {/* Recent Appointments */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Appointments</h2>
                    <Link to="/patient/appointments" className="text-blue-600 text-sm hover:underline">
                        View all
                    </Link>
                </div>

                {recentAppointments.length === 0 ? (
                    <div className="text-center py-8">
                        <FaCalendarAlt className="text-gray-300 text-4xl mx-auto mb-3" />
                        <p className="text-gray-500">No appointments yet.</p>
                        <Link to="/doctors" className="btn-primary mt-4 inline-block">Book Your First Appointment</Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentAppointments.map((appt) => (
                            <div key={appt._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={appt.doctor?.user?.avatar?.url || `https://ui-avatars.com/api/?name=Dr&background=2563eb&color=fff&size=40`}
                                        alt="Doctor"
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-800 text-sm">{appt.doctor?.user?.name}</p>
                                        <p className="text-gray-500 text-xs">
                                            {format(new Date(appt.appointmentDate), 'MMM d, yyyy')} at {appt.timeSlot?.startTime}
                                        </p>
                                    </div>
                                </div>
                                <StatusBadge status={appt.status} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientDashboard;
