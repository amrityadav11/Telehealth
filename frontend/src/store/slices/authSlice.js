import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Load user from localStorage
const userFromStorage = localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user'))
    : null;
const tokenFromStorage = localStorage.getItem('token') || null;

// Async thunks
export const registerUser = createAsyncThunk(
    'auth/register',
    async (userData, { rejectWithValue }) => {
        try {
            const { data } = await api.post('/auth/register', userData);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Registration failed');
        }
    }
);

export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const { data } = await api.post('/auth/login', credentials);

            // 2FA required — don't store token yet, just return the flag
            if (data.twoFactorRequired) {
                return data; // { twoFactorRequired: true, userId, message }
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Login failed');
        }
    }
);

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
    try {
        const { data } = await api.get('/auth/me');
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch user');
    }
});

export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async (formData, { rejectWithValue }) => {
        try {
            const { data } = await api.put('/auth/update-profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Update failed');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: userFromStorage,
        token: tokenFromStorage,
        profile: null,
        loading: false,
        error: null,
    },
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.profile = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },
        clearError: (state) => {
            state.error = null;
        },
        setProfile: (state, action) => {
            state.profile = action.payload;
        },
    },
    extraReducers: (builder) => {
        // Register
        builder
            .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                toast.success('Registration successful!');
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                toast.error(action.payload);
            });

        // Login
        builder
            .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                // 2FA required — don't set user/token yet, the Login page handles redirect
                if (action.payload.twoFactorRequired) return;
                state.user = action.payload.user;
                state.token = action.payload.token;
                toast.success(`Welcome back, ${action.payload.user.name}!`);
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                toast.error(action.payload);
            });

        // Get Me
        builder
            .addCase(getMe.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.profile = action.payload.profile;
            })
            .addCase(getMe.rejected, (state) => {
                state.user = null;
                state.token = null;
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            });

        // Update Profile
        builder
            .addCase(updateProfile.pending, (state) => { state.loading = true; })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                toast.success('Profile updated successfully!');
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.loading = false;
                toast.error(action.payload);
            });
    },
});

export const { logout, clearError, setProfile } = authSlice.actions;
export default authSlice.reducer;
