import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import { format } from 'date-fns';
import {
    FaHeartbeat, FaFlask, FaFileMedical, FaTimes,
    FaExclamationTriangle, FaCheckCircle, FaEye,
    FaChevronDown, FaChevronUp,
} from 'react-icons/fa';
import { MdBloodtype, MdMonitor } from 'react-icons/md';
import { FaWeight, FaThermometerHalf } from 'react-icons/fa';

const VITAL_CONFIG = {
    blood_pressure: { label: 'Blood Pressure', unit: 'mmHg', icon: MdBloodtype, color: 'text-red-500' },
    blood_sugar: { label: 'Blood Sugar', unit: 'mg/dL', icon: MdBloodtype, color: 'text-amber-500' },
    heart_rate: { label: 'Heart Rate', unit: 'bpm', icon: FaHeartbeat, color: 'text-pink-500' },
    weight: { label: 'Weight', unit: 'kg', icon: FaWeight, color: 'text-purple-500' },
    temperature: { label: 'Temperature', unit: '°C', icon: FaThermometerHalf, color: 'text-cyan-500' },
    oxygen_saturation: { label: 'SpO₂', unit: '%', icon: MdMonitor, color: 'text-emerald-500' },
    bmi: { label: 'BMI', unit: 'kg/m²', icon: FaHeartbeat, color: 'text-blue-500' },
};

const STATUS_COLORS = {
    ordered: 'bg-blue-100 text-blue-700',
    sample_collected: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
};

const formatVitalValue = (v) => {
    if (v.type === 'blood_pressure') return `${v.systolic}/${v.diastolic}`;
    return v.value?.toFixed(1) || '—';
};

const Section = ({ title, icon: Icon, iconClass, children, defaultOpen = true }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden mb-3">
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Icon className={`text-sm ${iconClass}`} />
                    <span className="font-semibold text-gray-800 dark:text-white text-sm">{title}</span>
                </div>
                {open ? <FaChevronUp className="text-gray-400 text-xs" /> : <FaChevronDown className="text-gray-400 text-xs" />}
            </button>
            {open && <div className="p-4">{children}</div>}
        </div>
    );
};

const PatientHealthPanel = ({ patientId, patientName, onClose }) => {
    const [vitals, setVitals] = useState([]);
    const [latestVitals, setLatestVitals] = useState([]);
    const [labTests, setLabTests] = useState([]);
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [vitalsRes, labRes, recordsRes] = await Promise.allSettled([
                api.get(`/health-vitals/patient/${patientId}`),
                api.get(`/lab-tests/patient/${patientId}`),
                api.get(`/medical-records/patient/${patientId}`),
            ]);

            if (vitalsRes.status === 'fulfilled') {
                setVitals(vitalsRes.value.data.vitals || []);
                setLatestVitals(vitalsRes.value.data.latestByType || []);
            }
            if (labRes.status === 'fulfilled') {
                setLabTests(labRes.value.data.labTests || []);
            }
            if (recordsRes.status === 'fulfilled') {
                setMedicalRecords(recordsRes.value.data.records || []);
            }
        } catch {
            // silent — panel is supplementary
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const hasAnyData = latestVitals.length > 0 || labTests.length > 0 || medicalRecords.length > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40">
            <div className="h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
                    <div>
                        <h2 className="font-bold text-gray-900 dark:text-white text-base">Patient Health Data</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{patientName} · Shared records only</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <FaTimes />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                    {loading ? (
                        <div className="py-16 flex items-center justify-center"><Spinner size="lg" /></div>
                    ) : !hasAnyData ? (
                        <div className="py-16 text-center text-gray-400">
                            <FaHeartbeat className="text-4xl mx-auto mb-3 opacity-30" />
                            <p className="font-medium text-sm">No shared health data</p>
                            <p className="text-xs mt-1">The patient hasn't shared any vitals, lab tests, or records yet.</p>
                        </div>
                    ) : (
                        <>
                            {/* ── Vitals Summary ── */}
                            {latestVitals.length > 0 && (
                                <Section title="Latest Vitals" icon={FaHeartbeat} iconClass="text-red-500">
                                    <div className="grid grid-cols-2 gap-2">
                                        {latestVitals.map((v) => {
                                            const cfg = VITAL_CONFIG[v.type];
                                            if (!cfg) return null;
                                            const Icon = cfg.icon;
                                            return (
                                                <div key={v.type} className={`p-3 rounded-lg border ${v.isAbnormal ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'}`}>
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <Icon className={`text-xs ${cfg.color}`} />
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">{cfg.label}</span>
                                                        {v.isAbnormal && <FaExclamationTriangle className="text-amber-500 text-xs ml-auto" />}
                                                    </div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                        {formatVitalValue(v)}
                                                        <span className="text-xs font-normal text-gray-400 ml-1">{cfg.unit}</span>
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {format(new Date(v.recordedAt), 'MMM d, HH:mm')}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Abnormal alerts */}
                                    {latestVitals.some((v) => v.isAbnormal) && (
                                        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                                            <div className="flex items-center gap-2 mb-1">
                                                <FaExclamationTriangle className="text-amber-500 text-sm" />
                                                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Abnormal Readings Detected</span>
                                            </div>
                                            {latestVitals.filter((v) => v.isAbnormal).map((v) => (
                                                <p key={v.type} className="text-xs text-amber-600 dark:text-amber-300">
                                                    • {VITAL_CONFIG[v.type]?.label}: {formatVitalValue(v)} {VITAL_CONFIG[v.type]?.unit}
                                                </p>
                                            ))}
                                        </div>
                                    )}

                                    {/* Recent history */}
                                    {vitals.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Recent History ({vitals.length} readings)</p>
                                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                                {vitals.slice(0, 20).map((v) => {
                                                    const cfg = VITAL_CONFIG[v.type];
                                                    return (
                                                        <div key={v._id} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 dark:border-gray-700">
                                                            <span className="text-gray-500 dark:text-gray-400">{cfg?.label}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-medium ${v.isAbnormal ? 'text-amber-600' : 'text-gray-700 dark:text-gray-300'}`}>
                                                                    {formatVitalValue(v)} {cfg?.unit}
                                                                </span>
                                                                <span className="text-gray-400">{format(new Date(v.recordedAt), 'MMM d')}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </Section>
                            )}

                            {/* ── Lab Tests ── */}
                            {labTests.length > 0 && (
                                <Section title={`Lab Tests (${labTests.length})`} icon={FaFlask} iconClass="text-purple-500">
                                    <div className="space-y-2">
                                        {labTests.map((test) => (
                                            <div key={test._id} className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{test.testName}</p>
                                                        <p className="text-xs text-gray-400">{test.testType}</p>
                                                        {test.scheduledDate && (
                                                            <p className="text-xs text-gray-400">
                                                                {format(new Date(test.scheduledDate), 'MMM d, yyyy')}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[test.status] || 'bg-gray-100 text-gray-600'}`}>
                                                            {test.status?.replace('_', ' ')}
                                                        </span>
                                                        {test.results?.isAbnormal && (
                                                            <span className="flex items-center gap-1 text-xs text-amber-600">
                                                                <FaExclamationTriangle className="text-xs" /> Abnormal
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {test.results?.summary && (
                                                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs text-gray-600 dark:text-gray-300">
                                                        {test.results.summary}
                                                    </div>
                                                )}

                                                {test.report?.url && (
                                                    <a
                                                        href={test.report.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                    >
                                                        <FaEye className="text-xs" /> View Report
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {/* ── Medical Records ── */}
                            {medicalRecords.length > 0 && (
                                <Section title={`Medical Records (${medicalRecords.length})`} icon={FaFileMedical} iconClass="text-blue-500">
                                    <div className="space-y-2">
                                        {medicalRecords.map((rec) => (
                                            <div key={rec._id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{rec.title}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {rec.recordType?.replace('_', ' ')} · {format(new Date(rec.createdAt), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                                {rec.file?.url && (
                                                    <a
                                                        href={rec.file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 px-2 py-1 rounded-lg ml-2 flex-shrink-0"
                                                    >
                                                        <FaEye className="text-xs" /> View
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            )}
                        </>
                    )}
                </div>

                {/* Footer note */}
                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex-shrink-0">
                    <p className="text-xs text-gray-400 text-center">
                        Only data the patient has chosen to share is visible here
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PatientHealthPanel;
