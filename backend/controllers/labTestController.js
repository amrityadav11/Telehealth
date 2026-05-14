const asyncHandler = require('express-async-handler');
const LabTest = require('../models/LabTest');
const Doctor = require('../models/Doctor');
const { cloudinary, upload } = require('../config/cloudinary');
const fs = require('fs');

// @desc    Book / order a lab test
// @route   POST /api/lab-tests
// @access  Private (Patient)
const orderLabTest = asyncHandler(async (req, res) => {
    const {
        testName, testType, scheduledDate, labName,
        labAddress, notes, price, appointmentId, doctorId, priority,
    } = req.body;

    const labTest = await LabTest.create({
        patient: req.user._id,
        testName,
        testType,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        labName,
        labAddress,
        notes,
        price: Number(price) || 0,
        priority: priority || 'routine',
        appointment: appointmentId || undefined,
        doctor: doctorId || undefined,
    });

    res.status(201).json({ success: true, labTest });
});

// @desc    Get patient's lab tests
// @route   GET /api/lab-tests/my-tests
// @access  Private (Patient)
const getMyLabTests = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { patient: req.user._id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await LabTest.countDocuments(filter);

    const labTests = await LabTest.find(filter)
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    res.json({
        success: true,
        count: labTests.length,
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        labTests,
    });
});

// @desc    Get single lab test
// @route   GET /api/lab-tests/:id
// @access  Private
const getLabTest = asyncHandler(async (req, res) => {
    const labTest = await LabTest.findById(req.params.id)
        .populate('patient', 'name email')
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });

    if (!labTest) {
        res.status(404);
        throw new Error('Lab test not found');
    }

    // Authorization
    const isPatient = labTest.patient._id.toString() === req.user._id.toString();
    const doctorProfile = await Doctor.findOne({ user: req.user._id });
    const isDoctor = doctorProfile && labTest.doctor &&
        labTest.doctor._id.toString() === doctorProfile._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
        res.status(403);
        throw new Error('Not authorized');
    }

    res.json({ success: true, labTest });
});

// @desc    Upload lab test report
// @route   PUT /api/lab-tests/:id/upload-report
// @access  Private (Patient)
const uploadReport = asyncHandler(async (req, res) => {
    const labTest = await LabTest.findById(req.params.id);

    if (!labTest) {
        res.status(404);
        throw new Error('Lab test not found');
    }

    if (labTest.patient.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized');
    }

    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file');
    }

    let reportData;

    if (cloudinary && req.file.path && !req.file.path.includes('uploads\\') && !req.file.path.includes('uploads/')) {
        // Cloudinary storage — file already uploaded, req.file has public_id and secure_url
        reportData = {
            public_id: req.file.filename || req.file.public_id,
            url: req.file.path || req.file.secure_url,
            uploadedAt: new Date(),
        };
    } else if (cloudinary && req.file.path) {
        // Local disk storage with Cloudinary configured — upload manually
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'telehealth/lab-reports',
            resource_type: 'auto',
        });
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        // Delete old report
        if (labTest.report?.public_id) {
            await cloudinary.uploader.destroy(labTest.report.public_id);
        }
        reportData = { public_id: result.public_id, url: result.secure_url, uploadedAt: new Date() };
    } else {
        // Local storage only
        reportData = {
            public_id: req.file.filename,
            url: `/uploads/${req.file.filename}`,
            uploadedAt: new Date(),
        };
    }

    labTest.report = reportData;
    labTest.status = 'completed';
    labTest.completedDate = new Date();
    await labTest.save();

    res.json({ success: true, labTest });
});

// @desc    Update lab test status / results
// @route   PUT /api/lab-tests/:id
// @access  Private (Patient / Doctor)
const updateLabTest = asyncHandler(async (req, res) => {
    const labTest = await LabTest.findById(req.params.id);

    if (!labTest) {
        res.status(404);
        throw new Error('Lab test not found');
    }

    const isPatient = labTest.patient.toString() === req.user._id.toString();
    const doctorProfile = await Doctor.findOne({ user: req.user._id });
    const isDoctor = doctorProfile && labTest.doctor &&
        labTest.doctor._id.toString() === doctorProfile._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
        res.status(403);
        throw new Error('Not authorized');
    }

    const { status, results, notes, isSharedWithDoctor, labName, scheduledDate } = req.body;

    if (status) labTest.status = status;
    if (results) labTest.results = { ...labTest.results, ...results };
    if (notes !== undefined) labTest.notes = notes;
    if (isSharedWithDoctor !== undefined) labTest.isSharedWithDoctor = isSharedWithDoctor;
    if (labName) labTest.labName = labName;
    if (scheduledDate) labTest.scheduledDate = new Date(scheduledDate);

    await labTest.save();

    res.json({ success: true, labTest });
});

// @desc    Delete lab test
// @route   DELETE /api/lab-tests/:id
// @access  Private (Patient)
const deleteLabTest = asyncHandler(async (req, res) => {
    const labTest = await LabTest.findById(req.params.id);

    if (!labTest) {
        res.status(404);
        throw new Error('Lab test not found');
    }

    if (labTest.patient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized');
    }

    // Delete report from Cloudinary
    if (labTest.report && labTest.report.public_id) {
        await cloudinary.uploader.destroy(labTest.report.public_id);
    }

    await LabTest.findByIdAndDelete(labTest._id);

    res.json({ success: true, message: 'Lab test deleted' });
});

// @desc    Get lab tests shared with doctor
// @route   GET /api/lab-tests/doctor-tests
// @access  Private (Doctor)
const getDoctorLabTests = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor profile not found');
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {
        $or: [
            { doctor: doctor._id },
            { isSharedWithDoctor: true, doctor: doctor._id },
        ],
    };

    const total = await LabTest.countDocuments(filter);
    const labTests = await LabTest.find(filter)
        .populate('patient', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    res.json({
        success: true,
        count: labTests.length,
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        labTests,
    });
});

// @desc    Get lab tests for a specific patient (doctor view — shared only)
// @route   GET /api/lab-tests/patient/:patientId
// @access  Private (Doctor)
const getPatientLabTests = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
        res.status(403);
        throw new Error('Doctor profile not found');
    }

    const labTests = await LabTest.find({
        patient: req.params.patientId,
        isSharedWithDoctor: true,
    })
        .sort({ createdAt: -1 })
        .limit(50);

    res.json({ success: true, labTests });
});

module.exports = {
    orderLabTest,
    getMyLabTests,
    getLabTest,
    uploadReport,
    updateLabTest,
    deleteLabTest,
    getDoctorLabTests,
    getPatientLabTests,
};
