const express = require('express');
const router = express.Router();
const {
    uploadRecord,
    getMyRecords,
    getPatientRecords,
    deleteRecord,
    toggleShare,
} = require('../controllers/medicalRecordController');
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
router.post('/', authorize('patient'), (req, res, next) => {
    getUpload().single('file')(req, res, next);
}, uploadRecord);

router.get('/', authorize('patient'), getMyRecords);
router.delete('/:id', authorize('patient'), deleteRecord);
router.put('/:id/share', authorize('patient'), toggleShare);

// Doctor route — view patient records before consultation
router.get('/patient/:patientId', authorize('doctor'), getPatientRecords);

module.exports = router;
