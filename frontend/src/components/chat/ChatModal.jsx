import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getSocket } from '../../services/socket';
import api from '../../services/api';
import {
    FaTimes, FaPaperPlane, FaComments, FaCircle,
} from 'react-icons/fa';

const ChatModal = ({ appointment, onClose }) => {
    const { user } = useSelector((s) => s.auth);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [peerTyping, setPeerTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimerRef = useRef(null);
    const inputRef = useRef(null);

    const socket = getSocket();
    const appointmentId = appointment._id;

    // Determine the other person's name
    const otherName =
        user?.role === 'doctor'
            ? appointment.patient?.name
            : appointment.doctor?.user?.name || 'Doctor';

    // Load chat history
    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await api.get(`/chat/${appointmentId}`);
                setMessages(data.chat?.messages || []);
            } catch {
                setMessages([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [appointmentId]);

    // Socket: join room and listen for messages
    useEffect(() => {
        if (!socket) return;

        socket.emit('join_chat', { appointmentId });

        const handleMessage = (msg) => {
            if (msg.appointmentId === appointmentId) {
                setMessages((prev) => {
                    // Avoid duplicates (if we sent via socket and REST both)
                    const exists = prev.some(
                        (m) => m._id === msg._id || (m.createdAt === msg.createdAt && m.senderId?.toString() === msg.senderId?.toString())
                    );
                    return exists ? prev : [...prev, msg];
                });
            }
        };

        const handleTyping = ({ userId: tid }) => {
            if (tid !== user?._id) {
                setPeerTyping(true);
                clearTimeout(typingTimerRef.current);
                typingTimerRef.current = setTimeout(() => setPeerTyping(false), 2000);
            }
        };

        const handleStopTyping = () => setPeerTyping(false);

        socket.on('receive_chat_message', handleMessage);
        socket.on('chat_user_typing', handleTyping);
        socket.on('chat_user_stop_typing', handleStopTyping);

        return () => {
            socket.emit('leave_chat', { appointmentId });
            socket.off('receive_chat_message', handleMessage);
            socket.off('chat_user_typing', handleTyping);
            socket.off('chat_user_stop_typing', handleStopTyping);
            clearTimeout(typingTimerRef.current);
        };
    }, [socket, appointmentId, user?._id]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, peerTyping]);

    // Focus input on open
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    const handleSend = useCallback(() => {
        const text = input.trim();
        if (!text || sending) return;

        setSending(true);
        socket.emit('send_chat_message', { appointmentId, message: text });
        setInput('');
        setSending(false);

        // Stop typing indicator
        socket.emit('chat_stop_typing', { appointmentId });
    }, [input, sending, socket, appointmentId]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
        if (socket) {
            socket.emit('chat_typing', { appointmentId });
            clearTimeout(typingTimerRef.current);
            typingTimerRef.current = setTimeout(() => {
                socket.emit('chat_stop_typing', { appointmentId });
            }, 1500);
        }
    };

    const formatTime = (ts) => {
        if (!ts) return '';
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    // Group messages by date
    const groupedMessages = messages.reduce((groups, msg) => {
        const date = formatDate(msg.createdAt);
        if (!groups[date]) groups[date] = [];
        groups[date].push(msg);
        return groups;
    }, {});

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-6 bg-black/40">
            <div className="w-full sm:w-96 h-[85vh] sm:h-[600px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src={
                                    user?.role === 'doctor'
                                        ? appointment.patient?.avatar?.url ||
                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(otherName)}&background=fff&color=2563eb&size=36`
                                        : appointment.doctor?.user?.avatar?.url ||
                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(otherName)}&background=fff&color=2563eb&size=36`
                                }
                                alt={otherName}
                                className="w-9 h-9 rounded-full object-cover border-2 border-blue-400"
                            />
                            <FaCircle className="absolute -bottom-0.5 -right-0.5 text-green-400 text-xs" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm leading-tight">{otherName}</p>
                            <p className="text-blue-200 text-xs">
                                {peerTyping ? 'typing...' : 'Online'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-blue-700 rounded-lg transition-colors"
                        aria-label="Close chat"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-gray-50">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center text-gray-400">
                                <FaComments className="text-4xl mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Loading messages...</p>
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center text-gray-400">
                                <FaComments className="text-4xl mx-auto mb-2 opacity-30" />
                                <p className="text-sm font-medium">No messages yet</p>
                                <p className="text-xs mt-1">Start the conversation!</p>
                            </div>
                        </div>
                    ) : (
                        Object.entries(groupedMessages).map(([date, msgs]) => (
                            <div key={date}>
                                {/* Date separator */}
                                <div className="flex items-center gap-2 my-3">
                                    <div className="flex-1 h-px bg-gray-200" />
                                    <span className="text-xs text-gray-400 font-medium px-2">{date}</span>
                                    <div className="flex-1 h-px bg-gray-200" />
                                </div>

                                {msgs.map((msg, idx) => {
                                    const isMe = msg.senderId?.toString() === user?._id?.toString();
                                    const showName = !isMe && (idx === 0 || msgs[idx - 1]?.senderId?.toString() !== msg.senderId?.toString());

                                    return (
                                        <div
                                            key={msg._id || idx}
                                            className={`flex flex-col mb-1 ${isMe ? 'items-end' : 'items-start'}`}
                                        >
                                            {showName && (
                                                <span className="text-xs text-gray-500 mb-1 ml-1">{msg.senderName}</span>
                                            )}
                                            <div className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <div
                                                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${isMe
                                                            ? 'bg-blue-600 text-white rounded-br-sm'
                                                            : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                                                        }`}
                                                >
                                                    {msg.message}
                                                </div>
                                                <span className="text-xs text-gray-400 flex-shrink-0 mb-0.5">
                                                    {formatTime(msg.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}

                    {/* Typing indicator */}
                    {peerTyping && (
                        <div className="flex items-start">
                            <div className="bg-white border border-gray-100 shadow-sm px-4 py-2.5 rounded-2xl rounded-bl-sm">
                                <div className="flex gap-1 items-center">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-3 py-3 bg-white border-t border-gray-100 flex-shrink-0">
                    <div className="flex items-end gap-2">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            className="flex-1 resize-none bg-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-colors max-h-24 overflow-y-auto"
                            placeholder="Type a message... (Enter to send)"
                            style={{ lineHeight: '1.4' }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || sending}
                            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl flex items-center justify-center text-white transition-colors flex-shrink-0"
                            aria-label="Send message"
                        >
                            <FaPaperPlane className="text-sm" />
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5 text-center">
                        Shift+Enter for new line · Enter to send
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatModal;
