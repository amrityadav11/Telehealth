import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const bookAppointment = createAsyncThunk(
    'appointments/book',
    async (appointmentData, { rejectWithValue }) => {
        try {
            const { data } = await api.post('/appointments', appointmentData);
            return data.appointment;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Booking failed');
        }
    }
);

export const fetchMyAppointments = createAsyncThunk(
    'appointments/fetchMine',
    async (params, { rejectWithValue }) => {
        try {
            const { data } = await api.get('/appointments/my-appointments', { params });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message);
        }
    }
);

export const fetchDoctorAppointments = createAsyncThunk(
    'appointments/fetchDoctorAppointments',
    async (params, { rejectWithValue }) => {
        try {
            const { data } = await api.get('/appointments/doctor-appointments', { params });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message);
        }
    }
);

export const updateAppointmentStatus = createAsyncThunk(
    'appointments/updateStatus',
    async ({ id, ...updateData }, { rejectWithValue }) => {
        try {
            const { data } = await api.put(`/appointments/${id}/status`, updateData);
            return data.appointment;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Update failed');
        }
    }
);

export const fetchAppointment = createAsyncThunk(
    'appointments/fetchOne',
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await api.get(`/appointments/${id}`);
            return data.appointment;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message);
        }
    }
);

const appointmentSlice = createSlice({
    name: 'appointments',
    initialState: {
        appointments: [],
        selectedAppointment: null,
        total: 0,
        pages: 0,
        currentPage: 1,
        loading: false,
        bookingLoading: false,
        error: null,
    },
    reducers: {
        clearSelectedAppointment: (state) => { state.selectedAppointment = null; },
        updateAppointmentInList: (state, action) => {
            const idx = state.appointments.findIndex((a) => a._id === action.payload._id);
            if (idx !== -1) state.appointments[idx] = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(bookAppointment.pending, (state) => { state.bookingLoading = true; state.error = null; })
            .addCase(bookAppointment.fulfilled, (state, action) => {
                state.bookingLoading = false;
                state.appointments.unshift(action.payload);
                toast.success('Appointment booked successfully!');
            })
            .addCase(bookAppointment.rejected, (state, action) => {
                state.bookingLoading = false;
                state.error = action.payload;
                toast.error(action.payload);
            });

        builder
            .addCase(fetchMyAppointments.pending, (state) => { state.loading = true; })
            .addCase(fetchMyAppointments.fulfilled, (state, action) => {
                state.loading = false;
                state.appointments = action.payload.appointments;
                state.total = action.payload.total;
                state.pages = action.payload.pages;
                state.currentPage = action.payload.currentPage;
            })
            .addCase(fetchMyAppointments.rejected, (state) => { state.loading = false; });

        builder
            .addCase(fetchDoctorAppointments.pending, (state) => { state.loading = true; })
            .addCase(fetchDoctorAppointments.fulfilled, (state, action) => {
                state.loading = false;
                state.appointments = action.payload.appointments;
                state.total = action.payload.total;
                state.pages = action.payload.pages;
            })
            .addCase(fetchDoctorAppointments.rejected, (state) => { state.loading = false; });

        builder
            .addCase(updateAppointmentStatus.fulfilled, (state, action) => {
                const idx = state.appointments.findIndex((a) => a._id === action.payload._id);
                if (idx !== -1) state.appointments[idx] = action.payload;
                if (state.selectedAppointment?._id === action.payload._id) {
                    state.selectedAppointment = action.payload;
                }
                toast.success('Appointment updated!');
            })
            .addCase(updateAppointmentStatus.rejected, (state, action) => {
                toast.error(action.payload);
            });

        builder
            .addCase(fetchAppointment.pending, (state) => { state.loading = true; })
            .addCase(fetchAppointment.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedAppointment = action.payload;
            })
            .addCase(fetchAppointment.rejected, (state) => { state.loading = false; });
    },
});

export const { clearSelectedAppointment, updateAppointmentInList } = appointmentSlice.actions;
export default appointmentSlice.reducer;
