const { body, param, query, validationResult } = require('express-validator');

// Handle validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
        });
    }
    next();
};

// Auth validators
const registerValidator = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/\d/)
        .withMessage('Password must contain a number'),
    body('role')
        .optional()
        .isIn(['patient', 'doctor'])
        .withMessage('Role must be patient or doctor'),
    validate,
];

const loginValidator = [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
];

// Doctor validators
const doctorProfileValidator = [
    body('specialization').trim().notEmpty().withMessage('Specialization is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('experience').isNumeric().withMessage('Experience must be a number').isInt({ min: 0 }),
    body('consultationFee').isNumeric().withMessage('Fee must be a number').isFloat({ min: 0 }),
    body('licenseNumber').trim().notEmpty().withMessage('License number is required'),
    validate,
];

// Appointment validators
const appointmentValidator = [
    body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
    body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
    body('timeSlot.startTime')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Valid start time required (HH:MM)'),
    body('timeSlot.endTime')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Valid end time required (HH:MM)'),
    validate,
];

// Review validators
const reviewValidator = [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment')
        .trim()
        .notEmpty()
        .withMessage('Comment is required')
        .isLength({ max: 500 })
        .withMessage('Comment cannot exceed 500 characters'),
    validate,
];

module.exports = {
    registerValidator,
    loginValidator,
    doctorProfileValidator,
    appointmentValidator,
    reviewValidator,
    validate,
};
