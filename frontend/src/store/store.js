import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import doctorReducer from './slices/doctorSlice';
import appointmentReducer from './slices/appointmentSlice';
import notificationReducer from './slices/notificationSlice';
import chatReducer from './slices/chatSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        doctors: doctorReducer,
        appointments: appointmentReducer,
        notifications: notificationReducer,
        chat: chatReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }),
});
