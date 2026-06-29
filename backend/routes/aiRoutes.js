const express = require('express');
const router = express.Router();
const { symptomCheck } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/ai/symptom-check — protected, requires login
router.post('/symptom-check', protect, symptomCheck);

module.exports = router;
