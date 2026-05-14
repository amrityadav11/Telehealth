const express = require('express');
const router = express.Router();
const {
    register,
    login,
    verify2FA,
    toggle2FA,
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
const passport = require('../config/passport');

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

// ── 2FA routes ────────────────────────────────────────────────────────────
router.post('/verify-2fa', verify2FA);
router.put('/toggle-2fa', protect, toggle2FA);

// Resend 2FA OTP
router.post('/resend-2fa', async (req, res) => {
    try {
        const User = require('../models/User');
        const { sendEmail } = require('../utils/sendEmail');
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.twoFactorOtp = otp;
        user.twoFactorOtpExpire = new Date(Date.now() + 10 * 60 * 1000);
        await user.save({ validateBeforeSave: false });

        await sendEmail({
            email: user.email,
            subject: 'Your TeleHealth Login OTP',
            template: 'loginOtp',
            data: { name: user.name, otp },
        });

        res.json({ success: true, message: 'OTP resent to your email' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── Google OAuth routes ───────────────────────────────────────────────────
// Step 1: Redirect user to Google
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Step 2: Google redirects back here with a code
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=google_failed`, session: false }),
    (req, res) => {
        // Issue a JWT and redirect to the frontend callback page
        const token = req.user.getSignedJwtToken();
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
    }
);

module.exports = router;
