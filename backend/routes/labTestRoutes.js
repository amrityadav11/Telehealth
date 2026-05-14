const express = require('express');
const router = express.Router();
const {
    orderLabTest,
    getMyLabTests,
    getLabTest,
    uploadReport,
    updateLabTest,
    deleteLabTest,
    getDoctorLabTests,
    getPatientLabTests,
} = require('../controllers/labTestController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Lazy-load upload middleware
let uploadMiddleware;
const getUpload = () => {
    if (!uploadMiddleware) {
        const { upload } = require('../config/cloudinary');
        uploadMiddleware = upload;
    }
    return uploadMiddleware;
};

router.use(protect);

// Patient routes
router.post('/', authorize('patient'), orderLabTest);
router.get('/my-tests', authorize('patient'), getMyLabTests);
router.put('/:id/upload-report', authorize('patient'), (req, res, next) => {
    getUpload().single('file')(req, res, next);
}, uploadReport);

// Doctor routes
router.get('/doctor-tests', authorize('doctor'), getDoctorLabTests);
router.get('/patient/:patientId', authorize('doctor'), getPatientLabTests);

// Shared routes (patient, doctor, admin)
router.get('/:id', getLabTest);
router.put('/:id', updateLabTest);
router.delete('/:id', authorize('patient', 'admin'), deleteLabTest);

module.exports = router;
