import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    FaUserMd, FaCalendarAlt, FaVideo, FaFileMedical,
    FaStethoscope, FaTimes, FaArrowRight, FaCheckCircle,
} from 'react-icons/fa';

const PATIENT_STEPS = [
    {
        icon: '👋',
        title: 'Welcome to TeleHealth!',
        desc: 'Your health journey starts here. Let us show you around in just a few steps.',
        action: null,
    },
    {
        icon: '🔍',
        title: 'Find the Right Doctor',
        desc: 'Browse 500+ verified specialists. Filter by category, fee, rating, and availability.',
        action: { label: 'Browse Doctors', path: '/doctors' },
    },
    {
        icon: '📅',
        title: 'Book an Appointment',
        desc: 'Pick a date and time that works for you. Get instant confirmation and email reminders.',
        action: { label: 'Book Now', path: '/doctors' },
    },
    {
        icon: '💊',
        title: 'Video Consultation',
        desc: 'Join your HD video call at the scheduled time. Chat, share screen, and get prescriptions.',
        action: null,
    },
    {
        icon: '🩺',
        title: 'AI Symptom Checker',
        desc: 'Not sure which doctor to see? Describe your symptoms and our AI will guide you.',
        action: { label: 'Try AI Checker', path: '/symptom-checker' },
    },
    {
        icon: '📁',
        title: 'Medical Records',
        desc: 'Upload and manage your lab reports, prescriptions, and health documents securely.',
        action: { label: 'View Records', path: '/patient/medical-records' },
    },
];

const DOCTOR_STEPS = [
    {
        icon: '👨‍⚕️',
        title: 'Welcome, Doctor!',
        desc: 'Complete your profile to start receiving appointments from patients.',
        action: null,
    },
    {
        icon: '📝',
        title: 'Complete Your Profile',
        desc: 'Add your specialization, bio, education, and consultation fee to attract patients.',
        action: { label: 'Edit Profile', path: '/doctor/profile' },
    },
    {
        icon: '🗓️',
        title: 'Set Your Availability',
        desc: 'Define your working days and hours so patients can book slots that work for you.',
        action: { label: 'Set Schedule', path: '/doctor/profile' },
    },
    {
        icon: '✅',
        title: 'Get Approved',
        desc: 'Our admin team will review and approve your profile. You\'ll be notified by email.',
        action: null,
    },
    {
        icon: '💰',
        title: 'Track Your Earnings',
        desc: 'View your earnings breakdown, monthly trends, and export reports to Excel.',
        action: { label: 'View Earnings', path: '/doctor/earnings' },
    },
];

const STORAGE_KEY = 'telehealth_onboarding_done';

const OnboardingTour = () => {
    const { user } = useSelector((s) => s.auth);
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (!user) return;
        if (user.role === 'admin') return;
        const done = localStorage.getItem(`${STORAGE_KEY}_${user._id}`);
        if (!done) {
            // Small delay so the page loads first
            const t = setTimeout(() => setVisible(true), 800);
            return () => clearTimeout(t);
        }
    }, [user]);

    if (!visible || !user) return null;

    const steps = user.role === 'doctor' ? DOCTOR_STEPS : PATIENT_STEPS;
    const current = steps[step];
    const isLast = step === steps.length - 1;
    const progress = ((step + 1) / steps.length) * 100;

    const handleDismiss = () => {
        localStorage.setItem(`${STORAGE_KEY}_${user._id}`, 'true');
        setVisible(false);
    };

    const handleNext = () => {
        if (isLast) {
            handleDismiss();
        } else {
            setStep((s) => s + 1);
        }
    };

    const handleAction = () => {
        if (current.action?.path) {
            navigate(current.action.path);
        }
        handleNext();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Progress bar */}
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700">
                    <div
                        className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-2">
                    <span className="text-xs font-medium text-gray-400">
                        Step {step + 1} of {steps.length}
                    </span>
                    <button
                        onClick={handleDismiss}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Skip tour"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 pb-6 text-center">
                    <div className="text-6xl mb-5 mt-2">{current.icon}</div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        {current.title}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                        {current.desc}
                    </p>

                    {/* Step dots */}
                    <div className="flex justify-center gap-2 mb-6">
                        {steps.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setStep(i)}
                                className={`rounded-full transition-all ${i === step
                                    ? 'w-6 h-2 bg-blue-600'
                                    : i < step
                                        ? 'w-2 h-2 bg-blue-300'
                                        : 'w-2 h-2 bg-gray-200 dark:bg-gray-600'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        {current.action ? (
                            <>
                                <button
                                    onClick={handleNext}
                                    className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={handleAction}
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors text-sm flex items-center justify-center gap-2"
                                >
                                    {current.action.label} <FaArrowRight className="text-xs" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                {isLast ? (
                                    <><FaCheckCircle /> Get Started!</>
                                ) : (
                                    <>Next <FaArrowRight className="text-xs" /></>
                                )}
                            </button>
                        )}
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        Don't show this again
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingTour;
