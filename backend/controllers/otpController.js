const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Helper: generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper: send token response
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();
    res.status(statusCode).json({
        success: true,
        token,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatar: user.avatar,
        },
    });
};

// @desc    Send OTP to phone number
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = asyncHandler(async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        res.status(400);
        throw new Error('Phone number is required');
    }

    // Normalize phone: strip non-digits, add +91 prefix if needed
    const normalized = phone.replace(/\D/g, '');
    const fullPhone = normalized.startsWith('91') ? `+${normalized}` : `+91${normalized}`;

    const otp = generateOTP();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find or create user by phone
    let user = await User.findOne({ phone: fullPhone });
    if (!user) {
        // Auto-register phone user
        user = await User.create({
            name: `User ${normalized.slice(-4)}`,
            phone: fullPhone,
            role: 'patient',
            isActive: true,
            isEmailVerified: false,
        });
    }

    user.phoneOtp = otp;
    user.phoneOtpExpire = otpExpire;
    await user.save({ validateBeforeSave: false });

    // In production: send via SMS gateway (Twilio, MSG91, etc.)
    // For now: log to console and return in dev mode
    console.log(`\n📱 OTP for ${fullPhone}: ${otp}\n`);

    const isDev = process.env.NODE_ENV !== 'production';

    res.json({
        success: true,
        message: isDev
            ? `OTP sent (dev mode: ${otp})`
            : 'OTP sent to your phone number',
        // Only expose OTP in development
        ...(isDev && { devOtp: otp }),
    });
});

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        res.status(400);
        throw new Error('Phone and OTP are required');
    }

    const normalized = phone.replace(/\D/g, '');
    const fullPhone = normalized.startsWith('91') ? `+${normalized}` : `+91${normalized}`;

    const user = await User.findOne({
        phone: fullPhone,
        phoneOtpExpire: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400);
        throw new Error('OTP expired or phone number not found. Please request a new OTP.');
    }

    if (user.phoneOtp !== otp) {
        res.status(400);
        throw new Error('Invalid OTP. Please try again.');
    }

    if (!user.isActive) {
        res.status(401);
        throw new Error('Your account has been deactivated. Contact support.');
    }

    // Clear OTP
    user.phoneOtp = undefined;
    user.phoneOtpExpire = undefined;
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
});

// @desc    Google OAuth callback — exchange code for user session
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = asyncHandler(async (req, res) => {
    // This is handled by passport.js in a real setup.
    // Here we provide a simple redirect with token for the frontend.
    if (!req.user) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`);
    }

    const token = req.user.getSignedJwtToken();
    // Redirect to frontend with token in query (frontend reads and stores it)
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
});

module.exports = { sendOTP, verifyOTP, googleCallback };
