import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
    FaTachometerAlt, FaUserMd, FaUsers, FaCalendarAlt,
    FaSignOutAlt, FaBars, FaTimes, FaUserShield, FaStar,
} from 'react-icons/fa';

const navItems = [
    { to: '/admin/dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
    { to: '/admin/doctors', icon: FaUserMd, label: 'Doctors' },
    { to: '/admin/users', icon: FaUsers, label: 'Users' },
    { to: '/admin/appointments', icon: FaCalendarAlt, label: 'Appointments' },
    { to: '/admin/reviews', icon: FaStar, label: 'Reviews' },
    { to: '/admin/create-admin', icon: FaUserShield, label: 'Create Admin' },
];

const AdminLayout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const Sidebar = () => (
        <aside className="flex flex-col h-full bg-gray-900 text-white w-64">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                    <FaUserShield className="text-white text-lg" />
                </div>
                <div>
                    <p className="font-bold text-white">TeleMed</p>
                    <p className="text-xs text-gray-400">Admin Panel</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }`
                        }
                    >
                        <Icon className="text-base flex-shrink-0" />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* User + Logout */}
            <div className="px-4 py-4 border-t border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                    <img
                        src={user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'A')}&background=2563eb&color=fff&size=36`}
                        alt={user?.name}
                        className="w-9 h-9 rounded-full"
                    />
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                        <p className="text-xs text-gray-400">Administrator</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 rounded-lg transition-colors"
                >
                    <FaSignOutAlt />
                    Sign Out
                </button>
            </div>
        </aside>
    );

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Desktop sidebar */}
            <div className="hidden md:flex flex-shrink-0">
                <Sidebar />
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <div className="relative z-10">
                        <Sidebar />
                    </div>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile top bar */}
                <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 text-gray-600 hover:text-gray-900"
                        aria-label="Open menu"
                    >
                        <FaBars className="text-xl" />
                    </button>
                    <span className="font-bold text-blue-600">TeleMed Admin</span>
                    <button onClick={handleLogout} className="text-red-500 text-sm font-medium">
                        Logout
                    </button>
                </div>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
