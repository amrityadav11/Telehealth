import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
    FaTachometerAlt, FaCalendarAlt, FaSearch,
    FaUserCircle, FaSignOutAlt, FaBars, FaFileMedical, FaFolderOpen,
    FaHeartbeat, FaFlask, FaUsers, FaComments, FaLeaf,
} from 'react-icons/fa';

const PatientLayout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);
    const { totalUnread } = useSelector((s) => s.chat);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navItems = [
        { to: '/patient/dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
        { to: '/patient/health-hub', icon: FaLeaf, label: 'Health Hub' },
        { to: '/doctors', icon: FaSearch, label: 'Find Doctors' },
        { to: '/patient/appointments', icon: FaCalendarAlt, label: 'My Appointments' },
        { to: '/patient/chat', icon: FaComments, label: 'Chat with Doctor', badge: totalUnread },
        { to: '/patient/medical-history', icon: FaFileMedical, label: 'Medical History' },
        { to: '/patient/medical-records', icon: FaFolderOpen, label: 'Medical Records' },
        { to: '/patient/health-vitals', icon: FaHeartbeat, label: 'Health Vitals' },
        { to: '/patient/lab-tests', icon: FaFlask, label: 'Lab Tests' },
        { to: '/patient/family', icon: FaUsers, label: 'Family Profiles' },
        { to: '/patient/profile', icon: FaUserCircle, label: 'My Profile' },
    ];

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const Sidebar = () => (
        <aside className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-60">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">TM</span>
                </div>
                <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">TeleHealth</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Patient Portal</p>
                </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map(({ to, icon: Icon, label, badge }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                            }`
                        }
                    >
                        <Icon className="text-base flex-shrink-0" />
                        <span className="flex-1">{label}</span>
                        {badge > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                {badge > 99 ? '99+' : badge}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                    <img
                        src={user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'P')}&background=2563eb&color=fff&size=36`}
                        alt={user?.name}
                        className="w-9 h-9 rounded-full"
                    />
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Patient</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    <FaSignOutAlt />
                    Sign Out
                </button>
            </div>
        </aside>
    );

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
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
                <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 dark:text-gray-300">
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
