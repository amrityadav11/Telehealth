import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserMd, FaVideo, FaCalendarCheck, FaShieldAlt, FaStar, FaClock } from 'react-icons/fa';

const features = [
    { icon: FaUserMd, title: 'Expert Doctors', desc: 'Board-certified specialists across 15+ medical categories.' },
    { icon: FaVideo, title: 'Video Consultations', desc: 'HD video calls with real-time chat from anywhere.' },
    { icon: FaCalendarCheck, title: 'Easy Scheduling', desc: 'Book appointments in seconds with instant confirmation.' },
    { icon: FaShieldAlt, title: 'Secure & Private', desc: 'HIPAA-compliant platform with end-to-end encryption.' },
];

const stats = [
    { value: '500+', label: 'Verified Doctors' },
    { value: '50K+', label: 'Patients Served' },
    { value: '15+', label: 'Specializations' },
    { value: '4.9', label: 'Average Rating' },
];

const categories = [
    'Cardiology', 'Dermatology', 'Neurology', 'Orthopedics',
    'Pediatrics', 'Psychiatry', 'Gynecology', 'General Practice',
];

const Home = () => {
    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                        Healthcare at Your
                        <span className="text-yellow-300"> Fingertips</span>
                    </h1>
                    <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                        Connect with top doctors instantly. Book appointments, get consultations, and manage your health — all in one place.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/doctors"
                            className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-xl hover:bg-blue-50 transition-colors text-lg"
                        >
                            Find a Doctor
                        </Link>
                        <Link
                            to="/register"
                            className="bg-yellow-400 text-gray-900 font-semibold py-3 px-8 rounded-xl hover:bg-yellow-300 transition-colors text-lg"
                        >
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="bg-white py-12 border-b">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
                                <div className="text-gray-600 mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-16 px-4 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        Why Choose TeleMed?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="card text-center hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Icon className="text-blue-600 text-2xl" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                                <p className="text-gray-600 text-sm">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
                        Browse by Specialization
                    </h2>
                    <p className="text-center text-gray-600 mb-10">Find the right specialist for your needs</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {categories.map((cat) => (
                            <Link
                                key={cat}
                                to={`/doctors?category=${cat}`}
                                className="p-4 border border-gray-200 rounded-xl text-center hover:border-blue-400 hover:bg-blue-50 transition-all group"
                            >
                                <span className="font-medium text-gray-700 group-hover:text-blue-600">{cat}</span>
                            </Link>
                        ))}
                    </div>
                    <div className="text-center mt-8">
                        <Link to="/doctors" className="btn-primary inline-block">
                            View All Doctors
                        </Link>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-16 px-4 bg-blue-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { step: '01', title: 'Find a Doctor', desc: 'Search by specialty, category, or name. Filter by fees and ratings.' },
                            { step: '02', title: 'Book a Slot', desc: 'Choose a convenient date and time from the doctor\'s availability.' },
                            { step: '03', title: 'Start Consultation', desc: 'Join the video call at your scheduled time and get expert care.' },
                        ].map(({ step, title, desc }) => (
                            <div key={step} className="text-center">
                                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                                    {step}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
                                <p className="text-gray-600">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 px-4 bg-blue-600 text-white text-center">
                <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                <p className="text-blue-100 mb-8 text-lg">Join thousands of patients who trust TeleMed for their healthcare needs.</p>
                <Link to="/register" className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-xl hover:bg-blue-50 transition-colors text-lg inline-block">
                    Create Free Account
                </Link>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center">
                <p>&copy; {new Date().getFullYear()} TeleMed. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Home;
