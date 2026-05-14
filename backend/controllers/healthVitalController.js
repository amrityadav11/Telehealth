const asyncHandler = require('express-async-handler');
const HealthVital = require('../models/HealthVital');

// Normal ranges for auto-flagging
const NORMAL_RANGES = {
    blood_pressure: { systolicMin: 90, systolicMax: 120, diastolicMin: 60, diastolicMax: 80 },
    blood_sugar: { min: 70, max: 140 },       // mg/dL fasting
    weight: { min: 30, max: 300 },             // kg (wide range, just sanity check)
    heart_rate: { min: 60, max: 100 },         // bpm
    temperature: { min: 36.1, max: 37.2 },    // Celsius
    oxygen_saturation: { min: 95, max: 100 }, // %
    bmi: { min: 18.5, max: 24.9 },
};

const checkAbnormal = (type, value, systolic, diastolic) => {
    const range = NORMAL_RANGES[type];
    if (!range) return false;

    if (type === 'blood_pressure') {
        return (
            systolic < range.systolicMin || systolic > range.systolicMax ||
            diastolic < range.diastolicMin || diastolic > range.diastolicMax
        );
    }
    return value < range.min || value > range.max;
};

// @desc    Log a health vital
// @route   POST /api/health-vitals
// @access  Private (Patient)
const logVital = asyncHandler(async (req, res) => {
    const { type, value, systolic, diastolic, unit, notes, recordedAt } = req.body;

    if (!type) {
        res.status(400);
        throw new Error('Vital type is required');
    }

    if (type === 'blood_pressure' && (!systolic || !diastolic)) {
        res.status(400);
        throw new Error('Systolic and diastolic values are required for blood pressure');
    }

    if (type !== 'blood_pressure' && value === undefined) {
        res.status(400);
        throw new Error('Value is required');
    }

    const isAbnormal = checkAbnormal(type, value, systolic, diastolic);

    const vital = await HealthVital.create({
        patient: req.user._id,
        type,
        value: type !== 'blood_pressure' ? Number(value) : undefined,
        systolic: type === 'blood_pressure' ? Number(systolic) : undefined,
        diastolic: type === 'blood_pressure' ? Number(diastolic) : undefined,
        unit: unit || getDefaultUnit(type),
        notes,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
        isAbnormal,
    });

    res.status(201).json({ success: true, vital });
});

// @desc    Get patient's vitals
// @route   GET /api/health-vitals/my-vitals
// @access  Private (Patient)
const getMyVitals = asyncHandler(async (req, res) => {
    const { type, days = 30, page = 1, limit = 50 } = req.query;

    const filter = { patient: req.user._id };
    if (type) filter.type = type;

    // Date range filter
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    filter.recordedAt = { $gte: startDate };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await HealthVital.countDocuments(filter);

    const vitals = await HealthVital.find(filter)
        .sort({ recordedAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    // Latest reading per type
    const latestByType = await HealthVital.aggregate([
        { $match: { patient: req.user._id } },
        { $sort: { recordedAt: -1 } },
        {
            $group: {
                _id: '$type',
                latest: { $first: '$$ROOT' },
            },
        },
    ]);

    res.json({
        success: true,
        count: vitals.length,
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        vitals,
        latestByType: latestByType.map((l) => l.latest),
    });
});

// @desc    Get vitals chart data (grouped by day)
// @route   GET /api/health-vitals/chart
// @access  Private (Patient)
const getVitalsChart = asyncHandler(async (req, res) => {
    const { type, days = 30 } = req.query;

    if (!type) {
        res.status(400);
        throw new Error('Vital type is required');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const vitals = await HealthVital.find({
        patient: req.user._id,
        type,
        recordedAt: { $gte: startDate },
    }).sort({ recordedAt: 1 });

    // Format for chart
    const chartData = vitals.map((v) => ({
        date: v.recordedAt.toISOString().split('T')[0],
        value: v.value,
        systolic: v.systolic,
        diastolic: v.diastolic,
        isAbnormal: v.isAbnormal,
        notes: v.notes,
    }));

    res.json({ success: true, type, chartData, normalRange: NORMAL_RANGES[type] || null });
});

// @desc    Delete a vital record
// @route   DELETE /api/health-vitals/:id
// @access  Private (Patient)
const deleteVital = asyncHandler(async (req, res) => {
    const vital = await HealthVital.findById(req.params.id);

    if (!vital) {
        res.status(404);
        throw new Error('Vital record not found');
    }

    if (vital.patient.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized');
    }

    await HealthVital.findByIdAndDelete(vital._id);

    res.json({ success: true, message: 'Vital record deleted' });
});

// @desc    Get vitals summary stats
// @route   GET /api/health-vitals/summary
// @access  Private (Patient)
const getVitalsSummary = asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const summary = await HealthVital.aggregate([
        {
            $match: {
                patient: req.user._id,
                recordedAt: { $gte: startDate },
            },
        },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
                avgValue: { $avg: '$value' },
                avgSystolic: { $avg: '$systolic' },
                avgDiastolic: { $avg: '$diastolic' },
                minValue: { $min: '$value' },
                maxValue: { $max: '$value' },
                abnormalCount: { $sum: { $cond: ['$isAbnormal', 1, 0] } },
                lastRecorded: { $max: '$recordedAt' },
            },
        },
    ]);

    res.json({ success: true, summary, normalRanges: NORMAL_RANGES });
});

// @desc    Toggle sharing a vital with doctor
// @route   PUT /api/health-vitals/:id/share
// @access  Private (Patient)
const toggleVitalShare = asyncHandler(async (req, res) => {
    const vital = await HealthVital.findById(req.params.id);
    if (!vital) {
        res.status(404);
        throw new Error('Vital record not found');
    }
    if (vital.patient.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized');
    }
    vital.isSharedWithDoctor = !vital.isSharedWithDoctor;
    await vital.save();
    res.json({ success: true, vital });
});

// @desc    Share ALL vitals of a type with doctor (bulk)
// @route   PUT /api/health-vitals/share-all
// @access  Private (Patient)
const shareAllVitals = asyncHandler(async (req, res) => {
    const { share = true } = req.body;
    await HealthVital.updateMany(
        { patient: req.user._id },
        { isSharedWithDoctor: share }
    );
    res.json({ success: true, message: share ? 'All vitals shared with doctor' : 'All vitals hidden from doctor' });
});

// @desc    Get vitals shared with doctor (doctor views patient's vitals)
// @route   GET /api/health-vitals/patient/:patientId
// @access  Private (Doctor)
const getPatientVitals = asyncHandler(async (req, res) => {
    const Doctor = require('../models/Doctor');
    const mongoose = require('mongoose');
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
        res.status(403);
        throw new Error('Doctor profile not found');
    }

    const { days = 90 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const vitals = await HealthVital.find({
        patient: req.params.patientId,
        recordedAt: { $gte: startDate },
        isSharedWithDoctor: true,
    }).sort({ recordedAt: -1 }).limit(200);

    // Latest per type
    const latestByType = await HealthVital.aggregate([
        {
            $match: {
                patient: new mongoose.Types.ObjectId(req.params.patientId),
                isSharedWithDoctor: true,
            },
        },
        { $sort: { recordedAt: -1 } },
        { $group: { _id: '$type', latest: { $first: '$$ROOT' } } },
    ]);

    res.json({ success: true, vitals, latestByType: latestByType.map((l) => l.latest) });
});

function getDefaultUnit(type) {
    const units = {
        blood_pressure: 'mmHg',
        blood_sugar: 'mg/dL',
        weight: 'kg',
        heart_rate: 'bpm',
        temperature: '°C',
        oxygen_saturation: '%',
        bmi: 'kg/m²',
    };
    return units[type] || '';
}

module.exports = {
    logVital,
    getMyVitals,
    getVitalsChart,
    deleteVital,
    getVitalsSummary,
    getPatientVitals,
    toggleVitalShare,
    shareAllVitals,
};
