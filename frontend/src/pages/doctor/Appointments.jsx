import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchDoctorAppointments, updateAppointmentStatus } from '../../store/slices/appointmentSlice';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import ChatModal from '../../components/chat/ChatModal';
import { format } from 'date-fns';
import { FaCheck, FaTimes, FaVideo, FaPlay, FaStop, FaComments } from 'react-icons/fa';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DoctorAppointments = () => {
    const dispatch = useDispatch();
    const { appointments, loading, pages, currentPage } = useSelector((s) => s.appointments);
    const [statusFilter, setStatusFilter] = useState('');
    const [prescriptionModal, setPrescriptionModal] = useState(null);
    const [prescription, setPrescription] = useState({ medicines: [], instructions: '' });
    const [chatAppointment, setChatAppointment] = useState(null);

    useEffect(() => {
        dispatch(fetchDoctorAppointments({ status: statusFilter, page: 1 }));
    }, [statusFilter, dispatch]);

    const handleConfirm = (id) => {
        dispatch(updateAppointmentStatus({ id, status: 'confirmed' }));
    };

    const handleReject = (id) => {
        const reason = window.prompt('Reason for cancellation (optional):');
        dispatch(updateAppointmentStatus({ id, status: 'cancelled', cancellationReason: reason || 'Doctor cancelled' }));
    };

    const handleStartConsultation = async (id) => {
        try {
            const { data } = await api.post(`/appointments/${id}/start-consultation`);
            toast.success('Consultation started!');
            window.open(`/consultation/${data.roomId}?appointmentId=${id}`, '_blank');
            dispatch(fetchDoctorAppointments({ status: statusFilter, page: currentPage }));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to start consultation');
        }
    };

    const handleComplete = (appt) => {
        setPrescriptionModal(appt);
    };

    const submitCompletion = () => {
        dispatch(updateAppointmentStatus({
            id: prescriptionModal._id,
            status: 'completed',
            prescription,
        }));
        setPrescriptionModal(null);
        setPrescription({ medicines: [], instructions: '' });
    };

    const statuses = ['', 'pending', 'confirmed', 'completed', 'cancelled'];

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Appointments</h1>

            {/* Status Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {statuses.map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                    <p className="text-gray-500">No appointments found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.map((appt) => (
                        <div key={appt._id} className="card">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={appt.patient?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.patient?.name || 'P')}&size=50`}
                                        alt={appt.patient?.name}
                                        className="w-12 h-12 rounded-full"
                                    />
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{appt.patient?.name}</h3>
                                        <p className="text-gray-500 text-sm">{appt.patient?.email}</p>
                                        <p className="text-gray-500 text-sm mt-0.5">
                                            {format(new Date(appt.appointmentDate), 'MMMM d, yyyy')} at {appt.timeSlot?.startTime}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <StatusBadge status={appt.status} />

                                    {appt.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleConfirm(appt._id)} className="flex items-center gap-1 btn-success text-sm py-1.5 px-3">
                                                <FaCheck className="text-xs" /> Confirm
                                            </button>
                                            <button onClick={() => handleReject(appt._id)} className="flex items-center gap-1 btn-danger text-sm py-1.5 px-3">
                                                <FaTimes className="text-xs" /> Reject
                                            </button>
                                        </>
                                    )}

                                    {appt.status === 'confirmed' && (
                                        <>
                                            <button onClick={() => handleStartConsultation(appt._id)} className="flex items-center gap-1 btn-primary text-sm py-1.5 px-3">
                                                <FaPlay className="text-xs" /> Start
                                            </button>
                                            <button onClick={() => handleComplete(appt)} className="flex items-center gap-1 btn-success text-sm py-1.5 px-3">
                                                <FaStop className="text-xs" /> Complete
                                            </button>
                                        </>
                                    )}

                                    {appt.status === 'confirmed' && appt.consultation?.roomId && (
                                        <Link
                                            to={`/consultation/${appt.consultation.roomId}?appointmentId=${appt._id}`}
                                            className="flex items-center gap-1 btn-primary text-sm py-1.5 px-3"
                                        >
                                            <FaVideo className="text-xs" /> Join
                                        </Link>
                                    )}

                                    {/* Chat button */}
                                    {['pending', 'confirmed', 'completed'].includes(appt.status) && (
                                        <button
                                            onClick={() => setChatAppointment(appt)}
                                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 hover:border-blue-400 px-2.5 py-1.5 rounded-lg transition-colors"
                                        >
                                            <FaComments className="text-xs" /> Chat
                                        </button>
                                    )}
                                </div>
                            </div>

                            {appt.symptoms && (
                                <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
                                    <span className="font-medium">Symptoms:</span> {appt.symptoms}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Pagination
                currentPage={currentPage}
                totalPages={pages}
                onPageChange={(page) => dispatch(fetchDoctorAppointments({ status: statusFilter, page }))}
            />

            {/* Prescription / Complete Modal */}
            {prescriptionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Complete Appointment</h3>
                        <p className="text-sm text-gray-600 mb-4">Patient: <strong>{prescriptionModal.patient?.name}</strong></p>

                        {/* Medicines */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">Medicines</label>
                                <button
                                    type="button"
                                    onClick={() => setPrescription((p) => ({
                                        ...p,
                                        medicines: [...p.medicines, { name: '', dosage: '', frequency: '', duration: '' }],
                                    }))}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium border border-blue-200 px-2 py-1 rounded-lg"
                                >
                                    + Add Medicine
                                </button>
                            </div>
                            {prescription.medicines.length === 0 && (
                                <p className="text-gray-400 text-sm italic">No medicines added.</p>
                            )}
                            <div className="space-y-2">
                                {prescription.medicines.map((med, idx) => (
                                    <div key={idx} className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg">
                                        <input
                                            className="input-field text-sm col-span-2"
                                            placeholder="Medicine name"
                                            value={med.name}
                                            onChange={(e) => {
                                                const updated = [...prescription.medicines];
                                                updated[idx] = { ...updated[idx], name: e.target.value };
                                                setPrescription({ ...prescription, medicines: updated });
                                            }}
                                        />
                                        <input
                                            className="input-field text-sm"
                                            placeholder="Dosage (e.g. 500mg)"
                                            value={med.dosage}
                                            onChange={(e) => {
                                                const updated = [...prescription.medicines];
                                                updated[idx] = { ...updated[idx], dosage: e.target.value };
                                                setPrescription({ ...prescription, medicines: updated });
                                            }}
                                        />
                                        <input
                                            className="input-field text-sm"
                                            placeholder="Frequency (e.g. Twice daily)"
                                            value={med.frequency}
                                            onChange={(e) => {
                                                const updated = [...prescription.medicines];
                                                updated[idx] = { ...updated[idx], frequency: e.target.value };
                                                setPrescription({ ...prescription, medicines: updated });
                                            }}
                                        />
                                        <input
                                            className="input-field text-sm"
                                            placeholder="Duration (e.g. 7 days)"
                                            value={med.duration}
                                            onChange={(e) => {
                                                const updated = [...prescription.medicines];
                                                updated[idx] = { ...updated[idx], duration: e.target.value };
                                                setPrescription({ ...prescription, medicines: updated });
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setPrescription((p) => ({
                                                ...p,
                                                medicines: p.medicines.filter((_, i) => i !== idx),
                                            }))}
                                            className="text-red-400 hover:text-red-600 text-xs col-span-2 text-right"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions / Notes</label>
                            <textarea
                                value={prescription.instructions}
                                onChange={(e) => setPrescription({ ...prescription, instructions: e.target.value })}
                                className="input-field resize-none"
                                rows={3}
                                placeholder="Post-consultation instructions, dietary advice, etc."
                            />
                        </div>

                        {/* Follow-up date */}
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date (optional)</label>
                            <input
                                type="date"
                                value={prescription.followUpDate || ''}
                                onChange={(e) => setPrescription({ ...prescription, followUpDate: e.target.value })}
                                className="input-field"
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={submitCompletion} className="btn-success flex-1">Mark Complete</button>
                            <button onClick={() => setPrescriptionModal(null)} className="btn-secondary flex-1">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Modal */}
            {chatAppointment && (
                <ChatModal
                    appointment={chatAppointment}
                    onClose={() => setChatAppointment(null)}
                />
            )}
        </div>
    );
};

export default DoctorAppointments;
