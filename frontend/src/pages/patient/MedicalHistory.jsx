import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import StatusBadge from '../../components/common/StatusBadge';
import StarRating from '../../components/common/StarRating';
import { format } from 'date-fns';
import { FaFileMedical, FaPills, FaCalendarAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const MedicalHistory = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({});
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/appointments/my-appointments', {
                    params: { status: 'completed', page, limit: 10 },
                });
                setAppointments(data.appointments);
                setPages(data.pages);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [page]);

    const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FaFileMedical className="text-blue-500" /> Medical History
                </h1>
                <p className="text-gray-500 text-sm mt-1">Your completed consultations, prescriptions, and diagnoses</p>
            </div>

            {loading ? (
                <div className="py-20"><Spinner size="lg" /></div>
            ) : appointments.length === 0 ? (
                <div className="card text-center py-12">
                    <FaFileMedical className="text-gray-300 text-5xl mx-auto mb-4" />
                    <p className="text-gray-500">No completed consultations yet.</p>
                    <p className="text-gray-400 text-sm mt-1">Your medical history will appear here after completed appointments.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.map((appt) => (
                        <div key={appt._id} className="card">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={appt.doctor?.user?.avatar?.url || `https://ui-avatars.com/api/?name=Dr&background=2563eb&color=fff&size=44`}
                                        alt="Doctor"
                                        className="w-11 h-11 rounded-full object-cover"
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-900">{appt.doctor?.user?.name}</p>
                                        <p className="text-blue-600 text-sm">{appt.doctor?.specialization}</p>
                                        <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                                            <FaCalendarAlt className="text-gray-400" />
                                            {format(new Date(appt.appointmentDate), 'MMMM d, yyyy')} at {appt.timeSlot?.startTime}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={appt.status} />
                                    <button
                                        onClick={() => toggleExpand(appt._id)}
                                        className="text-gray-400 hover:text-gray-600 p-1"
                                    >
                                        {expanded[appt._id] ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>

                            {/* Symptoms */}
                            {appt.symptoms && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium text-gray-700">Symptoms: </span>
                                        {appt.symptoms}
                                    </p>
                                </div>
                            )}

                            {/* Expanded: Prescription */}
                            {expanded[appt._id] && (
                                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                                    {appt.prescription?.medicines?.length > 0 ? (
                                        <div>
                                            <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                                                <FaPills className="text-green-500" /> Prescription
                                            </h4>
                                            <div className="space-y-2">
                                                {appt.prescription.medicines.map((med, idx) => (
                                                    <div key={idx} className="bg-green-50 rounded-lg p-3 text-sm">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-semibold text-gray-800">{med.name}</span>
                                                            <span className="text-gray-500">{med.dosage}</span>
                                                        </div>
                                                        <div className="text-gray-600 mt-1">
                                                            {med.frequency} · {med.duration}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {appt.prescription.instructions && (
                                                <div className="mt-3 bg-blue-50 rounded-lg p-3 text-sm">
                                                    <span className="font-medium text-blue-800">Instructions: </span>
                                                    <span className="text-blue-700">{appt.prescription.instructions}</span>
                                                </div>
                                            )}
                                            {appt.prescription.followUpDate && (
                                                <p className="text-sm text-gray-600 mt-2">
                                                    <span className="font-medium">Follow-up: </span>
                                                    {format(new Date(appt.prescription.followUpDate), 'MMMM d, yyyy')}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-sm italic">No prescription recorded for this visit.</p>
                                    )}

                                    {/* Consultation duration */}
                                    {appt.consultation?.duration && (
                                        <p className="text-sm text-gray-500">
                                            <span className="font-medium">Consultation duration: </span>
                                            {appt.consultation.duration} minutes
                                        </p>
                                    )}

                                    {/* Notes */}
                                    {appt.notes && (
                                        <div className="bg-gray-50 rounded-lg p-3 text-sm">
                                            <span className="font-medium text-gray-700">Doctor's Notes: </span>
                                            <span className="text-gray-600">{appt.notes}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MedicalHistory;
