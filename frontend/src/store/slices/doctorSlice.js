import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchDoctors = createAsyncThunk(
    'doctors/fetchAll',
    async (params, { rejectWithValue }) => {
        try {
            const { data } = await api.get('/doctors', { params });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch doctors');
        }
    }
);

export const fetchDoctor = createAsyncThunk(
    'doctors/fetchOne',
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await api.get(`/doctors/${id}`);
            return data.doctor;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch doctor');
        }
    }
);

export const fetchAvailableSlots = createAsyncThunk(
    'doctors/fetchSlots',
    async ({ doctorId, date }, { rejectWithValue }) => {
        try {
            const { data } = await api.get(`/doctors/${doctorId}/slots`, { params: { date } });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch slots');
        }
    }
);

export const fetchCategories = createAsyncThunk(
    'doctors/fetchCategories',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get('/doctors/categories');
            return data.categories;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message);
        }
    }
);

const doctorSlice = createSlice({
    name: 'doctors',
    initialState: {
        doctors: [],
        selectedDoctor: null,
        availableSlots: [],
        categories: [],
        total: 0,
        pages: 0,
        currentPage: 1,
        loading: false,
        slotsLoading: false,
        error: null,
    },
    reducers: {
        clearSelectedDoctor: (state) => { state.selectedDoctor = null; },
        clearSlots: (state) => { state.availableSlots = []; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDoctors.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchDoctors.fulfilled, (state, action) => {
                state.loading = false;
                state.doctors = action.payload.doctors;
                state.total = action.payload.total;
                state.pages = action.payload.pages;
                state.currentPage = action.payload.currentPage;
            })
            .addCase(fetchDoctors.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        builder
            .addCase(fetchDoctor.pending, (state) => { state.loading = true; })
            .addCase(fetchDoctor.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedDoctor = action.payload;
            })
            .addCase(fetchDoctor.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        builder
            .addCase(fetchAvailableSlots.pending, (state) => { state.slotsLoading = true; })
            .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
                state.slotsLoading = false;
                state.availableSlots = action.payload.slots;
            })
            .addCase(fetchAvailableSlots.rejected, (state) => { state.slotsLoading = false; });

        builder.addCase(fetchCategories.fulfilled, (state, action) => {
            state.categories = action.payload;
        });
    },
});

export const { clearSelectedDoctor, clearSlots } = doctorSlice.actions;
export default doctorSlice.reducer;
