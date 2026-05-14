const express = require('express');
const router = express.Router();
const {
    logVital,
    getMyVitals,
    getVitalsChart,
    deleteVital,
    getVitalsSummary,
    getPatientVitals,
    toggleVitalShare,
    shareAllVitals,
} = require('../controllers/healthVitalController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Patient routes
router.post('/', authorize('patient'), logVital);
router.get('/my-vitals', authorize('patient'), getMyVitals);
router.get('/chart', authorize('patient'), getVitalsChart);
router.get('/summary', authorize('patient'), getVitalsSummary);
router.put('/share-all', authorize('patient'), shareAllVitals);
router.put('/:id/share', authorize('patient'), toggleVitalShare);
router.delete('/:id', authorize('patient'), deleteVital);

// Doctor routes — view patient's shared vitals
router.get('/patient/:patientId', authorize('doctor'), getPatientVitals);

module.exports = router;
