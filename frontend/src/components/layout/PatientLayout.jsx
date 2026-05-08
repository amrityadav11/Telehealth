import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
    FaTachometerAlt, FaCalendarAlt, FaSearch,
    FaUserCircle, FaSignOutAlt, FaBars, FaFileMedical,
} from 'react-icons/fa';

const navItems = [
    { to: '/patient/dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
    { to: '/doctors', icon: FaSearch, label: 'Find Doctors' },
    { to: '/patient/appointments', icon: FaCalendarAlt, label: 'My Appointments' },
    { to: '/patient/medical-history', icon: FaFileMedical, label: 'Medical History' },
    { to: '/patient/profile', icon: FaUserCircle, label: 'My Profile' },
];

const PatientLayout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const Sidebar = () => (
        <aside className="flex flex-col h-full bg-white border-r border-gray-200 w-60">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">TM</span>
                </div>
                <div>
                    <p className="font-bold text-gray-900 text-sm">TeleHealth</p>
                    <p className="text-xs text-gray-500">Patient Portal</p>
                </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        <Icon className="text-base flex-shrink-0" />
                        {label}
                    </NavLink>
                ))}
            </nav>

            <div className="px-4 py-4 border-t border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                    <img
                        src={user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'P')}&background=2563eb&color=fff&size=36`}
                        alt={user?.name}
                        className="w-9 h-9 rounded-full"
                    />
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500">Patient</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <FaSignOutAlt />
                    Sign Out
                </button>
            </div>
        </aside>
    );

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <div className="hidden md:flex flex-shrink-0">
                <Sidebar />
            </div>

            {sidebarOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <div className="relative z-10">
                        <Sidebar />
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600">
                        <FaBars className="text-xl" />
                    </button>
                    <span className="font-bold text-blue-600">Patient Portal</span>
                    <button onClick={handleLogout} className="text-red-500 text-sm font-medium">Logout</button>
                </div>
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default PatientLayout;
