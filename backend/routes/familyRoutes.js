const express = require('express');
const router = express.Router();
const { addFamilyMember, getFamilyMembers, updateFamilyMember, deleteFamilyMember } = require('../controllers/familyController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('patient'));

router.post('/', addFamilyMember);
router.get('/', getFamilyMembers);
router.put('/:id', updateFamilyMember);
router.delete('/:id', deleteFamilyMember);

module.exports = router;
