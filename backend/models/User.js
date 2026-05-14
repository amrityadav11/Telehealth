const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            unique: true,
            sparse: true,   // allows multiple null values (phone-only users)
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        password: {
            type: String,
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        role: {
            type: String,
            enum: ['patient', 'doctor', 'admin'],
            default: 'patient',
        },
        phone: {
            type: String,
            match: [/^\+?[\d\s\-()]{7,15}$/, 'Please enter a valid phone number'],
        },
        avatar: {
            public_id: String,
            url: {
                type: String,
                default: 'https://res.cloudinary.com/demo/image/upload/v1/telemedicine/default-avatar.png',
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationToken: String,
        emailVerificationExpire: Date,
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        lastLogin: Date,
        // OTP for phone login
        phoneOtp: String,
        phoneOtpExpire: Date,
        // Google OAuth
        googleId: String,
        // Two-Factor Authentication (email OTP)
        twoFactorEnabled: { type: Boolean, default: false },
        twoFactorOtp: String,
        twoFactorOtpExpire: Date,
        notifications: [
            {
                message: String,
                type: {
                    type: String,
                    enum: ['appointment', 'payment', 'system', 'review'],
                    default: 'system',
                },
                isRead: { type: Boolean, default: false },
                createdAt: { type: Date, default: Date.now },
                link: String,
            },
        ],
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    // Skip if password not modified OR if password is undefined (Google OAuth users)
    if (!this.isModified('password') || !this.password) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT
userSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    return resetToken;
};

// Generate email verification token
userSchema.methods.getEmailVerificationToken = function () {
    const verifyToken = crypto.randomBytes(20).toString('hex');
    this.emailVerificationToken = crypto.createHash('sha256').update(verifyToken).digest('hex');
    this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    return verifyToken;
};

// Add notification
userSchema.methods.addNotification = function (message, type = 'system', link = '') {
    this.notifications.unshift({ message, type, link });
    if (this.notifications.length > 50) {
        this.notifications = this.notifications.slice(0, 50);
    }
};

module.exports = mongoose.model('User', userSchema);
