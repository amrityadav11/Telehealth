const asyncHandler = require('express-async-handler');
const MedicalRecord = require('../models/MedicalRecord');
const path = require('path');

// @desc    Upload a medical record
// @route   POST /api/medical-records
// @access  Private (Patient)
const uploadRecord = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file');
    }

    const { title, description, recordType, appointmentId, tags } = req.body;

    if (!title) {
        res.status(400);
        throw new Error('Title is required');
    }

    // Build file object — works for both Cloudinary and local disk
    const fileObj = {
        public_id: req.file.filename || req.file.public_id || '',
        url: req.file.path?.startsWith('http')
            ? req.file.path
            : req.file.secure_url ||
            `${process.env.SERVER_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
    };

    const record = await MedicalRecord.create({
        patient: req.user._id,
        appointment: appointmentId || null,
        title: title.trim(),
        description: description?.trim(),
        recordType: recordType || 'other',
        file: fileObj,
        uploadedBy: 'patient',
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    });

    res.status(201).json({ success: true, record });
});

// @desc    Get all records for the logged-in patient
// @route   GET /api/medical-records
// @access  Private (Patient)
const getMyRecords = asyncHandler(async (req, res) => {
    const { recordType, page = 1, limit = 20 } = req.query;

    const filter = { patient: req.user._id };
    if (recordType) filter.recordType = recordType;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await MedicalRecord.countDocuments(filter);

    const records = await MedicalRecord.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    res.json({
        success: true,
        count: records.length,
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        records,
    });
});

// @desc    Get records for a patient (doctor viewing before consultation)
// @route   GET /api/medical-records/patient/:patientId
// @access  Private (Doctor)
const getPatientRecords = asyncHandler(async (req, res) => {
    const records = await MedicalRecord.find({
        patient: req.params.patientId,
        isSharedWithDoctor: true,
    }).sort({ createdAt: -1 });

    res.json({ success: true, records });
});

// @desc    Delete a medical record
// @route   DELETE /api/medical-records/:id
// @access  Private (Patient — own records only)
const deleteRecord = asyncHandler(async (req, res) => {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
        res.status(404);
        throw new Error('Record not found');
    }

    if (record.patient.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to delete this record');
    }

    await MedicalRecord.findByIdAndDelete(record._id);

    res.json({ success: true, message: 'Record deleted' });
});

// @desc    Toggle sharing with doctor
// @route   PUT /api/medical-records/:id/share
// @access  Private (Patient)
const toggleShare = asyncHandler(async (req, res) => {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
        res.status(404);
        throw new Error('Record not found');
    }

    if (record.patient.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized');
    }

    record.isSharedWithDoctor = !record.isSharedWithDoctor;
    await record.save();

    res.json({ success: true, record });
});

module.exports = { uploadRecord, getMyRecords, getPatientRecords, deleteRecord, toggleShare };
