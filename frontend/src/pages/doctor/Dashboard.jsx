import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { FaCalendarAlt, FaCheckCircle, FaClock, FaDollarSign, FaStar, FaUsers } from 'react-icons/fa';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/common/Spinner';
import { format } from 'date-fns';

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

const DoctorDashboard = () => {
    const { user } = useSelector((s) => s.auth);
    const [stats, setStats] = useState(null);
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const today = format(new Date(), 'yyyy-MM-dd');
                const [statsRes, apptRes, profileRes] = await Promise.all([
                    api.get('/doctors/my/stats'),
                    api.get('/appointments/doctor-appointments', { params: { date: today, limit: 10 } }),
                    api.get('/doctors/my/profile'),
                ]);
                setStats(statsRes.data.stats);
                setTodayAppointments(apptRes.data.appointments);
                setProfile(profileRes.data.doctor);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="py-20"><Spinner size="lg" /></div>;

    const isApproved = profile?.isApproved;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Approval Banner */}
            {!isApproved && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <FaClock className="text-yellow-500 text-xl flex-shrink-0" />
                    <div>
                        <p className="font-medium text-yellow-800">Profile Pending Approval</p>
                        <p className="text-yellow-700 text-sm">Your profile is under review. You'll be notified once approved.</p>
                    </div>
                    <Link to="/doctor/profile" className="ml-auto btn-primary text-sm whitespace-nowrap">
                        Complete Profile
                    </Link>
                </div>
            )}

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, Dr. {user?.name?.split(' ').slice(-1)[0]}! 👨‍⚕️
                </h1>
                <p className="text-gray-600 mt-1">Here's your practice overview.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={FaCalendarAlt} label="Total Appointments" value={stats?.total || 0} color="bg-blue-500" />
                <StatCard icon={FaClock} label="Pending" value={stats?.pending || 0} color="bg-yellow-500" />
                <StatCard icon={FaCheckCircle} label="Completed" value={stats?.completed || 0} color="bg-green-500" />
                <StatCard icon={FaDollarSign} label="Total Earnings" value={`$${stats?.totalEarnings || 0}`} color="bg-purple-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Appointments */}
                <div className="lg:col-span-2 card">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Today's Appointments</h2>
                        <Link to="/doctor/appointments" className="text-blue-600 text-sm hover:underline">View all</Link>
                    </div>

                    {todayAppointments.length === 0 ? (
                        <div className="text-center py-8">
                            <FaCalendarAlt className="text-gray-300 text-4xl mx-auto mb-3" />
                            <p className="text-gray-500">No appointments today.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {todayAppointments.map((appt) => (
                                <div key={appt._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={appt.patient?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.patient?.name || 'P')}&size=40`}
                                            alt={appt.patient?.name}
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-800 text-sm">{appt.patient?.name}</p>
                                            <p className="text-gray-500 text-xs">{appt.timeSlot?.startTime} – {appt.timeSlot?.endTime}</p>
                                        </div>
                                    </div>
                                    <StatusBadge status={appt.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Profile Summary */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Summary</h2>
                    <div className="text-center mb-4">
                        <img
                            src={user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'D')}&background=2563eb&color=fff&size=80`}
                            alt={user?.name}
                            className="w-16 h-16 rounded-full mx-auto mb-2"
                        />
                        <p className="font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-blue-600 text-sm">{profile?.specialization}</p>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Rating</span>
                            <span className="font-medium flex items-center gap-1">
                                <FaStar className="text-yellow-400" /> {stats?.rating || 0} ({stats?.numReviews || 0})
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Consultation Fee</span>
                            <span className="font-medium">${profile?.consultationFee}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Experience</span>
                            <span className="font-medium">{profile?.experience} years</span>
                        </div>
                    </div>

                    <Link to="/doctor/profile" className="btn-secondary w-full mt-4 text-center block text-sm">
                        Edit Profile
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
