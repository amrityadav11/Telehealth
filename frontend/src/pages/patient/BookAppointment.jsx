import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDoctor, fetchAvailableSlots, clearSlots } from '../../store/slices/doctorSlice';
import { bookAppointment } from '../../store/slices/appointmentSlice';
import { PageSpinner } from '../../components/common/Spinner';
import Spinner from '../../components/common/Spinner';
import PaymentModal from '../../components/payment/PaymentModal';
import AvailabilityCalendar from '../../components/doctors/AvailabilityCalendar';
import { FaCalendarAlt, FaClock, FaDollarSign, FaVideo, FaCheckCircle, FaLock } from 'react-icons/fa';
import { format, addDays } from 'date-fns';

const BookAppointment = () => {
    const { doctorId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { selectedDoctor: doctor, availableSlots, slotsLoading } = useSelector((s) => s.doctors);
    const { bookingLoading } = useSelector((s) => s.appointments);

    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [symptoms, setSymptoms] = useState('');
    // step: 1 = select date/slot, 2 = payment modal open, 3 = success
    const [step, setStep] = useState(1);
    const [bookedAppointment, setBookedAppointment] = useState(null);

    useEffect(() => {
        dispatch(fetchDoctor(doctorId));
        return () => dispatch(clearSlots());
    }, [doctorId, dispatch]);

    useEffect(() => {
        if (selectedDate) {
            dispatch(fetchAvailableSlots({ doctorId, date: selectedDate }));
            setSelectedSlot(null);
        }
    }, [selectedDate, doctorId, dispatch]);

    // Generate next 14 days
    const availableDates = Array.from({ length: 14 }, (_, i) => {
        const date = addDays(new Date(), i + 1);
        return format(date, 'yyyy-MM-dd');
    });

    // Step 1 → Book appointment (creates it with payment pending) → open payment modal
    const handleBook = async () => {
        if (!selectedSlot || !selectedDate) return;

        const result = await dispatch(
            bookAppointment({
                doctorId,
                appointmentDate: selectedDate,
                timeSlot: selectedSlot,
                symptoms,
                type: 'video',
            })
        );

        if (!result.error) {
            // Attach doctor info for display in payment modal
            const appt = {
                ...result.payload,
                doctor: {
                    ...result.payload.doctor,
                    user: { name: doctor?.user?.name },
                },
            };
            setBookedAppointment(appt);
            setStep(2); // open payment modal
        }
    };

    // Called when payment succeeds
    const handlePaymentSuccess = (paidAppointment) => {
        setBookedAppointment(paidAppointment);
        setStep(3);
    };

    // User closes payment modal without paying
    const handlePaymentClose = () => {
        // Appointment is booked but unpaid — send to appointments list
        navigate('/patient/appointments');
    };

    if (!doctor) return <PageSpinner />;

    const { user: docUser, specialization, consultationFee } = doctor;

    // ── Success screen ──────────────────────────────────────────────────────────
    if (step === 3) {
        return (
            <div className="max-w-lg mx-auto px-4 py-16 text-center">
                <div className="card">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaCheckCircle className="text-green-600 text-4xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Confirmed!</h2>
                    <p className="text-gray-600 mb-2">
                        Your appointment with <strong>{docUser?.name}</strong> is booked and paid.
                    </p>
                    <p className="text-gray-600 mb-1">
                        <strong>{format(new Date(selectedDate), 'MMMM d, yyyy')}</strong> at{' '}
                        <strong>{selectedSlot?.startTime}</strong>
                    </p>
                    <p className="text-green-600 font-semibold mb-6">
                        Payment of ${consultationFee} received ✓
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/patient/appointments')}
                            className="btn-primary flex-1"
                        >
                            View Appointments
                        </button>
                        <button
                            onClick={() => navigate('/doctors')}
                            className="btn-secondary flex-1"
                        >
                            Find More Doctors
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Main booking form ───────────────────────────────────────────────────────
    return (
        <>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Book Appointment</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Doctor Summary */}
                    <div className="lg:col-span-1">
                        <div className="card sticky top-24">
                            <div className="flex items-center gap-3 mb-4">
                                <img
                                    src={
                                        docUser?.avatar?.url ||
                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(docUser?.name || 'D')}&background=2563eb&color=fff&size=60`
                                    }
                                    alt={docUser?.name}
                                    className="w-14 h-14 rounded-full object-cover"
                                />
                                <div>
                                    <h3 className="font-semibold text-gray-900">{docUser?.name}</h3>
                                    <p className="text-blue-600 text-sm">{specialization}</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <FaVideo className="text-blue-500" />
                                    <span>Video Consultation</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaDollarSign className="text-green-500" />
                                    <span className="font-semibold text-gray-900">${consultationFee}</span>
                                </div>
                            </div>

                            {selectedDate && selectedSlot && (
                                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <FaCalendarAlt className="text-blue-500" />
                                        <span>{format(new Date(selectedDate), 'MMM d, yyyy')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <FaClock className="text-blue-500" />
                                        <span>{selectedSlot.startTime} – {selectedSlot.endTime}</span>
                                    </div>
                                </div>
                            )}

                            {/* Payment info */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <FaLock />
                                    <span>Secure payment via Stripe</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Booking Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Date + Slot Selection — Visual Calendar */}
                        <div className="card">
                            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FaCalendarAlt className="text-blue-500" /> Select Date & Time
                            </h2>
                            <AvailabilityCalendar
                                availability={doctor?.availability || []}
                                onSelectSlot={(date, slot) => {
                                    setSelectedDate(format(date, 'yyyy-MM-dd'));
                                    setSelectedSlot(slot);
                                    // Also fetch real-time booked slots
                                    dispatch(fetchAvailableSlots({ doctorId, date: format(date, 'yyyy-MM-dd') }));
                                }}
                            />
                            {/* Show booked-out slots from API on top of calendar selection */}
                            {selectedDate && slotsLoading && (
                                <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                                    <Spinner size="sm" /> Checking availability...
                                </div>
                            )}
                            {selectedDate && !slotsLoading && availableSlots.length > 0 && (
                                <div className="mt-4 border-t border-gray-100 pt-4">
                                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                        <FaClock className="text-blue-400" /> Real-time availability (grey = already booked)
                                    </p>
                                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                                        {availableSlots.map((slot, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => !slot.isBooked && setSelectedSlot(slot)}
                                                disabled={slot.isBooked}
                                                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${slot.isBooked
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                                                    : selectedSlot?.startTime === slot.startTime
                                                        ? 'bg-blue-600 text-white shadow-sm'
                                                        : 'border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700'
                                                    }`}
                                            >
                                                {slot.startTime}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Symptoms */}
                        <div className="card">
                            <h2 className="font-semibold text-gray-900 mb-3">
                                Describe Your Symptoms (optional)
                            </h2>
                            <textarea
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                className="input-field resize-none"
                                rows={3}
                                placeholder="Briefly describe your symptoms or reason for visit..."
                                maxLength={500}
                            />
                            <p className="text-xs text-gray-400 mt-1">{symptoms.length}/500</p>
                        </div>

                        {/* Book & Pay Button */}
                        <button
                            onClick={handleBook}
                            disabled={!selectedDate || !selectedSlot || bookingLoading}
                            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
                        >
                            {bookingLoading ? (
                                <><Spinner size="sm" /> Booking...</>
                            ) : (
                                <><FaLock /> Book & Pay — ${consultationFee}</>
                            )}
                        </button>

                        <p className="text-center text-xs text-gray-400">
                            You will be redirected to a secure payment page after booking.
                        </p>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {step === 2 && bookedAppointment && (
                <PaymentModal
                    appointment={bookedAppointment}
                    onSuccess={handlePaymentSuccess}
                    onClose={handlePaymentClose}
                />
            )}
        </>
    );
};

export default BookAppointment;
