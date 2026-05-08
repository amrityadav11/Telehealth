const path = require('path');
const dotenv = require('dotenv');

// Load .env from backend root regardless of where this script is run from
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        console.error('❌ MONGO_URI not set. Check your .env file.');
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected for seeding');
};

const seedData = async () => {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await Doctor.deleteMany();
    await Appointment.deleteMany();
    console.log('🗑️  Cleared existing data');

    // ── Admin ──────────────────────────────────────────────────────────────
    await User.create({
        name: 'Admin User',
        email: 'admin@telehealth.com',
        password: 'Admin@123',
        role: 'admin',
        isEmailVerified: true,
        isActive: true,
    });
    console.log('✅ Admin created');

    // ── Doctor users ───────────────────────────────────────────────────────
    const doctorUsersRaw = [
        {
            name: 'Dr. Sarah Johnson',
            email: 'sarah@telehealth.com',
            password: await bcrypt.hash('Doctor@123', 12),
            role: 'doctor',
            phone: '+1-555-0101',
            isEmailVerified: true,
            isActive: true,
        },
        {
            name: 'Dr. Michael Chen',
            email: 'michael@telehealth.com',
            password: await bcrypt.hash('Doctor@123', 12),
            role: 'doctor',
            phone: '+1-555-0102',
            isEmailVerified: true,
            isActive: true,
        },
        {
            name: 'Dr. Emily Rodriguez',
            email: 'emily@telehealth.com',
            password: await bcrypt.hash('Doctor@123', 12),
            role: 'doctor',
            phone: '+1-555-0103',
            isEmailVerified: true,
            isActive: true,
        },
        {
            name: 'Dr. James Wilson',
            email: 'james@telehealth.com',
            password: await bcrypt.hash('Doctor@123', 12),
            role: 'doctor',
            phone: '+1-555-0104',
            isEmailVerified: true,
            isActive: true,
        },
    ];

    // Use insertMany with raw hashed passwords (bypass pre-save hook)
    const doctorUsers = await User.insertMany(doctorUsersRaw);
    console.log(`✅ ${doctorUsers.length} doctor users created`);

    // ── Doctor profiles ────────────────────────────────────────────────────
    await Doctor.insertMany([
        {
            user: doctorUsers[0]._id,
            specialization: 'Cardiologist',
            category: 'Cardiology',
            experience: 12,
            consultationFee: 150,
            bio: 'Board-certified cardiologist with 12 years of experience treating heart conditions, hypertension, and coronary artery disease.',
            licenseNumber: 'MD-CA-12345',
            isApproved: true,
            approvedAt: new Date(),
            rating: 4.8,
            numReviews: 45,
            totalAppointments: 120,
            totalEarnings: 18000,
            languages: ['English', 'Spanish'],
            hospitalAffiliation: 'City General Hospital',
            education: [
                { degree: 'MD - Cardiology', institution: 'Harvard Medical School', year: 2010 },
                { degree: 'MBBS', institution: 'Johns Hopkins University', year: 2006 },
            ],
            availability: [
                { day: 'Monday', startTime: '09:00', endTime: '17:00', slotDuration: 30, isAvailable: true },
                { day: 'Wednesday', startTime: '09:00', endTime: '17:00', slotDuration: 30, isAvailable: true },
                { day: 'Friday', startTime: '09:00', endTime: '13:00', slotDuration: 30, isAvailable: true },
            ],
        },
        {
            user: doctorUsers[1]._id,
            specialization: 'Dermatologist',
            category: 'Dermatology',
            experience: 8,
            consultationFee: 120,
            bio: 'Specialist in skin conditions, cosmetic dermatology, and skin cancer screening with 8 years of clinical experience.',
            licenseNumber: 'MD-NY-67890',
            isApproved: true,
            approvedAt: new Date(),
            rating: 4.6,
            numReviews: 32,
            totalAppointments: 85,
            totalEarnings: 10200,
            languages: ['English', 'Mandarin'],
            hospitalAffiliation: 'Metro Skin Clinic',
            education: [
                { degree: 'MD - Dermatology', institution: 'Stanford Medical School', year: 2014 },
            ],
            availability: [
                { day: 'Tuesday', startTime: '10:00', endTime: '18:00', slotDuration: 30, isAvailable: true },
                { day: 'Thursday', startTime: '10:00', endTime: '18:00', slotDuration: 30, isAvailable: true },
                { day: 'Saturday', startTime: '09:00', endTime: '14:00', slotDuration: 30, isAvailable: true },
            ],
        },
        {
            user: doctorUsers[2]._id,
            specialization: 'Neurologist',
            category: 'Neurology',
            experience: 15,
            consultationFee: 200,
            bio: 'Expert in neurological disorders including migraines, epilepsy, and stroke management with 15 years of practice.',
            licenseNumber: 'MD-TX-11223',
            isApproved: true,
            approvedAt: new Date(),
            rating: 4.9,
            numReviews: 67,
            totalAppointments: 200,
            totalEarnings: 40000,
            languages: ['English'],
            hospitalAffiliation: 'NeuroHealth Center',
            education: [
                { degree: 'MD - Neurology', institution: 'Yale School of Medicine', year: 2008 },
            ],
            availability: [
                { day: 'Monday', startTime: '08:00', endTime: '16:00', slotDuration: 45, isAvailable: true },
                { day: 'Tuesday', startTime: '08:00', endTime: '16:00', slotDuration: 45, isAvailable: true },
                { day: 'Thursday', startTime: '08:00', endTime: '16:00', slotDuration: 45, isAvailable: true },
            ],
        },
        {
            user: doctorUsers[3]._id,
            specialization: 'Pediatrician',
            category: 'Pediatrics',
            experience: 10,
            consultationFee: 100,
            bio: 'Dedicated pediatrician providing comprehensive care for children from newborns to adolescents.',
            licenseNumber: 'MD-FL-44556',
            isApproved: true,
            approvedAt: new Date(),
            rating: 4.7,
            numReviews: 55,
            totalAppointments: 150,
            totalEarnings: 15000,
            languages: ['English', 'French'],
            hospitalAffiliation: "Children's Medical Center",
            education: [
                { degree: 'MD - Pediatrics', institution: 'Columbia University', year: 2012 },
            ],
            availability: [
                { day: 'Monday', startTime: '09:00', endTime: '17:00', slotDuration: 30, isAvailable: true },
                { day: 'Wednesday', startTime: '09:00', endTime: '17:00', slotDuration: 30, isAvailable: true },
                { day: 'Friday', startTime: '09:00', endTime: '17:00', slotDuration: 30, isAvailable: true },
            ],
        },
    ]);
    console.log('✅ Doctor profiles created');

    // ── Patients ───────────────────────────────────────────────────────────
    await User.insertMany([
        {
            name: 'John Patient',
            email: 'john@example.com',
            password: await bcrypt.hash('Patient@123', 12),
            role: 'patient',
            phone: '+1-555-0201',
            isEmailVerified: true,
            isActive: true,
        },
        {
            name: 'Jane Smith',
            email: 'jane@example.com',
            password: await bcrypt.hash('Patient@123', 12),
            role: 'patient',
            phone: '+1-555-0202',
            isEmailVerified: true,
            isActive: true,
        },
    ]);
    console.log('✅ Patients created');

    console.log('\n🎉 Seed data inserted successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 TEST CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:    admin@telehealth.com   / Admin@123');
    console.log('Doctor 1: sarah@telehealth.com   / Doctor@123');
    console.log('Doctor 2: michael@telehealth.com / Doctor@123');
    console.log('Doctor 3: emily@telehealth.com   / Doctor@123');
    console.log('Doctor 4: james@telehealth.com   / Doctor@123');
    console.log('Patient:  john@example.com    / Patient@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
};

seedData().catch((err) => {
    console.error('❌ Seeding error:', err.message);
    console.error(err.stack);
    process.exit(1);
});
