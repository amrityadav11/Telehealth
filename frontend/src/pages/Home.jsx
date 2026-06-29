import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
    FaUserMd, FaVideo, FaCalendarCheck, FaShieldAlt, FaStar, FaClock,
    FaLock, FaHeartbeat, FaAward, FaComments, FaMobileAlt, FaFileAlt,
    FaCheckCircle, FaArrowRight, FaQuoteLeft, FaLeaf, FaDumbbell,
    FaBrain, FaVirus, FaHeart, FaEye,
} from 'react-icons/fa';

const FEATURES = [
    {
        icon: FaUserMd,
        title: 'Expert Doctors',
        desc: 'Board-certified specialists across 15+ medical categories, all verified and approved.',
        color: 'bg-blue-100 text-blue-600',
    },
    {
        icon: FaVideo,
        title: 'HD Video Consultations',
        desc: 'Crystal-clear video calls with real-time in-call chat from any device, anywhere.',
        color: 'bg-purple-100 text-purple-600',
    },
    {
        icon: FaCalendarCheck,
        title: 'Easy Scheduling',
        desc: 'Book appointments in seconds with instant confirmation and automated reminders.',
        color: 'bg-green-100 text-green-600',
    },
    {
        icon: FaShieldAlt,
        title: 'HIPAA Compliant',
        desc: 'Your health data is protected with end-to-end encryption and strict privacy controls.',
        color: 'bg-red-100 text-red-600',
    },
    {
        icon: FaHeartbeat,
        title: 'AI Symptom Checker',
        desc: 'Describe your symptoms and our AI instantly recommends the right specialist for you.',
        color: 'bg-pink-100 text-pink-600',
    },
    {
        icon: FaFileAlt,
        title: 'Digital Medical Records',
        desc: 'Access prescriptions, lab results, and your full medical history anytime, anywhere.',
        color: 'bg-yellow-100 text-yellow-600',
    },
];

const STATS = [
    { value: '500+', label: 'Verified Doctors', icon: '👨‍⚕️' },
    { value: '50K+', label: 'Patients Served', icon: '🏥' },
    { value: '15+', label: 'Specializations', icon: '🩺' },
    { value: '4.9', label: 'Average Rating', icon: '⭐' },
];

const CATEGORIES = [
    { name: 'Cardiology', emoji: '❤️' },
    { name: 'Neurology', emoji: '🧠' },
    { name: 'Orthopedics', emoji: '🦴' },
    { name: 'Pediatrics', emoji: '👶' },
    { name: 'Dermatology', emoji: '🧴' },
    { name: 'Ophthalmology', emoji: '👁️' },
    { name: 'Psychiatry', emoji: '🧘' },
    { name: 'Pulmonology', emoji: '🫁' },
    { name: 'Endocrinology', emoji: '⚗️' },
    { name: 'ENT', emoji: '👂' },
    { name: 'Gynecology', emoji: '🌸' },
    { name: 'Urology', emoji: '🫘' },
];

const TESTIMONIALS = [
    {
        name: 'Sarah Johnson',
        role: 'Patient',
        avatar: 'SJ',
        rating: 5,
        text: 'TeleHealth made it so easy to consult a cardiologist from home. The video quality was excellent and the doctor was incredibly thorough. Highly recommend!',
        specialty: 'Cardiology',
    },
    {
        name: 'Michael Chen',
        role: 'Patient',
        avatar: 'MC',
        rating: 5,
        text: 'I was skeptical about online consultations, but TeleHealth changed my mind. Got a dermatology consultation within hours. The AI symptom checker pointed me to exactly the right specialist.',
        specialty: 'Dermatology',
    },
    {
        name: 'Priya Sharma',
        role: 'Patient',
        avatar: 'PS',
        rating: 5,
        text: 'As a busy mom, TeleHealth is a lifesaver. Booked a pediatric consultation for my son at midnight and got expert advice within the hour. The platform is intuitive and secure.',
        specialty: 'Pediatrics',
    },
];

const FEATURED_DOCTORS = [
    { name: 'Dr. Emily Carter', specialty: 'Cardiologist', rating: 4.9, reviews: 128, exp: 12, initials: 'EC' },
    { name: 'Dr. James Wilson', specialty: 'Neurologist', rating: 4.8, reviews: 94, exp: 15, initials: 'JW' },
    { name: 'Dr. Aisha Patel', specialty: 'Pediatrician', rating: 5.0, reviews: 203, exp: 8, initials: 'AP' },
];

const ARTICLE_CATEGORY_META = {
    Diet: { icon: FaLeaf, color: 'bg-green-100 text-green-700', badge: 'bg-green-600' },
    Fitness: { icon: FaDumbbell, color: 'bg-orange-100 text-orange-700', badge: 'bg-orange-500' },
    'Mental Health': { icon: FaBrain, color: 'bg-purple-100 text-purple-700', badge: 'bg-purple-600' },
    Diseases: { icon: FaVirus, color: 'bg-red-100 text-red-700', badge: 'bg-red-600' },
    Lifestyle: { icon: FaHeart, color: 'bg-pink-100 text-pink-700', badge: 'bg-pink-600' },
    General: { icon: FaStar, color: 'bg-blue-100 text-blue-700', badge: 'bg-blue-600' },
};

const COVER_FALLBACKS = {
    Diet: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
    Fitness: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
    'Mental Health': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80',
    Diseases: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
    Lifestyle: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80',
    General: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80',
};

const Home = () => {
    const [animatedStats, setAnimatedStats] = useState(false);
    const [articles, setArticles] = useState([]);
    const [articleModal, setArticleModal] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setAnimatedStats(true), 300);
        return () => clearTimeout(timer);
    }, []);

    // Fetch latest 6 published articles for the home page
    useEffect(() => {
        api.get('/articles', { params: { limit: 6, page: 1 } })
            .then(({ data }) => setArticles(data.articles || []))
            .catch(() => { }); // silently fail — home page still works without articles
    }, []);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">

            {/* ── Hero Section ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white py-24 px-4">
                {/* Animated background blobs */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />

                <div className="relative max-w-6xl mx-auto text-center">
                    {/* Trust badges */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                        <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                            <FaShieldAlt className="text-green-400" /> HIPAA Compliant
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                            <FaLock className="text-yellow-400" /> SSL Encrypted
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                            <FaClock className="text-blue-300" /> 24/7 Available
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                            <FaAward className="text-orange-400" /> Verified Doctors
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
                        Healthcare at Your
                        <span className="text-yellow-300 block md:inline"> Fingertips</span>
                    </h1>
                    <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Connect with top verified doctors instantly. Book appointments, get HD video consultations, and manage your health — all in one secure place.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/doctors"
                            className="group bg-white text-blue-600 font-bold py-4 px-8 rounded-2xl hover:bg-blue-50 transition-all text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                            <FaUserMd /> Find a Doctor
                            <FaArrowRight className="group-hover:translate-x-1 transition-transform text-sm" />
                        </Link>
                        <Link
                            to="/symptom-checker"
                            className="group bg-green-400 text-gray-900 font-bold py-4 px-8 rounded-2xl hover:bg-green-300 transition-all text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                            🩺 AI Symptom Checker
                        </Link>
                        <Link
                            to="/register"
                            className="group bg-yellow-400 text-gray-900 font-bold py-4 px-8 rounded-2xl hover:bg-yellow-300 transition-all text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                            Get Started Free
                            <FaArrowRight className="group-hover:translate-x-1 transition-transform text-sm" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Live Stats Bar ────────────────────────────────────────────── */}
            <section className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 py-10 shadow-sm">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {STATS.map((stat) => (
                            <div
                                key={stat.label}
                                className={`text-center transition-all duration-700 ${animatedStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                            >
                                <div className="text-3xl mb-1">{stat.icon}</div>
                                <div className="text-3xl md:text-4xl font-extrabold text-blue-600 dark:text-blue-400">{stat.value}</div>
                                <div className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Why Choose Us ─────────────────────────────────────────────── */}
            <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm uppercase tracking-wider">Why TeleHealth</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
                            Everything You Need for Better Health
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-xl mx-auto">
                            We combine cutting-edge technology with compassionate care to deliver a healthcare experience like no other.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {FEATURES.map(({ icon: Icon, title, desc, color }) => (
                            <div
                                key={title}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100 dark:border-gray-700 group"
                            >
                                <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon className="text-2xl" />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Specialization Categories ─────────────────────────────────── */}
            <section className="py-20 px-4 bg-white dark:bg-gray-800">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm uppercase tracking-wider">Specializations</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
                            Browse by Specialization
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-3">Find the right specialist for your specific health needs</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {CATEGORIES.map(({ name, emoji }) => (
                            <Link
                                key={name}
                                to={`/doctors?category=${name}`}
                                className="group flex flex-col items-center p-4 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-center hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:border-blue-500 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                            >
                                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{emoji}</span>
                                <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-xs leading-tight">{name}</span>
                            </Link>
                        ))}
                    </div>
                    <div className="text-center mt-10">
                        <Link
                            to="/doctors"
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors shadow-md hover:shadow-lg"
                        >
                            View All Doctors <FaArrowRight />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── How It Works ──────────────────────────────────────────────── */}
            <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm uppercase tracking-wider">Simple Process</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">How It Works</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-3">Get expert medical care in 3 simple steps</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Connector line (desktop) */}
                        <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-blue-200 dark:bg-blue-800" />
                        {[
                            {
                                step: '1',
                                title: 'Find a Doctor',
                                desc: 'Search by specialty, category, or name. Filter by fees, ratings, and availability.',
                                icon: '🔍',
                            },
                            {
                                step: '2',
                                title: 'Book a Slot',
                                desc: 'Choose a convenient date and time from the doctor\'s real-time availability calendar.',
                                icon: '📅',
                            },
                            {
                                step: '3',
                                title: 'Start Consultation',
                                desc: 'Join the HD video call at your scheduled time and receive expert medical care.',
                                icon: '💊',
                            },
                        ].map(({ step, title, desc, icon }) => (
                            <div key={step} className="text-center relative">
                                <div className="relative inline-block mb-6">
                                    <div className="w-20 h-20 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-200 dark:shadow-blue-900">
                                        <span className="text-3xl">{icon}</span>
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 text-gray-900 rounded-full flex items-center justify-center text-sm font-extrabold shadow">
                                        {step}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Testimonials ──────────────────────────────────────────────── */}
            <section className="py-20 px-4 bg-white dark:bg-gray-900">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm uppercase tracking-wider">Patient Stories</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
                            What Our Patients Say
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-3">Real experiences from real patients</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {TESTIMONIALS.map((t) => (
                            <div
                                key={t.name}
                                className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                            >
                                <FaQuoteLeft className="text-blue-200 dark:text-blue-800 text-3xl mb-4" />
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-5">{t.text}</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                                        <p className="text-gray-400 text-xs">{t.specialty} Patient</p>
                                    </div>
                                    <div className="ml-auto flex gap-0.5">
                                        {Array.from({ length: t.rating }).map((_, i) => (
                                            <FaStar key={i} className="text-yellow-400 text-xs" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Health Hub Section ────────────────────────────────────── */}
            {articles.length > 0 && (
                <section className="py-20 px-4 bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <span className="text-green-600 dark:text-green-400 font-semibold text-sm uppercase tracking-wider">Health Hub</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
                                🌿 Daily Health Tips & Articles
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-xl mx-auto">
                                Expert-curated health articles on diet, fitness, mental wellness, and disease awareness — updated regularly.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {articles.map((article) => {
                                const meta = ARTICLE_CATEGORY_META[article.category] || ARTICLE_CATEGORY_META.General;
                                const Icon = meta.icon;
                                const cover = article.coverImage?.url || COVER_FALLBACKS[article.category] || COVER_FALLBACKS.General;
                                return (
                                    <button
                                        key={article._id}
                                        onClick={() => setArticleModal(article)}
                                        className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left group flex flex-col"
                                    >
                                        {/* Cover */}
                                        <div className="relative h-44 overflow-hidden flex-shrink-0">
                                            <img
                                                src={cover}
                                                alt={article.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => { e.target.src = COVER_FALLBACKS.General; }}
                                            />
                                            <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full text-white ${meta.badge}`}>
                                                {article.category}
                                            </span>
                                        </div>
                                        {/* Body */}
                                        <div className="p-5 flex flex-col flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                                                    <Icon className="text-xs" />
                                                </div>
                                                <span className={`text-xs font-medium ${meta.color.split(' ')[1]}`}>{article.category}</span>
                                            </div>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug mb-2 line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                                                {article.title}
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed line-clamp-2 flex-1">
                                                {article.summary}
                                            </p>
                                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                                    <FaClock className="text-xs" />
                                                    <span>{article.readTime} min read</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                                    <FaEye className="text-xs" />
                                                    <span>{article.views || 0} views</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="text-center mt-10">
                            <Link
                                to="/health-hub"
                                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors shadow-md hover:shadow-lg"
                            >
                                🌿 Read All Articles <FaArrowRight />
                            </Link>
                        </div>
                    </div>

                    {/* Article Quick-View Modal */}
                    {articleModal && (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                            onClick={() => setArticleModal(null)}
                        >
                            <div
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Cover */}
                                <div className="relative h-48 overflow-hidden rounded-t-2xl flex-shrink-0">
                                    <img
                                        src={articleModal.coverImage?.url || COVER_FALLBACKS[articleModal.category] || COVER_FALLBACKS.General}
                                        alt={articleModal.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = COVER_FALLBACKS.General; }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                    <button
                                        onClick={() => setArticleModal(null)}
                                        className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-lg font-bold transition-colors"
                                        aria-label="Close"
                                    >
                                        ×
                                    </button>
                                    <div className="absolute bottom-4 left-4 right-12">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full text-white mb-2 inline-block ${(ARTICLE_CATEGORY_META[articleModal.category] || ARTICLE_CATEGORY_META.General).badge}`}>
                                            {articleModal.category}
                                        </span>
                                        <h2 className="text-white font-bold text-lg leading-tight">{articleModal.title}</h2>
                                    </div>
                                </div>
                                {/* Meta */}
                                <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><FaClock /> {articleModal.readTime} min read</span>
                                    <span className="flex items-center gap-1"><FaEye /> {articleModal.views} views</span>
                                </div>
                                {/* Summary */}
                                <div className="px-6 pt-4 pb-2">
                                    <p className="text-gray-600 dark:text-gray-300 text-sm italic border-l-4 border-green-400 pl-3">{articleModal.summary}</p>
                                </div>
                                {/* Content preview — first 600 chars */}
                                <div className="px-6 pb-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {articleModal.content?.slice(0, 600)}{articleModal.content?.length > 600 ? '...' : ''}
                                </div>
                                {/* CTA */}
                                <div className="px-6 pb-6 flex gap-3">
                                    <Link
                                        to="/register"
                                        onClick={() => setArticleModal(null)}
                                        className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                                    >
                                        Sign Up to Read More
                                    </Link>
                                    <button
                                        onClick={() => setArticleModal(null)}
                                        className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* ── Doctor Showcase ───────────────────────────────────────────── */}
            <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm uppercase tracking-wider">Our Doctors</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">
                            Meet Our Top Specialists
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-3">Highly qualified doctors ready to help you</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {FEATURED_DOCTORS.map((doc) => (
                            <div
                                key={doc.name}
                                className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center"
                            >
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg">
                                    {doc.initials}
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{doc.name}</h3>
                                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mt-1">{doc.specialty}</p>
                                <div className="flex items-center justify-center gap-1 mt-2">
                                    <FaStar className="text-yellow-400 text-sm" />
                                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{doc.rating}</span>
                                    <span className="text-gray-400 text-xs">({doc.reviews} reviews)</span>
                                </div>
                                <p className="text-gray-400 text-xs mt-1">{doc.exp} years experience</p>
                                <div className="flex items-center justify-center gap-1 mt-3">
                                    <FaCheckCircle className="text-blue-500 text-xs" />
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Verified Doctor</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-10">
                        <Link
                            to="/doctors"
                            className="inline-flex items-center gap-2 border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold py-3 px-8 rounded-xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all"
                        >
                            View All Doctors <FaArrowRight />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── CTA Banner ────────────────────────────────────────────────── */}
            <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
                </div>
                <div className="relative max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to Take Control of Your Health?</h2>
                    <p className="text-blue-100 mb-8 text-lg leading-relaxed">
                        Join over 50,000 patients who trust TeleHealth for expert medical care. Sign up free today — no credit card required.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/register"
                            className="bg-white text-blue-600 font-bold py-4 px-10 rounded-2xl hover:bg-blue-50 transition-all text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 inline-flex items-center gap-2"
                        >
                            Create Free Account <FaArrowRight />
                        </Link>
                        <Link
                            to="/doctors"
                            className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-bold py-4 px-10 rounded-2xl hover:bg-white/20 transition-all text-lg inline-flex items-center gap-2"
                        >
                            Browse Doctors
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <footer className="bg-gray-900 dark:bg-black text-gray-400 py-12 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <h3 className="text-white font-bold text-lg mb-3">TeleHealth</h3>
                            <p className="text-sm leading-relaxed">Your trusted platform for online medical consultations with verified specialists.</p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-3">For Patients</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/doctors" className="hover:text-white transition-colors">Find Doctors</Link></li>
                                <li><Link to="/symptom-checker" className="hover:text-white transition-colors">Symptom Checker</Link></li>
                                <li><Link to="/patient/health-hub" className="hover:text-white transition-colors">Health Hub</Link></li>
                                <li><Link to="/register" className="hover:text-white transition-colors">Sign Up Free</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-3">Specializations</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/doctors?category=Cardiology" className="hover:text-white transition-colors">Cardiology</Link></li>
                                <li><Link to="/doctors?category=Neurology" className="hover:text-white transition-colors">Neurology</Link></li>
                                <li><Link to="/doctors?category=Pediatrics" className="hover:text-white transition-colors">Pediatrics</Link></li>
                                <li><Link to="/doctors?category=Dermatology" className="hover:text-white transition-colors">Dermatology</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-3">Trust & Safety</h4>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2"><FaShieldAlt className="text-green-400" /> HIPAA Compliant</li>
                                <li className="flex items-center gap-2"><FaLock className="text-yellow-400" /> SSL Encrypted</li>
                                <li className="flex items-center gap-2"><FaCheckCircle className="text-blue-400" /> Verified Doctors</li>
                                <li className="flex items-center gap-2"><FaClock className="text-purple-400" /> 24/7 Support</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-6 text-center text-sm">
                        <p>&copy; {new Date().getFullYear()} TeleHealth. All rights reserved. Built with care for better health.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
