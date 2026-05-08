const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    updatePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    updateProfile,
} = require('../controllers/authController');
const { sendOTP, verifyOTP } = require('../controllers/otpController');
const { protect } = require('../middleware/authMiddleware');
const { registerValidator, loginValidator } = require('../middleware/validationMiddleware');

// Lazy-load upload to avoid crashing if cloudinary isn't configured
let uploadMiddleware;
const getUpload = () => {
    if (!uploadMiddleware) {
        const { upload } = require('../config/cloudinary');
        uploadMiddleware = upload;
    }
    return uploadMiddleware;
};

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.put('/update-profile', protect, (req, res, next) => {
    getUpload().single('avatar')(req, res, next);
}, updateProfile);

// ── Phone OTP routes ──────────────────────────────────────────────────────
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

module.exports = router;
