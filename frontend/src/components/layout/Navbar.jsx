import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { fetchNotifications, markAllRead, markOneRead } from '../../store/slices/notificationSlice';
import { FaBell, FaUserMd, FaBars, FaTimes, FaSignOutAlt, FaTachometerAlt, FaMoon, FaSun, FaStethoscope, FaDownload, FaTrash } from 'react-icons/fa';
import useDarkMode from '../../hooks/useDarkMode';
import usePWAInstall from '../../hooks/usePWAInstall';

const Navbar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { notifications, unreadCount } = useSelector((state) => state.notifications);
    const [menuOpen, setMenuOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const { canInstall, install } = usePWAInstall();
    const notifRef = useRef(null);
    const [isDark, setIsDark] = useDarkMode();

    // Close notification dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
        setMenuOpen(false);
    };

    const getDashboardLink = () => {
        if (!user) return '/';
        if (user.role === 'admin') return '/admin/dashboard';
        if (user.role === 'doctor') return '/doctor/dashboard';
        return '/patient/dashboard';
    };

    const toggleNotifications = () => {
        if (!notifOpen) dispatch(fetchNotifications());
        setNotifOpen(!notifOpen);
    };

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <FaUserMd className="text-blue-600 text-2xl" />
                        <span className="text-xl font-bold text-blue-600">TeleHealth</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/doctors" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium transition-colors">
                            Find Doctors
                        </Link>
                        <Link to="/symptom-checker" className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium transition-colors">
                            <FaStethoscope className="text-sm text-blue-500" /> AI Checker
                        </Link>

                        {user ? (
                            <>
                                <Link
                                    to={getDashboardLink()}
                                    className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium transition-colors"
                                >
                                    <FaTachometerAlt className="text-sm" />
                                    Dashboard
                                </Link>

                                {/* Notifications */}
                                <div className="relative" ref={notifRef}>
                                    <button
                                        onClick={toggleNotifications}
                                        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors"
                                        aria-label="Notifications"
                                    >
                                        <FaBell className="text-xl" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {notifOpen && (
                                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50">
                                            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                                                <h3 className="font-semibold text-gray-800 dark:text-white">
                                                    Notifications
                                                    {unreadCount > 0 && (
                                                        <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                                                    )}
                                                </h3>
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={() => dispatch(markAllRead())}
                                                        className="text-xs text-blue-600 hover:underline"
                                                    >
                                                        Mark all read
                                                    </button>
                                                )}
                                            </div>
                                            <div className="max-h-80 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="text-center py-10">
                                                        <FaBell className="text-gray-300 text-3xl mx-auto mb-2" />
                                                        <p className="text-gray-500 text-sm">No notifications</p>
                                                    </div>
                                                ) : (
                                                    notifications.slice(0, 15).map((notif, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => {
                                                                if (!notif.isRead) dispatch(markOneRead(idx));
                                                                if (notif.link) { navigate(notif.link); setNotifOpen(false); }
                                                            }}
                                                            className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors ${notif.link ? 'cursor-pointer' : ''} ${!notif.isRead ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                                        >
                                                            <div className="flex items-start gap-2">
                                                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notif.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-sm ${!notif.isRead ? 'font-medium text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                                                        {notif.message}
                                                                    </p>
                                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                                        {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            {notifications.length > 0 && (
                                                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 text-center">
                                                    <button
                                                        onClick={() => dispatch(markAllRead())}
                                                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                                    >
                                                        Clear all
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Avatar + name */}
                                <div className="flex items-center gap-2">
                                    <img
                                        src={user.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff&size=32`}
                                        alt={user.name}
                                        className="w-8 h-8 rounded-full object-cover border border-blue-100"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[120px] truncate">{user.name}</span>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                                >
                                    <FaSignOutAlt />
                                    Logout
                                </button>

                                {/* Install App button */}
                                {canInstall && (
                                    <button
                                        onClick={install}
                                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-colors"
                                        title="Install TeleHealth App"
                                    >
                                        <FaDownload className="text-xs" /> Install App
                                    </button>
                                )}

                                {/* Dark mode toggle */}
                                <button
                                    onClick={() => setIsDark(!isDark)}
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 transition-colors"
                                    aria-label="Toggle dark mode"
                                    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                                >
                                    {isDark ? <FaSun className="text-yellow-400" /> : <FaMoon />}
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium">
                                    Login
                                </Link>
                                <Link to="/register" className="btn-primary text-sm">
                                    Get Started
                                </Link>
                                {/* Install App button for logged-out users */}
                                {canInstall && (
                                    <button
                                        onClick={install}
                                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 border border-blue-300 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                                        title="Install TeleHealth App"
                                    >
                                        <FaDownload className="text-xs" /> Install App
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsDark(!isDark)}
                                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                                    aria-label="Toggle dark mode"
                                >
                                    {isDark ? <FaSun className="text-yellow-400" /> : <FaMoon />}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-2 text-gray-600"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
                        <Link to="/doctors" className="block px-2 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 rounded-lg" onClick={() => setMenuOpen(false)}>
                            Find Doctors
                        </Link>
                        <Link to="/symptom-checker" className="block px-2 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 rounded-lg" onClick={() => setMenuOpen(false)}>
                            🩺 AI Symptom Checker
                        </Link>
                        {user ? (
                            <>
                                <Link to={getDashboardLink()} className="block px-2 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 rounded-lg" onClick={() => setMenuOpen(false)}>
                                    Dashboard
                                </Link>
                                <button onClick={handleLogout} className="block w-full text-left px-2 py-2 text-red-500 font-medium rounded-lg">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="block px-2 py-2 text-gray-600 dark:text-gray-300 rounded-lg" onClick={() => setMenuOpen(false)}>Login</Link>
                                <Link to="/register" className="block btn-primary text-center" onClick={() => setMenuOpen(false)}>Get Started</Link>
                            </>
                        )}
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="flex items-center gap-2 px-2 py-2 text-gray-600 dark:text-gray-300 rounded-lg"
                        >
                            {isDark ? <FaSun className="text-yellow-400" /> : <FaMoon />}
                            {isDark ? 'Light Mode' : 'Dark Mode'}
                        </button>
                        {canInstall && (
                            <button
                                onClick={() => { install(); setMenuOpen(false); }}
                                className="flex items-center gap-2 px-2 py-2 text-blue-600 font-medium rounded-lg"
                            >
                                <FaDownload /> Install App
                            </button>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
