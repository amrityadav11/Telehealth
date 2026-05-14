const asyncHandler = require('express-async-handler');
const FamilyMember = require('../models/FamilyMember');

// @desc    Add a family member
// @route   POST /api/family
// @access  Private (Patient)
const addFamilyMember = asyncHandler(async (req, res) => {
    const { name, relationship, dateOfBirth, gender, bloodGroup, phone, allergies, medicalConditions, notes } = req.body;

    if (!name || !relationship) {
        res.status(400);
        throw new Error('Name and relationship are required');
    }

    const member = await FamilyMember.create({
        patient: req.user._id,
        name: name.trim(),
        relationship,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        bloodGroup: bloodGroup || '',
        phone,
        allergies: allergies || [],
        medicalConditions: medicalConditions || [],
        notes,
    });

    res.status(201).json({ success: true, member });
});

// @desc    Get all family members for patient
// @route   GET /api/family
// @access  Private (Patient)
const getFamilyMembers = asyncHandler(async (req, res) => {
    const members = await FamilyMember.find({ patient: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, members });
});

// @desc    Update a family member
// @route   PUT /api/family/:id
// @access  Private (Patient)
const updateFamilyMember = asyncHandler(async (req, res) => {
    const member = await FamilyMember.findById(req.params.id);

    if (!member) {
        res.status(404);
        throw new Error('Family member not found');
    }

    if (member.patient.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized');
    }

    const { name, relationship, dateOfBirth, gender, bloodGroup, phone, allergies, medicalConditions, notes } = req.body;

    if (name) member.name = name.trim();
    if (relationship) member.relationship = relationship;
    if (dateOfBirth !== undefined) member.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
    if (gender) member.gender = gender;
    if (bloodGroup !== undefined) member.bloodGroup = bloodGroup;
    if (phone !== undefined) member.phone = phone;
    if (allergies) member.allergies = allergies;
    if (medicalConditions) member.medicalConditions = medicalConditions;
    if (notes !== undefined) member.notes = notes;

    await member.save();

    res.json({ success: true, member });
});

// @desc    Delete a family member
// @route   DELETE /api/family/:id
// @access  Private (Patient)
const deleteFamilyMember = asyncHandler(async (req, res) => {
    const member = await FamilyMember.findById(req.params.id);

    if (!member) {
        res.status(404);
        throw new Error('Family member not found');
    }

    if (member.patient.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized');
    }

    await FamilyMember.findByIdAndDelete(member._id);

    res.json({ success: true, message: 'Family member removed' });
});

module.exports = { addFamilyMember, getFamilyMembers, updateFamilyMember, deleteFamilyMember };
