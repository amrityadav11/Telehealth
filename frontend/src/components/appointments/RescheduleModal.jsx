import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchAvailableSlots } from '../../store/slices/doctorSlice';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import Spinner from '../common/Spinner';
import toast from 'react-hot-toast';
import { FaCalendarAlt, FaClock, FaTimes } from 'react-icons/fa';
import { format, addDays } from 'date-fns';

const RescheduleModal = ({ appointment, onSuccess, onClose }) => {
    const dispatch = useDispatch();
    const { availableSlots, slotsLoading } = useSelector((s) => s.doctors);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false);

    const doctorId = appointment?.doctor?._id;

    const availableDates = Array.from({ length: 14 }, (_, i) => {
        const date = addDays(new Date(), i + 1);
        return format(date, 'yyyy-MM-dd');
    });

    useEffect(() => {
        if (selectedDate && doctorId) {
            dispatch(fetchAvailableSlots({ doctorId, date: selectedDate }));
            setSelectedSlot(null);
        }
    }, [selectedDate, doctorId, dispatch]);

    const handleReschedule = async () => {
        if (!selectedDate || !selectedSlot) return;
        setLoading(true);
        try {
            const { data } = await api.put(`/appointments/${appointment._id}/reschedule`, {
                appointmentDate: selectedDate,
                timeSlot: selectedSlot,
            });
            toast.success('Appointment rescheduled successfully!');
            onSuccess(data.appointment);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reschedule');
        } finally {
            setLoading(false);
        }
    };

    if (!appointment) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Reschedule Appointment</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            With Dr. {appointment.doctor?.user?.name}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* Current appointment info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-5 text-sm">
                    <p className="text-yellow-800 font-medium">Current appointment:</p>
                    <p className="text-yellow-700">
                        {format(new Date(appointment.appointmentDate), 'MMMM d, yyyy')} at {appointment.timeSlot?.startTime}
                    </p>
                </div>

                {/* Date Selection */}
                <div className="mb-5">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FaCalendarAlt className="text-blue-500" /> Select New Date
                    </h3>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {availableDates.map((date) => {
                            const d = new Date(date);
                            const isSelected = selectedDate === date;
                            return (
                                <button
                                    key={date}
                                    onClick={() => setSelectedDate(date)}
                                    className={`p-2 rounded-lg text-center text-xs transition-all ${isSelected
                                            ? 'bg-blue-600 text-white'
                                            : 'border border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                                        }`}
                                >
                                    <div className="font-medium">{format(d, 'EEE')}</div>
                                    <div className={isSelected ? 'text-blue-100' : 'text-gray-500'}>
                                        {format(d, 'MMM d')}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Time Slots */}
                {selectedDate && (
                    <div className="mb-5">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FaClock className="text-blue-500" /> Select New Time
                        </h3>
                        {slotsLoading ? (
                            <div className="py-6"><Spinner /></div>
                        ) : availableSlots.length === 0 ? (
                            <p className="text-gray-500 text-sm">No slots available for this date.</p>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {availableSlots.map((slot, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => !slot.isBooked && setSelectedSlot(slot)}
                                        disabled={slot.isBooked}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${slot.isBooked
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                                                : selectedSlot?.startTime === slot.startTime
                                                    ? 'bg-blue-600 text-white'
                                                    : 'border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700'
                                            }`}
                                    >
                                        {slot.startTime}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                    <button
                        onClick={handleReschedule}
                        disabled={!selectedDate || !selectedSlot || loading}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                        {loading ? <><Spinner size="sm" /> Rescheduling...</> : 'Confirm Reschedule'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RescheduleModal;
