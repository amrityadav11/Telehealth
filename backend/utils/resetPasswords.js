require('dotenv').config();
const mongoose = require('mongoose');

const resets = [
    { email: 'rajare353@gmail.com', password: 'Admin@123' },
    { email: 'doc1@gmail.com', password: 'Doctor@123' },
    { email: 'doc2@gmail.com', password: 'Doctor@123' },
    { email: 'sunny@gmail.com', password: 'Patient@123' },
    { email: 'amritshrivastava100@gmail.com', password: 'Patient@123' },
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const User = require('../models/User');

    for (const r of resets) {
        const user = await User.findOne({ email: r.email }).select('+password');
        if (!user) {
            console.log('Not found:', r.email);
            continue;
        }
        user.password = r.password;
        await user.save();
        // Verify
        const updated = await User.findOne({ email: r.email }).select('+password');
        const ok = await updated.matchPassword(r.password);
        console.log(`${ok ? '✅' : '❌'} ${r.email} => ${r.password}`);
    }

    console.log('\nAll passwords reset.');
    process.exit(0);
}).catch(err => {
    console.error('DB Error:', err.message);
    process.exit(1);
});
