/**
 * CLI script to create an admin user
 * Usage: node utils/createAdmin.js
 *        node utils/createAdmin.js --email=admin2@telemed.com --name="Super Admin" --password=Admin@456
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const readline = require('readline');

const User = require('../models/User');

// Parse CLI args  --key=value
const args = {};
process.argv.slice(2).forEach((arg) => {
    const [key, value] = arg.replace('--', '').split('=');
    if (key && value) args[key] = value;
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('\n✅ Connected to MongoDB\n');

        // Get values from CLI args or prompt interactively
        const name = args.name || await ask('Admin Name     : ');
        const email = args.email || await ask('Admin Email    : ');
        const password = args.password || await ask('Admin Password : ');

        if (!name || !email || !password) {
            console.error('❌ Name, email, and password are all required.');
            process.exit(1);
        }

        if (password.length < 6) {
            console.error('❌ Password must be at least 6 characters.');
            process.exit(1);
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            if (existing.role === 'admin') {
                console.log(`⚠️  An admin with email "${email}" already exists.`);
            } else {
                // Promote existing user to admin
                existing.role = 'admin';
                existing.isActive = true;
                await existing.save({ validateBeforeSave: false });
                console.log(`\n✅ Existing user "${existing.name}" promoted to admin!\n`);
            }
            process.exit(0);
        }

        const admin = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            role: 'admin',
            isEmailVerified: true,
            isActive: true,
        });

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 Admin created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   Name  : ${admin.name}`);
        console.log(`   Email : ${admin.email}`);
        console.log(`   Role  : ${admin.role}`);
        console.log(`   ID    : ${admin._id}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        process.exit(0);
    } catch (err) {
        if (err.code === 11000) {
            console.error('❌ Email already exists.');
        } else {
            console.error('❌ Error:', err.message);
        }
        process.exit(1);
    } finally {
        rl.close();
    }
};

createAdmin();
