import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchInbox,
    setActiveConversation,
    markConversationRead,
    setOnlineStatuses,
} from '../../store/slices/chatSlice';
import { getSocket } from '../../services/socket';
import ConversationList from '../../components/chat/ConversationList';
import ChatWindow from '../../components/chat/ChatWindow';
import { FaArrowLeft } from 'react-icons/fa';

const PatientChat = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { appointmentId: urlAppointmentId } = useParams();
    const { user } = useSelector((s) => s.auth);
    const { inbox } = useSelector((s) => s.chat);
    const socket = getSocket();

    const [selectedConv, setSelectedConv] = useState(null);
    const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'

    // Load inbox on mount
    useEffect(() => {
        dispatch(fetchInbox());
    }, [dispatch]);

    // Auto-select from URL param
    useEffect(() => {
        if (urlAppointmentId && inbox.length > 0) {
            const conv = inbox.find((c) => c.appointmentId?.toString() === urlAppointmentId);
            if (conv) {
                setSelectedConv(conv);
                dispatch(setActiveConversation(urlAppointmentId));
                setMobileView('chat');
            }
        }
    }, [urlAppointmentId, inbox, dispatch]);

    // Check online statuses
    useEffect(() => {
        if (!socket || inbox.length === 0) return;
        const userIds = inbox.map((c) => c.other?._id).filter(Boolean);
        if (userIds.length > 0) {
            socket.emit('check_online', { userIds });
            socket.once('online_statuses', (statuses) => {
                dispatch(setOnlineStatuses(statuses));
            });
        }
    }, [socket, inbox, dispatch]);

    const handleSelectConversation = useCallback((conv) => {
        setSelectedConv(conv);
        dispatch(setActiveConversation(conv.appointmentId?.toString()));
        dispatch(markConversationRead(conv.appointmentId?.toString()));
        setMobileView('chat');
        navigate(`/patient/chat/${conv.appointmentId}`, { replace: true });
    }, [dispatch, navigate]);

    const handleBack = () => {
        setMobileView('list');
        setSelectedConv(null);
        dispatch(setActiveConversation(null));
        navigate('/patient/chat', { replace: true });
    };

    return (
        <div className="flex h-full bg-white dark:bg-gray-800 overflow-hidden">
            {/* Conversation list */}
            <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} flex-col h-full w-full md:w-auto`}>
                <ConversationList
                    onSelect={handleSelectConversation}
                    activeId={selectedConv?.appointmentId?.toString()}
                    role="patient"
                />
            </div>

            {/* Chat window */}
            <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col h-full overflow-hidden`}>
                {mobileView === 'chat' && (
                    <div className="md:hidden flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-blue-600 text-sm font-medium"
                        >
                            <FaArrowLeft />
                            Back to chats
                        </button>
                    </div>
                )}
                <ChatWindow
                    conversation={selectedConv}
                    currentUser={user}
                />
            </div>
        </div>
    );
};

export default PatientChat;
