import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket } from '../../services/socket';
import api from '../../services/api';
import {
    fetchMessages,
    markConversationRead,
    setTyping,
    clearTyping,
} from '../../store/slices/chatSlice';
import {
    FaPaperPlane, FaComments, FaCircle, FaPaperclip,
    FaSmile, FaDownload, FaPlay, FaFile, FaTimes,
} from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';

const TYPING_DEBOUNCE = 1500;

const ChatWindow = ({ conversation, currentUser }) => {
    const dispatch = useDispatch();
    const socket = getSocket();
    const { messages: allMessages, loadingMessages, onlineUsers, typingUsers } = useSelector((s) => s.chat);

    const appointmentId = conversation?.appointmentId?.toString();
    const messages = allMessages[appointmentId] || [];
    const isTyping = typingUsers[appointmentId];

    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [filePreview, setFilePreview] = useState(null); // { file, url, type }
    const [uploadProgress, setUploadProgress] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const messagesEndRef = useRef(null);
    const typingTimerRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const messagesTopRef = useRef(null);
    const isOnline = onlineUsers[conversation?.other?._id] || false;

    // Load messages on conversation change
    useEffect(() => {
        if (!appointmentId) return;
        setPage(1);
        dispatch(fetchMessages({ appointmentId, page: 1 })).then((res) => {
            if (res.payload?.chat?.messages?.length === 50) setHasMore(true);
            else setHasMore(false);
        });
        dispatch(markConversationRead(appointmentId));
        if (socket) socket.emit('join_chat', { appointmentId });
        setTimeout(() => inputRef.current?.focus(), 100);

        return () => {
            if (socket) socket.emit('leave_chat', { appointmentId });
        };
    }, [appointmentId, dispatch, socket]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Load older messages (pagination)
    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMessages) return;
        const nextPage = page + 1;
        const res = await dispatch(fetchMessages({ appointmentId, page: nextPage }));
        if (res.payload?.chat?.messages?.length < 50) setHasMore(false);
        setPage(nextPage);
    }, [hasMore, loadingMessages, page, appointmentId, dispatch]);

    const handleSend = useCallback(async () => {
        const text = input.trim();
        if ((!text && !filePreview) || sending) return;
        setSending(true);

        try {
            if (filePreview) {
                // Upload via REST
                const formData = new FormData();
                formData.append('file', filePreview.file);
                if (text) formData.append('caption', text);
                await api.post(`/chat/${appointmentId}/media`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (e) => {
                        setUploadProgress(Math.round((e.loaded * 100) / e.total));
                    },
                });
                setFilePreview(null);
                setUploadProgress(0);
            } else {
                // Send via socket (primary)
                socket.emit('send_chat_message', { appointmentId, message: text });
            }
            setInput('');
            socket.emit('chat_stop_typing', { appointmentId });
        } catch (err) {
            console.error('Send error:', err.message);
        } finally {
            setSending(false);
        }
    }, [input, filePreview, sending, socket, appointmentId]);

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
            }, TYPING_DEBOUNCE);
        }
    };

    const handleEmojiClick = (emojiData) => {
        setInput((prev) => prev + emojiData.emoji);
        setShowEmoji(false);
        inputRef.current?.focus();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        const type = file.type.startsWith('image/') ? 'image'
            : file.type.startsWith('video/') ? 'video' : 'file';
        setFilePreview({ file, url, type, name: file.name, size: file.size });
        e.target.value = '';
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
        return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Group messages by date
    const grouped = messages.reduce((acc, msg) => {
        const date = formatDate(msg.createdAt);
        if (!acc[date]) acc[date] = [];
        acc[date].push(msg);
        return acc;
    }, {});

    if (!conversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-400">
                <FaComments className="text-6xl mb-4 opacity-20" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm mt-1">Choose a chat from the left to start messaging</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-gray-800">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
                <div className="relative">
                    <img
                        src={conversation.other?.avatar?.url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.other?.name || 'U')}&background=2563eb&color=fff&size=40`}
                        alt={conversation.other?.name}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {conversation.other?.name}
                    </p>
                    <p className={`text-xs ${isOnline ? 'text-green-500' : 'text-gray-400'}`}>
                        {isTyping ? (
                            <span className="text-blue-500 italic">typing...</span>
                        ) : isOnline ? 'Online' : 'Offline'}
                    </p>
                </div>
                <div className="text-xs text-gray-400 text-right hidden sm:block">
                    <p>Appt: {conversation.appointmentRef}</p>
                    <p className={`font-medium ${conversation.appointmentStatus === 'confirmed' ? 'text-green-500' :
                            conversation.appointmentStatus === 'completed' ? 'text-blue-500' :
                                'text-yellow-500'
                        }`}>{conversation.appointmentStatus}</p>
                </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-gray-50 dark:bg-gray-900">
                {/* Load more */}
                {hasMore && (
                    <div className="text-center mb-2">
                        <button
                            onClick={loadMore}
                            disabled={loadingMessages}
                            className="text-xs text-blue-500 hover:underline disabled:opacity-50"
                        >
                            {loadingMessages ? 'Loading...' : 'Load older messages'}
                        </button>
                    </div>
                )}

                {loadingMessages && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-400">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-sm">Loading messages...</p>
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-400">
                            <FaComments className="text-5xl mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-medium">No messages yet</p>
                            <p className="text-xs mt-1">Say hello to start the conversation!</p>
                        </div>
                    </div>
                ) : (
                    Object.entries(grouped).map(([date, msgs]) => (
                        <div key={date}>
                            {/* Date separator */}
                            <div className="flex items-center gap-2 my-4">
                                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                                <span className="text-xs text-gray-400 font-medium bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                                    {date}
                                </span>
                                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                            </div>

                            {msgs.map((msg, idx) => {
                                const isMe = msg.senderId?.toString() === currentUser?._id?.toString();
                                const prevMsg = msgs[idx - 1];
                                const showAvatar = !isMe && (
                                    !prevMsg || prevMsg.senderId?.toString() !== msg.senderId?.toString()
                                );
                                const isRead = msg.readBy?.length > 1;

                                return (
                                    <div key={msg._id || idx} className={`flex mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        {/* Other user avatar */}
                                        {!isMe && (
                                            <div className="w-7 flex-shrink-0 mr-2 self-end">
                                                {showAvatar && (
                                                    <img
                                                        src={conversation.other?.avatar?.url ||
                                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.other?.name || 'U')}&background=2563eb&color=fff&size=28`}
                                                        alt=""
                                                        className="w-7 h-7 rounded-full object-cover"
                                                    />
                                                )}
                                            </div>
                                        )}

                                        <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                            {/* Media */}
                                            {msg.media?.url && (
                                                <div className={`rounded-2xl overflow-hidden mb-1 ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                                                    {msg.media.type === 'image' && (
                                                        <img
                                                            src={msg.media.url}
                                                            alt={msg.media.name}
                                                            className="max-w-[240px] max-h-[200px] object-cover cursor-pointer"
                                                            onClick={() => window.open(msg.media.url, '_blank')}
                                                        />
                                                    )}
                                                    {msg.media.type === 'video' && (
                                                        <video
                                                            src={msg.media.url}
                                                            controls
                                                            className="max-w-[240px] max-h-[200px] rounded-xl"
                                                        />
                                                    )}
                                                    {msg.media.type === 'file' && (
                                                        <a
                                                            href={msg.media.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${isMe ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-600'}`}
                                                        >
                                                            <FaFile className="flex-shrink-0" />
                                                            <div className="min-w-0">
                                                                <p className="truncate max-w-[160px] font-medium">{msg.media.name}</p>
                                                                <p className="text-xs opacity-70">{formatFileSize(msg.media.size)}</p>
                                                            </div>
                                                            <FaDownload className="flex-shrink-0 opacity-70" />
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            {/* Text bubble */}
                                            {msg.message && (
                                                <div className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap ${isMe
                                                            ? 'bg-blue-600 text-white rounded-br-sm'
                                                            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm border border-gray-100 dark:border-gray-600 rounded-bl-sm'
                                                        }`}>
                                                        {msg.message}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Timestamp + read receipt */}
                                            <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
                                                {isMe && (
                                                    <span className={`text-xs ${isRead ? 'text-blue-500' : 'text-gray-400'}`}>
                                                        {isRead ? '✓✓' : '✓'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}

                {/* Typing indicator */}
                {isTyping && (
                    <div className="flex items-end gap-2 justify-start">
                        <div className="w-7 flex-shrink-0 mr-2">
                            <img
                                src={conversation.other?.avatar?.url ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.other?.name || 'U')}&background=2563eb&color=fff&size=28`}
                                alt=""
                                className="w-7 h-7 rounded-full object-cover"
                            />
                        </div>
                        <div className="bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
                            <div className="flex gap-1 items-center">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* File preview bar */}
            {filePreview && (
                <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800 flex items-center gap-3 flex-shrink-0">
                    {filePreview.type === 'image' && (
                        <img src={filePreview.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    {filePreview.type === 'video' && (
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <FaPlay className="text-gray-500" />
                        </div>
                    )}
                    {filePreview.type === 'file' && (
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <FaFile className="text-gray-500" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{filePreview.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(filePreview.size)}</p>
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div className="bg-blue-500 h-1 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                            </div>
                        )}
                    </div>
                    <button onClick={() => setFilePreview(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* Input area */}
            <div className="px-3 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 relative">
                {/* Emoji picker */}
                {showEmoji && (
                    <div className="absolute bottom-full right-4 mb-2 z-50">
                        <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            theme="auto"
                            height={350}
                            width={300}
                            searchDisabled={false}
                            skinTonesDisabled
                            previewConfig={{ showPreview: false }}
                        />
                    </div>
                )}

                <div className="flex items-end gap-2">
                    {/* File attach */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
                        title="Attach file"
                    >
                        <FaPaperclip />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                        onChange={handleFileChange}
                    />

                    {/* Text input */}
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        className="flex-1 resize-none bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-600 transition-colors max-h-28 overflow-y-auto"
                        placeholder={filePreview ? 'Add a caption...' : 'Type a message...'}
                        style={{ lineHeight: '1.4' }}
                    />

                    {/* Emoji */}
                    <button
                        onClick={() => setShowEmoji((v) => !v)}
                        className={`w-9 h-9 flex items-center justify-center transition-colors flex-shrink-0 ${showEmoji ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
                        title="Emoji"
                    >
                        <FaSmile />
                    </button>

                    {/* Send */}
                    <button
                        onClick={handleSend}
                        disabled={(!input.trim() && !filePreview) || sending}
                        className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl flex items-center justify-center text-white transition-colors flex-shrink-0"
                        aria-label="Send message"
                    >
                        {sending ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <FaPaperPlane className="text-sm" />
                        )}
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 text-center">
                    Enter to send · Shift+Enter for new line
                </p>
            </div>
        </div>
    );
};

export default ChatWindow;
