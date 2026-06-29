import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { FaCalendarAlt, FaUserMd, FaCheckCircle, FaTimesCircle, FaSearch, FaStethoscope, FaRobot, FaPaperPlane } from 'react-icons/fa';
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

// ── Inline AI Symptom Checker widget ─────────────────────────────────────
const SymptomCheckerWidget = () => {
    const [input, setInput] = useState('');
    const [reply, setReply] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const QUICK = ['😷 Fever & Cold', '🤕 Headache', '💔 Chest Pain', '🦴 Joint Pain', '🧴 Skin Rash'];

    const ask = async (text) => {
        const trimmed = (text || input).trim();
        if (!trimmed || loading) return;
        setLoading(true);
        setError('');
        setReply('');
        try {
            const { data } = await api.post('/ai/symptom-check', {
                messages: [],
                userMessage: trimmed,
            });
            setReply(data.reply);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not reach AI. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FaRobot className="text-white text-lg" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">AI Symptom Checker</h2>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                        Powered by Gemini AI
                    </p>
                </div>
                <Link
                    to="/symptom-checker"
                    className="ml-auto text-xs text-blue-600 hover:underline font-medium"
                >
                    Full page →
                </Link>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-2 mb-3">
                {QUICK.map((s) => (
                    <button
                        key={s}
                        onClick={() => ask(s.replace(/^[^\w]+/, '').trim())}
                        disabled={loading}
                        className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Input row */}
            <div className="flex gap-2 items-center bg-gray-100 rounded-xl px-3 py-2 mb-3">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && ask()}
                    placeholder="Describe your symptoms..."
                    className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                    disabled={loading}
                />
                <button
                    onClick={() => ask()}
                    disabled={!input.trim() || loading}
                    className="w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg flex items-center justify-center transition-colors"
                    aria-label="Ask AI"
                >
                    <FaPaperPlane className="text-xs" />
                </button>
            </div>

            {/* Response */}
            {loading && (
                <div className="flex gap-1 items-center py-2 px-1">
                    {[0, 150, 300].map((d) => (
                        <span key={d} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                    <span className="text-xs text-gray-400 ml-2">Gemini is thinking...</span>
                </div>
            )}
            {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}
            {reply && !loading && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap">
                    {reply}
                    <div className="mt-3 pt-3 border-t border-blue-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400">⚠️ Not a medical diagnosis</p>
                        <Link
                            to="/doctors"
                            className="inline-flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FaUserMd className="text-xs" /> Find a Doctor
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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

                <Link
                    to="/symptom-checker"
                    className="card flex items-center gap-4 hover:shadow-md transition-shadow group"
                >
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <FaStethoscope className="text-purple-600 text-xl" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-purple-600">Symptom Checker</h3>
                        <p className="text-gray-500 text-sm">AI-powered health guidance</p>
                    </div>
                </Link>
            </div>

            {/* AI Symptom Checker Widget */}
            <div className="mb-8">
                <SymptomCheckerWidget />
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
