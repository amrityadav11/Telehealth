import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts';
import {
    FaHeartbeat, FaPlus, FaTimes, FaTrash, FaExclamationTriangle,
    FaCheckCircle, FaChartLine, FaThermometerHalf, FaWeight,
    FaShareAlt, FaLock,
} from 'react-icons/fa';
import { MdBloodtype, MdMonitor } from 'react-icons/md';

const VITAL_TYPES = [
    { value: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg', icon: MdBloodtype, color: '#ef4444', bg: 'bg-red-50', text: 'text-red-600' },
    { value: 'blood_sugar', label: 'Blood Sugar', unit: 'mg/dL', icon: MdBloodtype, color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-600' },
    { value: 'heart_rate', label: 'Heart Rate', unit: 'bpm', icon: FaHeartbeat, color: '#ec4899', bg: 'bg-pink-50', text: 'text-pink-600' },
    { value: 'weight', label: 'Weight', unit: 'kg', icon: FaWeight, color: '#8b5cf6', bg: 'bg-purple-50', text: 'text-purple-600' },
    { value: 'temperature', label: 'Temperature', unit: '°C', icon: FaThermometerHalf, color: '#06b6d4', bg: 'bg-cyan-50', text: 'text-cyan-600' },
    { value: 'oxygen_saturation', label: 'Oxygen Saturation', unit: '%', icon: MdMonitor, color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { value: 'bmi', label: 'BMI', unit: 'kg/m²', icon: FaChartLine, color: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-600' },
];

const NORMAL_RANGES = {
    blood_pressure: 'Systolic: 90–120 mmHg, Diastolic: 60–80 mmHg',
    blood_sugar: '70–140 mg/dL (fasting)',
    heart_rate: '60–100 bpm',
    weight: 'Varies by height',
    temperature: '36.1–37.2 °C',
    oxygen_saturation: '95–100 %',
    bmi: '18.5–24.9 kg/m²',
};

const getVitalConfig = (type) => VITAL_TYPES.find((v) => v.value === type) || VITAL_TYPES[0];

const HealthVitals = () => {
    const [vitals, setVitals] = useState([]);
    const [latestByType, setLatestByType] = useState([]);
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [activeType, setActiveType] = useState('blood_pressure');
    const [chartData, setChartData] = useState([]);
    const [chartLoading, setChartLoading] = useState(false);
    const [days, setDays] = useState(30);
    const [normalRange, setNormalRange] = useState(null);

    const [form, setForm] = useState({
        type: 'blood_pressure',
        value: '',
        systolic: '',
        diastolic: '',
        notes: '',
        recordedAt: new Date().toISOString().slice(0, 16),
    });

    const fetchVitals = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/health-vitals/my-vitals', { params: { days: 90, limit: 100 } });
            setVitals(data.vitals);
            setLatestByType(data.latestByType || []);
        } catch {
            toast.error('Failed to load vitals');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSummary = useCallback(async () => {
        try {
            const { data } = await api.get('/health-vitals/summary', { params: { days } });
            setSummary(data.summary || []);
        } catch {
            // silent
        }
    }, [days]);

    const fetchChart = useCallback(async () => {
        setChartLoading(true);
        try {
            const { data } = await api.get('/health-vitals/chart', { params: { type: activeType, days } });
            setChartData(data.chartData || []);
            setNormalRange(data.normalRange);
        } catch {
            setChartData([]);
        } finally {
            setChartLoading(false);
        }
    }, [activeType, days]);

    useEffect(() => { fetchVitals(); }, [fetchVitals]);
    useEffect(() => { fetchSummary(); }, [fetchSummary]);
    useEffect(() => { fetchChart(); }, [fetchChart]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/health-vitals', form);
            toast.success('Vital logged successfully!');
            setShowForm(false);
            setForm({ type: 'blood_pressure', value: '', systolic: '', diastolic: '', notes: '', recordedAt: new Date().toISOString().slice(0, 16) });
            fetchVitals();
            fetchSummary();
            fetchChart();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to log vital');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this record?')) return;
        try {
            await api.delete(`/health-vitals/${id}`);
            toast.success('Record deleted');
            setVitals((prev) => prev.filter((v) => v._id !== id));
        } catch {
            toast.error('Delete failed');
        }
    };

    const handleToggleShare = async (id, current) => {
        try {
            const { data } = await api.put(`/health-vitals/${id}/share`);
            setVitals((prev) => prev.map((v) => v._id === id ? { ...v, isSharedWithDoctor: data.vital.isSharedWithDoctor } : v));
            toast.success(data.vital.isSharedWithDoctor ? 'Shared with doctor' : 'Hidden from doctor');
        } catch {
            toast.error('Failed to update sharing');
        }
    };

    const handleShareAll = async (share) => {
        try {
            await api.put('/health-vitals/share-all', { share });
            setVitals((prev) => prev.map((v) => ({ ...v, isSharedWithDoctor: share })));
            toast.success(share ? 'All vitals shared with your doctor' : 'All vitals hidden from doctor');
        } catch {
            toast.error('Failed to update sharing');
        }
    };

    const getLatest = (type) => latestByType.find((v) => v.type === type);
    const getSummaryItem = (type) => summary.find((s) => s._id === type);

    const formatValue = (vital) => {
        if (vital.type === 'blood_pressure') return `${vital.systolic}/${vital.diastolic}`;
        return vital.value?.toFixed(1) || '—';
    };

    const filteredVitals = vitals.filter((v) => v.type === activeType);

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaHeartbeat className="text-red-500" /> Health Vitals
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Track your health metrics over time</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleShareAll(true)}
                        className="flex items-center gap-1.5 text-xs text-green-600 border border-green-200 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors"
                        title="Share all vitals with your doctor"
                    >
                        <FaShareAlt className="text-xs" /> Share All
                    </button>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <FaPlus /> Log Vital
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {loading ? (
                <div className="py-10"><Spinner size="lg" /></div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                        {VITAL_TYPES.map((vt) => {
                            const latest = getLatest(vt.value);
                            const sum = getSummaryItem(vt.value);
                            const Icon = vt.icon;
                            return (
                                <button
                                    key={vt.value}
                                    onClick={() => setActiveType(vt.value)}
                                    className={`p-3 rounded-xl border-2 text-left transition-all ${activeType === vt.value
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icon style={{ color: vt.color }} className="text-lg" />
                                        {latest?.isAbnormal && (
                                            <FaExclamationTriangle className="text-amber-500 text-xs" />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{vt.label}</p>
                                    {latest ? (
                                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                                            {formatValue(latest)} <span className="text-xs font-normal text-gray-400">{vt.unit}</span>
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-400 mt-0.5">No data</p>
                                    )}
                                    {sum && (
                                        <p className="text-xs text-gray-400 mt-0.5">{sum.count} readings</p>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Chart Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="font-semibold text-gray-900 dark:text-white">
                                    {getVitalConfig(activeType).label} Trend
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">{NORMAL_RANGES[activeType]}</p>
                            </div>
                            <select
                                value={days}
                                onChange={(e) => setDays(Number(e.target.value))}
                                className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                                <option value={7}>Last 7 days</option>
                                <option value={30}>Last 30 days</option>
                                <option value={90}>Last 90 days</option>
                            </select>
                        </div>

                        {chartLoading ? (
                            <div className="h-48 flex items-center justify-center"><Spinner /></div>
                        ) : chartData.length === 0 ? (
                            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                                <FaChartLine className="text-3xl mb-2" />
                                <p className="text-sm">No data for this period</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                {activeType === 'blood_pressure' ? (
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        {normalRange && (
                                            <>
                                                <ReferenceLine y={normalRange.systolicMax} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Max Sys', fontSize: 10 }} />
                                                <ReferenceLine y={normalRange.systolicMin} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Min Sys', fontSize: 10 }} />
                                            </>
                                        )}
                                        <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Systolic" />
                                        <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Diastolic" />
                                    </LineChart>
                                ) : (
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="vitalGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={getVitalConfig(activeType).color} stopOpacity={0.2} />
                                                <stop offset="95%" stopColor={getVitalConfig(activeType).color} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        {normalRange?.max && (
                                            <ReferenceLine y={normalRange.max} stroke="#ef4444" strokeDasharray="4 4" />
                                        )}
                                        {normalRange?.min && (
                                            <ReferenceLine y={normalRange.min} stroke="#10b981" strokeDasharray="4 4" />
                                        )}
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke={getVitalConfig(activeType).color}
                                            fill="url(#vitalGrad)"
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                            name={getVitalConfig(activeType).label}
                                        />
                                    </AreaChart>
                                )}
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Recent Readings Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="font-semibold text-gray-900 dark:text-white">
                                Recent {getVitalConfig(activeType).label} Readings
                            </h2>
                        </div>
                        {filteredVitals.length === 0 ? (
                            <div className="py-12 text-center text-gray-400">
                                <FaHeartbeat className="text-3xl mx-auto mb-2" />
                                <p className="text-sm">No readings yet. Log your first reading!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                {filteredVitals.slice(0, 15).map((v) => (
                                    <div key={v._id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            {v.isAbnormal ? (
                                                <FaExclamationTriangle className="text-amber-500 text-sm" />
                                            ) : (
                                                <FaCheckCircle className="text-green-500 text-sm" />
                                            )}
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                    {formatValue(v)} <span className="text-xs font-normal text-gray-400">{getVitalConfig(v.type).unit}</span>
                                                </p>
                                                {v.notes && <p className="text-xs text-gray-400">{v.notes}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-400">
                                                {format(new Date(v.recordedAt), 'MMM d, yyyy HH:mm')}
                                            </span>
                                            <button
                                                onClick={() => handleToggleShare(v._id, v.isSharedWithDoctor)}
                                                title={v.isSharedWithDoctor ? 'Shared with doctor — click to hide' : 'Hidden from doctor — click to share'}
                                                className={`p-1 rounded transition-colors ${v.isSharedWithDoctor ? 'text-green-500 hover:text-green-700' : 'text-gray-300 hover:text-gray-500'}`}
                                            >
                                                {v.isSharedWithDoctor ? <FaShareAlt className="text-xs" /> : <FaLock className="text-xs" />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(v._id)}
                                                className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"
                                            >
                                                <FaTrash className="text-xs" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Log Vital Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Log Health Vital</h2>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vital Type</label>
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value, value: '', systolic: '', diastolic: '' }))}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    {VITAL_TYPES.map((vt) => (
                                        <option key={vt.value} value={vt.value}>{vt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {form.type === 'blood_pressure' ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Systolic (mmHg)</label>
                                        <input
                                            type="number"
                                            value={form.systolic}
                                            onChange={(e) => setForm((f) => ({ ...f, systolic: e.target.value }))}
                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="120"
                                            required
                                            min={50} max={250}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Diastolic (mmHg)</label>
                                        <input
                                            type="number"
                                            value={form.diastolic}
                                            onChange={(e) => setForm((f) => ({ ...f, diastolic: e.target.value }))}
                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="80"
                                            required
                                            min={30} max={150}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Value ({getVitalConfig(form.type).unit})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={form.value}
                                        onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Enter value"
                                        required
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Normal: {NORMAL_RANGES[form.type]}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={form.recordedAt}
                                    onChange={(e) => setForm((f) => ({ ...f, recordedAt: e.target.value }))}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
                                <input
                                    type="text"
                                    value={form.notes}
                                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="e.g. After exercise, fasting..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                                >
                                    Save Reading
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HealthVitals;
