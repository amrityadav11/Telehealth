import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMe } from './store/slices/authSlice';
import { initSocket } from './services/socket';
import { addNotification, fetchNotifications } from './store/slices/notificationSlice';
import {
    receiveMessage,
    setUserOnline,
    setUserOffline,
    setTyping,
    clearTyping,
    fetchUnreadCount,
} from './store/slices/chatSlice';

// Layouts
import Navbar from './components/layout/Navbar';
import PrivateRoute from './components/layout/PrivateRoute';
import RoleRoute from './components/layout/RoleRoute';
import AdminLayout from './components/layout/AdminLayout';
import DoctorLayout from './components/layout/DoctorLayout';
import PatientLayout from './components/layout/PatientLayout';

// Public Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import DoctorList from './pages/doctors/DoctorList';
import DoctorProfile from './pages/doctors/DoctorProfile';

// Doctor Pages
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorProfileEdit from './pages/doctor/ProfileEdit';
import DoctorEarnings from './pages/doctor/Earnings';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminDoctors from './pages/admin/Doctors';
import AdminUsers from './pages/admin/Users';
import AdminAppointments from './pages/admin/Appointments';
import CreateAdmin from './pages/admin/CreateAdmin';
import AdminReviews from './pages/admin/Reviews';
import AdminProfile from './pages/admin/Profile';
import AuditLogs from './pages/admin/AuditLogs';

// Patient Pages
import PatientDashboard from './pages/patient/Dashboard';
import BookAppointment from './pages/patient/BookAppointment';
import PatientAppointments from './pages/patient/Appointments';
import PatientProfile from './pages/patient/Profile';
import MedicalHistory from './pages/patient/MedicalHistory';

// Consultation
import ConsultationRoom from './pages/consultation/ConsultationRoom';

// AI Symptom Checker
import SymptomChecker from './components/ai/SymptomChecker';
import AuthCallback from './pages/auth/AuthCallback';
import SymptomCheckerPage from './pages/ai/SymptomCheckerPage';
import TwoFactorVerify from './pages/auth/TwoFactorVerify';
import MedicalRecords from './pages/patient/MedicalRecords';
import HealthVitals from './pages/patient/HealthVitals';
import LabTests from './pages/patient/LabTests';
import FamilyProfiles from './pages/patient/FamilyProfiles';
import DoctorPayouts from './pages/doctor/Payouts';
import DoctorOnboarding from './pages/doctor/Onboarding';
import AdminAnalytics from './pages/admin/Analytics';
import AdminPayouts from './pages/admin/Payouts';
import OnboardingTour from './components/common/OnboardingTour';
import DoctorChat from './pages/doctor/Chat';
import PatientChat from './pages/patient/Chat';

// Smart redirect based on role
const RoleRedirect = () => {
    const { user } = useSelector((s) => s.auth);
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
    return <Navigate to="/patient/dashboard" replace />;
};

function App() {
    const dispatch = useDispatch();
    const { user, token } = useSelector((state) => state.auth);

    // Restore session on page load
    useEffect(() => {
        if (token) dispatch(getMe());
    }, [dispatch, token]);

    // Auto-fetch notifications when user is logged in
    useEffect(() => {
        if (token && user) {
            dispatch(fetchNotifications());
            // Refresh notifications every 5 minutes
            const interval = setInterval(() => dispatch(fetchNotifications()), 5 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [token, user, dispatch]);

    // Socket setup
    useEffect(() => {
        if (token && user) {
            try {
                const socket = initSocket(token);

                const handleNotification = (d, type = 'appointment') => {
                    dispatch(addNotification({ message: d.message, type, isRead: false, createdAt: new Date() }));
                    // Browser notification if permission granted
                    if (Notification.permission === 'granted') {
                        new Notification('TeleHealth', { body: d.message, icon: '/favicon.ico' });
                    }
                };

                socket.on('new_appointment', (d) => handleNotification(d));
                socket.on('appointment_update', (d) => handleNotification(d));
                socket.on('consultation_started', (d) => handleNotification(d));

                // ── Chat global events ──────────────────────────────────────
                socket.on('receive_chat_message', (msg) => {
                    dispatch(receiveMessage(msg));
                    // Play notification sound if message is from someone else
                    if (msg.senderId?.toString() !== user._id?.toString()) {
                        try {
                            const audio = new Audio('/notification.mp3');
                            audio.volume = 0.4;
                            audio.play().catch(() => {
                                // Web Audio API fallback beep
                                try {
                                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                                    const osc = ctx.createOscillator();
                                    const gain = ctx.createGain();
                                    osc.connect(gain);
                                    gain.connect(ctx.destination);
                                    osc.frequency.value = 880;
                                    osc.type = 'sine';
                                    gain.gain.setValueAtTime(0.3, ctx.currentTime);
                                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                                    osc.start(ctx.currentTime);
                                    osc.stop(ctx.currentTime + 0.3);
                                } catch (_) { }
                            });
                        } catch (_) { }
                    }
                });

                socket.on('user_online', ({ userId }) => dispatch(setUserOnline({ userId })));
                socket.on('user_offline', ({ userId }) => dispatch(setUserOffline({ userId })));

                socket.on('chat_user_typing', ({ appointmentId, userId: tid, name }) => {
                    if (tid !== user._id) dispatch(setTyping({ appointmentId, userId: tid, name }));
                });
                socket.on('chat_user_stop_typing', ({ appointmentId }) => {
                    dispatch(clearTyping({ appointmentId }));
                });

                // Fetch initial unread count
                dispatch(fetchUnreadCount());

                // Request browser notification permission
                if (Notification.permission === 'default') {
                    Notification.requestPermission();
                }
            } catch (e) {
                console.warn('Socket init failed:', e.message);
            }
        }
    }, [token, user, dispatch]);

    return (
        <Router>
            <Routes>
                {/* ── Public routes (with Navbar) ─────────────────────────────── */}
                <Route
                    element={
                        <div className="min-h-screen bg-gray-50">
                            <Navbar />
                            <div className="pt-0">
                                {/* Outlet rendered by child routes */}
                            </div>
                        </div>
                    }
                >
                    {/* We use a wrapper component approach instead */}
                </Route>

                {/* Public pages */}
                <Route path="/" element={<WithNavbar><Home /></WithNavbar>} />
                <Route path="/login" element={<WithNavbar><Login /></WithNavbar>} />
                <Route path="/register" element={<WithNavbar><Register /></WithNavbar>} />
                <Route path="/forgot-password" element={<WithNavbar><ForgotPassword /></WithNavbar>} />
                <Route path="/reset-password/:token" element={<WithNavbar><ResetPassword /></WithNavbar>} />
                <Route path="/doctors" element={<WithNavbar><DoctorList /></WithNavbar>} />
                <Route path="/doctors/:id" element={<WithNavbar><DoctorProfile /></WithNavbar>} />
                <Route path="/symptom-checker" element={<WithNavbar><SymptomCheckerPage /></WithNavbar>} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/verify-2fa" element={<TwoFactorVerify />} />

                {/* Smart redirect */}
                <Route path="/dashboard" element={<RoleRedirect />} />

                {/* ── Patient routes (with sidebar layout) ────────────────────── */}
                <Route element={<PrivateRoute />}>
                    <Route element={<RoleRoute allowedRoles={['patient']} />}>
                        <Route element={<PatientLayout />}>
                            <Route path="/patient/dashboard" element={<PatientDashboard />} />
                            <Route path="/patient/appointments" element={<PatientAppointments />} />
                            <Route path="/patient/profile" element={<PatientProfile />} />
                            <Route path="/patient/medical-history" element={<MedicalHistory />} />
                            <Route path="/patient/medical-records" element={<MedicalRecords />} />
                            <Route path="/patient/health-vitals" element={<HealthVitals />} />
                            <Route path="/patient/lab-tests" element={<LabTests />} />
                            <Route path="/patient/family" element={<FamilyProfiles />} />
                            <Route path="/patient/chat" element={<PatientChat />} />
                            <Route path="/patient/chat/:appointmentId" element={<PatientChat />} />
                        </Route>
                        {/* Book appointment uses navbar layout */}
                        <Route path="/patient/book/:doctorId" element={<WithNavbar><BookAppointment /></WithNavbar>} />
                    </Route>
                </Route>

                {/* ── Doctor routes (with sidebar layout) ─────────────────────── */}
                <Route element={<PrivateRoute />}>
                    <Route element={<RoleRoute allowedRoles={['doctor']} />}>
                        <Route element={<DoctorLayout />}>
                            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                            <Route path="/doctor/appointments" element={<DoctorAppointments />} />
                            <Route path="/doctor/earnings" element={<DoctorEarnings />} />
                            <Route path="/doctor/payouts" element={<DoctorPayouts />} />
                            <Route path="/doctor/profile" element={<DoctorProfileEdit />} />
                            <Route path="/doctor/chat" element={<DoctorChat />} />
                            <Route path="/doctor/chat/:appointmentId" element={<DoctorChat />} />
                        </Route>
                    </Route>
                </Route>

                {/* Doctor onboarding — outside layout, full page */}
                <Route element={<PrivateRoute />}>
                    <Route element={<RoleRoute allowedRoles={['doctor']} />}>
                        <Route path="/doctor/onboarding" element={<DoctorOnboarding />} />
                    </Route>
                </Route>

                {/* ── Admin routes (with dark sidebar layout) ──────────────────── */}
                <Route element={<PrivateRoute />}>
                    <Route element={<RoleRoute allowedRoles={['admin']} />}>
                        <Route element={<AdminLayout />}>
                            <Route path="/admin/dashboard" element={<AdminDashboard />} />
                            <Route path="/admin/doctors" element={<AdminDoctors />} />
                            <Route path="/admin/users" element={<AdminUsers />} />
                            <Route path="/admin/appointments" element={<AdminAppointments />} />
                            <Route path="/admin/reviews" element={<AdminReviews />} />
                            <Route path="/admin/create-admin" element={<CreateAdmin />} />
                            <Route path="/admin/profile" element={<AdminProfile />} />
                            <Route path="/admin/audit-logs" element={<AuditLogs />} />
                            <Route path="/admin/analytics" element={<AdminAnalytics />} />
                            <Route path="/admin/payouts" element={<AdminPayouts />} />
                        </Route>
                    </Route>
                </Route>

                {/* ── Consultation room ─────────────────────────────────────────── */}
                <Route element={<PrivateRoute />}>
                    <Route path="/consultation/:roomId" element={<ConsultationRoom />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* AI Symptom Checker — floating widget on all pages */}
            <SymptomChecker />
            {/* Onboarding Tour — shown once to new users */}
            <OnboardingTour />
        </Router>
    );
}

// Simple wrapper that adds the Navbar
const WithNavbar = ({ children }) => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        {children}
    </div>
);

export default App;
