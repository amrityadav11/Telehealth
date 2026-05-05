import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMyAppointments, updateAppointmentStatus } from '../../store/slices/appointmentSlice';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import PaymentModal from '../../components/payment/PaymentModal';
import RescheduleModal from '../../components/appointments/RescheduleModal';
import { format } from 'date-fns';
import { FaVideo, FaTimes, FaStar, FaCreditCard, FaCalendarAlt } from 'react-icons/fa';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PatientAppointments = () => {
    const dispatch = useDispatch();
    const { appointments, loading, pages, currentPage } = useSelector((s) => s.appointments);
    const [statusFilter, setStatusFilter] = useState('');
    const [reviewModal, setReviewModal] = useState(null);
    const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
    const [paymentAppointment, setPaymentAppointment] = useState(null);
    const [rescheduleAppointment, setRescheduleAppointment] = useState(null);

    useEffect(() => {
        dispatch(fetchMyAppointments({ status: statusFilter, page: 1 }));
    }, [statusFilter, dispatch]);

    const handleCancel = (id) => {
        if (window.confirm('Are you sure you want to cancel this appointment?')) {
            dispatch(updateAppointmentStatus({ id, status: 'cancelled', cancellationReason: 'Patient cancelled' }));
        }
    };

    const handleReviewSubmit = async () => {
        try {
            await api.post('/reviews', {
                appointmentId: reviewModal._id,
                rating: reviewData.rating,
                comment: reviewData.comment,
            });
            toast.success('Review submitted!');
            setReviewModal(null);
            setReviewData({ rating: 5, comment: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit review');
        }
    };

    const handlePaymentSuccess = () => {
        setPaymentAppointment(null);
        dispatch(fetchMyAppointments({ status: statusFilter, page: currentPage }));
        toast.success('Payment completed! Your appointment is confirmed.');
    };

    const handleRescheduleSuccess = (updatedAppt) => {
        setRescheduleAppointment(null);
        dispatch(fetchMyAppointments({ status: statusFilter, page: currentPage }));
    };

    const statuses = ['', 'pending', 'confirmed', 'completed', 'cancelled'];

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
                <Link to="/doctors" className="btn-primary text-sm">Book New</Link>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {statuses.map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === s
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="py-20"><Spinner size="lg" /></div>
            ) : appointments.length === 0 ? (
                <div className="text-center py-16 card">
                    <p className="text-gray-500 mb-4">No appointments found.</p>
                    <Link to="/doctors" className="btn-primary">Find a Doctor</Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.map((appt) => (
                        <div key={appt._id} className="card hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={appt.doctor?.user?.avatar?.url || `https://ui-avatars.com/api/?name=Dr&background=2563eb&color=fff&size=50`}
                                        alt="Doctor"
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{appt.doctor?.user?.name}</h3>
                                        <p className="text-blue-600 text-sm">{appt.doctor?.specialization}</p>
                                        <p className="text-gray-500 text-sm mt-0.5">
                                            {format(new Date(appt.appointmentDate), 'MMMM d, yyyy')} at {appt.timeSlot?.startTime}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 flex-wrap">
                                    <StatusBadge status={appt.status} />
                                    <span className="text-sm font-medium text-gray-700">${appt.payment?.amount}</span>

                                    {/* Pay Now — shown when appointment exists but payment is pending */}
                                    {appt.payment?.status === 'pending' && ['pending', 'confirmed'].includes(appt.status) && (
                                        <button
                                            onClick={() => setPaymentAppointment(appt)}
                                            className="flex items-center gap-1 btn-primary text-sm py-1.5 bg-green-600 hover:bg-green-700"
                                        >
                                            <FaCreditCard className="text-xs" /> Pay Now
                                        </button>
                                    )}

                                    {appt.status === 'confirmed' && appt.consultation?.roomId && (
                                        <Link
                                            to={`/consultation/${appt.consultation.roomId}?appointmentId=${appt._id}`}
                                            className="flex items-center gap-1 btn-primary text-sm py-1.5"
                                        >
                                            <FaVideo className="text-xs" /> Join
                                        </Link>
                                    )}

                                    {appt.status === 'completed' && (
                                        <button
                                            onClick={() => setReviewModal(appt)}
                                            className="flex items-center gap-1 text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                                        >
                                            <FaStar className="text-xs" /> Review
                                        </button>
                                    )}

                                    {['pending', 'confirmed'].includes(appt.status) && (
                                        <button
                                            onClick={() => handleCancel(appt._id)}
                                            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 font-medium"
                                        >
                                            <FaTimes className="text-xs" /> Cancel
                                        </button>
                                    )}

                                    {['pending', 'confirmed'].includes(appt.status) && (
                                        <button
                                            onClick={() => setRescheduleAppointment(appt)}
                                            className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 font-medium"
                                        >
                                            <FaCalendarAlt className="text-xs" /> Reschedule
                                        </button>
                                    )}
                                </div>
                            </div>

                            {appt.symptoms && (
                                <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
                                    <span className="font-medium">Symptoms:</span> {appt.symptoms}
                                </p>
                            )}

                            {/* Payment status indicator */}
                            {appt.payment?.status && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${appt.payment.status === 'paid'
                                        ? 'bg-green-100 text-green-700'
                                        : appt.payment.status === 'refunded'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        Payment: {appt.payment.status.charAt(0).toUpperCase() + appt.payment.status.slice(1)}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Pagination
                currentPage={currentPage}
                totalPages={pages}
                onPageChange={(page) => dispatch(fetchMyAppointments({ status: statusFilter, page }))}
            />

            {/* Payment Modal */}
            {paymentAppointment && (
                <PaymentModal
                    appointment={paymentAppointment}
                    onSuccess={handlePaymentSuccess}
                    onClose={() => setPaymentAppointment(null)}
                />
            )}

            {/* Reschedule Modal */}
            {rescheduleAppointment && (
                <RescheduleModal
                    appointment={rescheduleAppointment}
                    onSuccess={handleRescheduleSuccess}
                    onClose={() => setRescheduleAppointment(null)}
                />
            )}

            {/* Review Modal */}
            {reviewModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Review Dr. {reviewModal.doctor?.user?.name}
                        </h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setReviewData({ ...reviewData, rating: star })}
                                        className={`text-2xl transition-colors ${star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                            <textarea
                                value={reviewData.comment}
                                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                                className="input-field resize-none"
                                rows={3}
                                placeholder="Share your experience..."
                                required
                            />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={handleReviewSubmit} className="btn-primary flex-1">Submit Review</button>
                            <button onClick={() => setReviewModal(null)} className="btn-secondary flex-1">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientAppointments;
