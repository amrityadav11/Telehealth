import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ── Async thunks ──────────────────────────────────────────────────────────────

export const fetchInbox = createAsyncThunk('chat/fetchInbox', async (_, { rejectWithValue }) => {
    try {
        const { data } = await api.get('/chat/inbox');
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to load inbox');
    }
});

export const fetchMessages = createAsyncThunk(
    'chat/fetchMessages',
    async ({ appointmentId, page = 1 }, { rejectWithValue }) => {
        try {
            const { data } = await api.get(`/chat/${appointmentId}?page=${page}`);
            return { appointmentId, chat: data.chat, page };
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to load messages');
        }
    }
);

export const fetchUnreadCount = createAsyncThunk('chat/fetchUnreadCount', async (_, { rejectWithValue }) => {
    try {
        const { data } = await api.get('/chat/unread');
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch unread count');
    }
});

// ── Slice ─────────────────────────────────────────────────────────────────────

const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        inbox: [],
        totalUnread: 0,
        activeConversation: null,   // appointmentId of open chat
        messages: {},               // { [appointmentId]: [msg, ...] }
        loadingInbox: false,
        loadingMessages: false,
        onlineUsers: {},            // { [userId]: true/false }
        typingUsers: {},            // { [appointmentId]: { userId, name } | null }
    },
    reducers: {
        setActiveConversation(state, action) {
            state.activeConversation = action.payload;
        },
        receiveMessage(state, action) {
            const { appointmentId, ...msg } = action.payload;
            if (!state.messages[appointmentId]) state.messages[appointmentId] = [];

            // Deduplicate
            const exists = state.messages[appointmentId].some(
                (m) => m._id && m._id === msg._id
            );
            if (!exists) state.messages[appointmentId].push(msg);

            // Update inbox last message + unread
            const conv = state.inbox.find((c) => c.appointmentId?.toString() === appointmentId?.toString());
            if (conv) {
                conv.lastMessage = { text: msg.message || (msg.media ? '📎 File' : ''), at: msg.createdAt };
                // Only increment unread if this isn't the active conversation
                if (state.activeConversation !== appointmentId) {
                    conv.unread = (conv.unread || 0) + 1;
                    state.totalUnread = Math.max(0, state.totalUnread + 1);
                }
            }
        },
        markConversationRead(state, action) {
            const appointmentId = action.payload;
            const conv = state.inbox.find((c) => c.appointmentId?.toString() === appointmentId?.toString());
            if (conv) {
                state.totalUnread = Math.max(0, state.totalUnread - (conv.unread || 0));
                conv.unread = 0;
            }
        },
        setUserOnline(state, action) {
            state.onlineUsers[action.payload.userId] = true;
        },
        setUserOffline(state, action) {
            state.onlineUsers[action.payload.userId] = false;
        },
        setOnlineStatuses(state, action) {
            state.onlineUsers = { ...state.onlineUsers, ...action.payload };
        },
        setTyping(state, action) {
            const { appointmentId, userId, name } = action.payload;
            state.typingUsers[appointmentId] = { userId, name };
        },
        clearTyping(state, action) {
            const { appointmentId } = action.payload;
            state.typingUsers[appointmentId] = null;
        },
        clearMessages(state, action) {
            delete state.messages[action.payload];
        },
    },
    extraReducers: (builder) => {
        // Inbox
        builder
            .addCase(fetchInbox.pending, (state) => { state.loadingInbox = true; })
            .addCase(fetchInbox.fulfilled, (state, action) => {
                state.loadingInbox = false;
                state.inbox = action.payload.inbox || [];
                state.totalUnread = action.payload.totalUnread || 0;
            })
            .addCase(fetchInbox.rejected, (state) => { state.loadingInbox = false; });

        // Messages
        builder
            .addCase(fetchMessages.pending, (state) => { state.loadingMessages = true; })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                state.loadingMessages = false;
                const { appointmentId, chat } = action.payload;
                state.messages[appointmentId] = chat?.messages || [];
            })
            .addCase(fetchMessages.rejected, (state) => { state.loadingMessages = false; });

        // Unread count
        builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
            state.totalUnread = action.payload.total || 0;
        });
    },
});

export const {
    setActiveConversation,
    receiveMessage,
    markConversationRead,
    setUserOnline,
    setUserOffline,
    setOnlineStatuses,
    setTyping,
    clearTyping,
    clearMessages,
} = chatSlice.actions;

export default chatSlice.reducer;
