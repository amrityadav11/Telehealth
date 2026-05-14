import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FaSearch, FaComments, FaCircle } from 'react-icons/fa';

const ConversationList = ({ onSelect, activeId, role }) => {
    const { inbox, loadingInbox, onlineUsers } = useSelector((s) => s.chat);
    const [search, setSearch] = useState('');

    const filtered = inbox.filter((c) =>
        c.other?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const formatTime = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        const now = new Date();
        const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className="w-full md:w-72 lg:w-80 flex-shrink-0 flex flex-col h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {/* Header */}
            <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <FaComments className="text-blue-600" />
                    {role === 'doctor' ? 'Patient Chats' : 'My Chats'}
                </h2>
                {/* Search */}
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={role === 'doctor' ? 'Search patients...' : 'Search doctors...'}
                        className="w-full pl-8 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 dark:text-white placeholder-gray-400"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {loadingInbox ? (
                    <div className="flex flex-col gap-3 p-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-3 animate-pulse">
                                <div className="w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
                                <div className="flex-1">
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                                    <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 px-4 text-center">
                        <FaComments className="text-4xl mb-3 opacity-20" />
                        {search ? (
                            <p className="text-sm">No results for "{search}"</p>
                        ) : (
                            <>
                                <p className="text-sm font-medium">No conversations yet</p>
                                <p className="text-xs mt-1">
                                    {role === 'doctor'
                                        ? 'Patients will appear here after booking appointments'
                                        : 'Book an appointment to start chatting with a doctor'}
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    filtered.map((conv) => {
                        const isActive = activeId === conv.appointmentId?.toString();
                        const isOnline = onlineUsers[conv.other?._id] || false;
                        const hasUnread = conv.unread > 0;

                        return (
                            <button
                                key={conv._id}
                                onClick={() => onSelect(conv)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-100 dark:border-gray-700/50 ${isActive
                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-l-blue-600'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-4 border-l-transparent'
                                    }`}
                            >
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <img
                                        src={conv.other?.avatar?.url ||
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.other?.name || 'U')}&background=2563eb&color=fff&size=44`}
                                        alt={conv.other?.name}
                                        className="w-11 h-11 rounded-full object-cover"
                                    />
                                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <p className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-800 dark:text-gray-200'}`}>
                                            {conv.other?.name}
                                        </p>
                                        <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                                            {formatTime(conv.lastMessage?.at)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className={`text-xs truncate ${hasUnread ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400'}`}>
                                            {conv.lastMessage?.text || 'No messages yet'}
                                        </p>
                                        {hasUnread && (
                                            <span className="ml-2 flex-shrink-0 bg-blue-600 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                                {conv.unread > 99 ? '99+' : conv.unread}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-xs mt-0.5 ${conv.appointmentStatus === 'confirmed' ? 'text-green-500' :
                                            conv.appointmentStatus === 'completed' ? 'text-blue-400' :
                                                'text-yellow-500'
                                        }`}>
                                        {conv.appointmentStatus}
                                    </p>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ConversationList;
