const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        relationship: {
            type: String,
            enum: ['spouse', 'child', 'parent', 'sibling', 'grandparent', 'other'],
            required: true,
        },
        dateOfBirth: Date,
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
        },
        bloodGroup: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
            default: '',
        },
        phone: String,
        allergies: [String],
        medicalConditions: [String],
        notes: {
            type: String,
            maxlength: [500, 'Notes cannot exceed 500 characters'],
        },
        avatar: {
            url: { type: String, default: '' },
        },
    },
    { timestamps: true }
);

familyMemberSchema.index({ patient: 1 });

module.exports = mongoose.model('FamilyMember', familyMemberSchema);
