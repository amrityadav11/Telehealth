/**
 * Usage:
 *   node utils/changePassword.js <email> <newPassword>
 *
 * Example:
 *   node utils/changePassword.js rajare353@gmail.com MyNewPass@99
 */

require('dotenv').config();
const mongoose = require('mongoose');

const [, , email, newPassword] = process.argv;

if (!email || !newPassword) {
    console.error('Usage: node utils/changePassword.js <email> <newPassword>');
    process.exit(1);
}

if (newPassword.length < 6) {
    console.error('Password must be at least 6 characters');
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const User = require('../models/User');

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
        console.error(`No user found with email: ${email}`);
        process.exit(1);
    }

    user.password = newPassword;
    await user.save(); // pre-save hook re-hashes automatically

    // Verify it works
    const updated = await User.findOne({ email: email.toLowerCase() }).select('+password');
    const ok = await updated.matchPassword(newPassword);

    if (ok) {
        console.log(`✅ Password changed successfully for ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   New password: ${newPassword}`);
    } else {
        console.error('❌ Something went wrong — password verification failed');
    }

    process.exit(0);
}).catch(err => {
    console.error('DB Error:', err.message);
    process.exit(1);
});
