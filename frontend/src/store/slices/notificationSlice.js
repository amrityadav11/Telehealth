import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchNotifications = createAsyncThunk(
    'notifications/fetch',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get('/notifications');
            return data.notifications;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message);
        }
    }
);

export const markAllRead = createAsyncThunk('notifications/markAllRead', async () => {
    await api.put('/notifications/read-all');
});

export const markOneRead = createAsyncThunk('notifications/markOneRead', async (index) => {
    await api.put(`/notifications/${index}/read`);
    return index;
});

const notificationSlice = createSlice({
    name: 'notifications',
    initialState: {
        notifications: [],
        unreadCount: 0,
        loading: false,
    },
    reducers: {
        addNotification: (state, action) => {
            state.notifications.unshift(action.payload);
            state.unreadCount += 1;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => { state.loading = true; })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = false;
                state.notifications = action.payload;
                state.unreadCount = action.payload.filter((n) => !n.isRead).length;
            })
            .addCase(fetchNotifications.rejected, (state) => { state.loading = false; });

        builder.addCase(markAllRead.fulfilled, (state) => {
            state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
            state.unreadCount = 0;
        });

        builder.addCase(markOneRead.fulfilled, (state, action) => {
            const idx = action.payload;
            if (state.notifications[idx]) {
                state.notifications[idx].isRead = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        });
    },
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
