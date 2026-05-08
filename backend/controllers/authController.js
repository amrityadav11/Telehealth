const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

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
            role: user.role,
            avatar: user.avatar,
            phone: user.phone,
        },
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
    const { name, email, password, role, phone } = req.body;

    // Check duplicate email
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('Email already registered');
    }

    // Create user
    const user = await User.create({
        name,
        email,
        password,
        role: role || 'patient',
        phone: phone || undefined,
    });

    // If registering as doctor, create a placeholder doctor profile
    if (role === 'doctor') {
        await Doctor.create({
            user: user._id,
            specialization: 'General',
            category: 'General Practice',
            experience: 0,
            consultationFee: 0,
            licenseNumber: 'PENDING',
            isApproved: false,
        });
    }

    // Try to send welcome email — never block registration if it fails
    if (
        process.env.SMTP_HOST &&
        process.env.SMTP_EMAIL &&
        process.env.SMTP_PASSWORD
    ) {
        try {
            const { sendEmail } = require('../utils/sendEmail');
            const verifyToken = user.getEmailVerificationToken();
            await user.save({ validateBeforeSave: false });
            const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
            await sendEmail({
                email: user.email,
                subject: 'Welcome to TeleHealth - Verify Your Email',
                template: 'emailVerification',
                data: { name: user.name, verifyUrl },
            });
        } catch (err) {
            console.warn('⚠️  Email send skipped:', err.message);
            // Reset email verification fields so they don't cause issues
            user.emailVerificationToken = undefined;
            user.emailVerificationExpire = undefined;
            await user.save({ validateBeforeSave: false });
        }
    }

    sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        res.status(401);
        throw new Error('Invalid email or password');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        res.status(401);
        throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
        res.status(401);
        throw new Error('Your account has been deactivated. Contact support.');
    }

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    let profileData = null;
    if (user.role === 'doctor') {
        profileData = await Doctor.findOne({ user: user._id });
    }

    res.json({
        success: true,
        user,
        profile: profileData,
    });
});

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
        res.status(401);
        throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        res.status(404);
        throw new Error('No user found with that email');
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
        const { sendEmail } = require('../utils/sendEmail');
        await sendEmail({
            email: user.email,
            subject: 'TeleHealth - Password Reset Request',
            template: 'passwordReset',
            data: { name: user.name, resetUrl },
        });
        res.json({ success: true, message: 'Password reset email sent' });
    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        res.status(500);
        throw new Error('Email could not be sent. Please contact support.');
    }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired reset token');
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
    const emailVerificationToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        emailVerificationToken,
        emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired verification token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
});

// @desc    Update profile (name, phone, avatar)
// @route   PUT /api/auth/update-profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
    const { name, phone } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    if (req.file) {
        // Cloudinary gives path/filename; local disk gives filename only
        updateData.avatar = {
            public_id: req.file.filename || req.file.public_id,
            url: req.file.path
                ? req.file.path.startsWith('http')
                    ? req.file.path
                    : `${process.env.SERVER_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`
                : req.file.secure_url,
        };
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
        new: true,
        runValidators: true,
    });

    res.json({ success: true, user });
});

module.exports = {
    register,
    login,
    getMe,
    updatePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    updateProfile,
};
