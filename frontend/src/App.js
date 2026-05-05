import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMe } from './store/slices/authSlice';
import { initSocket } from './services/socket';
import { addNotification } from './store/slices/notificationSlice';

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

// Patient Pages
import PatientDashboard from './pages/patient/Dashboard';
import BookAppointment from './pages/patient/BookAppointment';
import PatientAppointments from './pages/patient/Appointments';
import PatientProfile from './pages/patient/Profile';
import MedicalHistory from './pages/patient/MedicalHistory';

// Consultation
import ConsultationRoom from './pages/consultation/ConsultationRoom';

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

    // Socket setup
    useEffect(() => {
        if (token && user) {
            try {
                const socket = initSocket(token);

                const handleNotification = (d, type = 'appointment') => {
                    dispatch(addNotification({ message: d.message, type, isRead: false, createdAt: new Date() }));
                    // Browser notification if permission granted
                    if (Notification.permission === 'granted') {
                        new Notification('TeleMed', { body: d.message, icon: '/favicon.ico' });
                    }
                };

                socket.on('new_appointment', (d) => handleNotification(d));
                socket.on('appointment_update', (d) => handleNotification(d));
                socket.on('consultation_started', (d) => handleNotification(d));

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
                            <Route path="/doctor/profile" element={<DoctorProfileEdit />} />
                        </Route>
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
        </Router>
    );
}

// Simple wrapper that adds the Navbar
const WithNavbar = ({ children }) => (
    <div className="min-h-screen bg-gray-50">
        <Navbar />
        {children}
    </div>
);

export default App;
