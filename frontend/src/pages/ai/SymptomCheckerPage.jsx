import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FaRobot, FaPaperPlane, FaUserMd, FaExclamationTriangle,
    FaStethoscope, FaMicrophone, FaMicrophoneSlash,
    FaPhoneAlt, FaRedo, FaInfoCircle,
} from 'react-icons/fa';

// ── Re-use the same AI logic from the widget ─────────────────────────────
const SPECIALIST_MAP = [
    { keywords: ['chest pain', 'heart', 'palpitation', 'shortness of breath', 'breathless', 'breathing difficulty', 'irregular heartbeat', 'chest tightness'], specialist: 'Cardiologist', emoji: '❤️', category: 'Cardiology', emergencyKeywords: ['chest pain', 'breathless', 'breathing difficulty'] },
    { keywords: ['skin', 'rash', 'acne', 'itching', 'itch', 'bumps', 'eczema', 'psoriasis', 'hives', 'redness', 'dry skin', 'pimple', 'blister'], specialist: 'Dermatologist', emoji: '🧴', category: 'Dermatology' },
    { keywords: ['headache', 'migraine', 'dizziness', 'nerve', 'numbness', 'seizure', 'memory', 'tremor', 'paralysis', 'fainting', 'unconscious', 'stroke'], specialist: 'Neurologist', emoji: '🧠', category: 'Neurology', emergencyKeywords: ['unconscious', 'seizure', 'stroke', 'paralysis'] },
    { keywords: ['eye', 'vision', 'blur', 'blurry', 'sight', 'cataract', 'glaucoma', 'red eye', 'eye pain'], specialist: 'Ophthalmologist', emoji: '👁️', category: 'Ophthalmology' },
    { keywords: ['ear', 'nose', 'throat', 'hearing', 'tonsil', 'sinus', 'sneezing', 'cold', 'runny nose', 'sore throat', 'hoarse', 'nasal', 'earache'], specialist: 'ENT Specialist', emoji: '👂', category: 'ENT' },
    { keywords: ['bone', 'joint', 'knee', 'back pain', 'spine', 'fracture', 'muscle pain', 'arthritis', 'shoulder', 'hip', 'ankle', 'wrist', 'neck pain'], specialist: 'Orthopedic Surgeon', emoji: '🦴', category: 'Orthopedics' },
    { keywords: ['anxiety', 'depression', 'stress', 'mental', 'mood', 'panic', 'insomnia', 'sleep', 'phobia', 'ocd', 'bipolar', 'hallucination', 'suicidal', 'sad'], specialist: 'Psychiatrist / Psychologist', emoji: '🧘', category: 'Psychiatry', emergencyKeywords: ['suicidal'] },
    { keywords: ['child', 'baby', 'infant', 'toddler', 'kid', 'fever in child', 'vaccination', 'growth', 'pediatric'], specialist: 'Pediatrician', emoji: '👶', category: 'Pediatrics' },
    { keywords: ['stomach', 'abdomen', 'digestion', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'bloating', 'acid reflux', 'ulcer', 'liver', 'gastric'], specialist: 'Gastroenterologist', emoji: '🫁', category: 'Gastroenterology' },
    { keywords: ['diabetes', 'thyroid', 'hormone', 'weight gain', 'weight loss', 'fatigue', 'sugar', 'insulin'], specialist: 'Endocrinologist', emoji: '⚗️', category: 'Endocrinology' },
    { keywords: ['urine', 'kidney', 'bladder', 'urinary', 'prostate', 'uti', 'burning urination', 'blood in urine'], specialist: 'Urologist', emoji: '🫘', category: 'Urology' },
    { keywords: ['pregnancy', 'period', 'menstrual', 'ovary', 'uterus', 'vaginal', 'pcos', 'fertility', 'breast pain', 'menopause'], specialist: 'Gynecologist', emoji: '🌸', category: 'Gynecology' },
    { keywords: ['lung', 'cough', 'asthma', 'tuberculosis', 'tb', 'pneumonia', 'wheezing', 'mucus', 'phlegm', 'respiratory'], specialist: 'Pulmonologist', emoji: '🫁', category: 'Pulmonology' },
];

const EMERGENCY_PHRASES = ['chest pain', 'heart attack', 'unconscious', 'not breathing', 'stroke', 'severe bleeding', 'suicidal', 'overdose', 'seizure', 'paralysis', "can't breathe", 'difficulty breathing'];

const FOLLOW_UP_QUESTIONS = [
    'How long have you had these symptoms? (e.g. 2 days, 1 week)',
    'On a scale of 1–10, how would you rate your pain or discomfort?',
    'Do you have a fever? If yes, what is your temperature?',
    'Any other symptoms like nausea, vomiting, or skin changes?',
];

const analyzeSymptoms = (text) => {
    const lower = text.toLowerCase();
    const isEmergency = EMERGENCY_PHRASES.some((p) => lower.includes(p));
    const matches = SPECIALIST_MAP
        .map((e) => ({ ...e, matchCount: e.keywords.filter((k) => lower.includes(k)).length }))
        .filter((e) => e.matchCount > 0)
        .sort((a, b) => b.matchCount - a.matchCount)
        .slice(0, 3);
    return { isEmergency, matches };
};

const QUICK_SYMPTOMS = [
    { label: '😷 Fever & Cold', value: 'I have fever and cold symptoms' },
    { label: '🤕 Headache', value: 'I have a severe headache and dizziness' },
    { label: '💔 Chest Pain', value: 'I have chest pain and shortness of breath' },
    { label: '🦴 Joint Pain', value: 'I have joint and bone pain' },
    { label: '🧴 Skin Rash', value: 'I have skin rash and itching' },
    { label: '😰 Anxiety', value: 'I have anxiety and stress' },
    { label: '👁️ Eye Problem', value: 'I have eye pain and blurry vision' },
    { label: '👂 Ear Pain', value: 'I have ear pain and hearing issues' },
    { label: '🤢 Stomach Pain', value: 'I have stomach pain and nausea' },
    { label: '🫁 Cough', value: 'I have persistent cough and breathing issues' },
];

const SymptomCheckerPage = () => {
    const [messages, setMessages] = useState([
        { role: 'bot', type: 'greeting', text: "Hi there! 👋 I'm your AI Health Assistant.\n\nDescribe your symptoms and I'll suggest the right specialist for you. Remember, this is not a medical diagnosis — always consult a qualified doctor." },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [step, setStep] = useState('initial');
    const [savedMatches, setSavedMatches] = useState([]);
    const [followUpIdx, setFollowUpIdx] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SR();
            recognitionRef.current.lang = 'en-IN';
            recognitionRef.current.onresult = (e) => { setInput(e.results[0][0].transcript); setIsListening(false); };
            recognitionRef.current.onerror = () => setIsListening(false);
            recognitionRef.current.onend = () => setIsListening(false);
        }
    }, []);

    const addBotMessage = (msg) => {
        setMessages((prev) => [...prev, { role: 'bot', ...msg }]);
    };

    const sendMessage = (text) => {
        const trimmed = (text || input).trim();
        if (!trimmed) return;
        setMessages((prev) => [...prev, { role: 'user', type: 'text', text: trimmed }]);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            setIsTyping(false);
            const lower = trimmed.toLowerCase();
            const isEmergency = EMERGENCY_PHRASES.some((p) => lower.includes(p));

            if (isEmergency) {
                addBotMessage({ type: 'emergency', text: '🚨 EMERGENCY! Your symptoms sound serious. Please call emergency services (112 / 911) immediately or go to the nearest emergency room!' });
                setStep('done');
                return;
            }

            if (step === 'initial' || step === 'done') {
                const { matches } = analyzeSymptoms(trimmed);
                if (matches.length === 0) {
                    addBotMessage({ type: 'text', text: 'Could you describe your symptoms in more detail? For example: "I have a headache and fever since 2 days."' });
                    return;
                }
                setSavedMatches(matches);
                setFollowUpIdx(0);
                addBotMessage({ type: 'text', text: `I understand. Let me ask a few quick questions.\n\n${FOLLOW_UP_QUESTIONS[0]}` });
                setStep('followup');
            } else if (step === 'followup') {
                const nextIdx = followUpIdx + 1;
                if (nextIdx < FOLLOW_UP_QUESTIONS.length) {
                    setFollowUpIdx(nextIdx);
                    addBotMessage({ type: 'text', text: FOLLOW_UP_QUESTIONS[nextIdx] });
                } else {
                    addBotMessage({ type: 'recommendation', matches: savedMatches });
                    setStep('done');
                }
            }
        }, 700 + Math.random() * 500);
    };

    const handleReset = () => {
        setMessages([{ role: 'bot', type: 'greeting', text: "Hi again! 👋 Tell me your symptoms and I'll help you find the right doctor." }]);
        setStep('initial');
        setSavedMatches([]);
        setFollowUpIdx(0);
        setInput('');
    };

    const toggleVoice = () => {
        if (!recognitionRef.current) return;
        if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
        else { recognitionRef.current.start(); setIsListening(true); }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Page header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
                    <FaStethoscope className="text-white text-3xl" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">AI Symptom Checker</h1>
                <p className="text-gray-500 mt-2 max-w-xl mx-auto">
                    Describe your symptoms and our AI will suggest the right specialist. Always consult a qualified doctor for diagnosis.
                </p>
                <div className="inline-flex items-center gap-2 mt-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-1.5 rounded-full">
                    <FaInfoCircle /> Not a substitute for professional medical advice
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chat area */}
                <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" style={{ height: '600px' }}>
                    {/* Chat header */}
                    <div className="flex items-center justify-between px-5 py-3 bg-blue-600 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                                <FaRobot className="text-white" />
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm">AI Health Assistant</p>
                                <p className="text-blue-200 text-xs">Powered by symptom analysis</p>
                            </div>
                        </div>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <FaRedo className="text-xs" /> New Chat
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 space-y-3">
                        {messages.map((msg, i) => {
                            if (msg.role === 'user') {
                                return (
                                    <div key={i} className="flex justify-end">
                                        <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[75%] text-sm">
                                            {msg.text}
                                        </div>
                                    </div>
                                );
                            }

                            if (msg.type === 'emergency') {
                                return (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                                            <FaExclamationTriangle className="text-white text-sm" />
                                        </div>
                                        <div className="bg-red-50 border border-red-300 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
                                            <p className="text-red-700 font-semibold text-sm">{msg.text}</p>
                                            <a href="tel:112" className="mt-2 inline-flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-lg">
                                                <FaPhoneAlt /> Call Emergency: 112
                                            </a>
                                        </div>
                                    </div>
                                );
                            }

                            if (msg.type === 'recommendation') {
                                return (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                            <FaRobot className="text-white text-sm" />
                                        </div>
                                        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-4 max-w-[85%] shadow-sm space-y-3">
                                            <p className="text-sm font-semibold text-gray-800">Based on your symptoms, I recommend:</p>
                                            {msg.matches.map((m, j) => (
                                                <div key={j} className={`p-3 rounded-xl border ${j === 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-2xl">{m.emoji}</span>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 text-sm">{m.specialist}</p>
                                                            <p className="text-xs text-gray-500">{m.category}</p>
                                                        </div>
                                                        {j === 0 && <span className="ml-auto text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Best Match</span>}
                                                    </div>
                                                    <Link
                                                        to={`/doctors?category=${m.category}`}
                                                        className="inline-flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition-colors mt-1"
                                                    >
                                                        <FaUserMd /> Find {m.specialist}
                                                    </Link>
                                                </div>
                                            ))}
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5">
                                                <p className="text-xs text-yellow-800">
                                                    ⚠️ <strong>Disclaimer:</strong> This is not a medical diagnosis. Please consult a qualified doctor for proper treatment and diagnosis.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={i} className="flex gap-3">
                                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                        <FaRobot className="text-white text-sm" />
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-2.5 max-w-[80%] shadow-sm text-sm text-gray-700">
                                        {msg.text?.split('\n').map((line, li) => <p key={li} className={li > 0 ? 'mt-1' : ''}>{line}</p>)}
                                    </div>
                                </div>
                            );
                        })}

                        {isTyping && (
                            <div className="flex gap-3">
                                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                    <FaRobot className="text-white text-sm" />
                                </div>
                                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                                    <div className="flex gap-1 items-center h-4">
                                        {[0, 150, 300].map((d) => (
                                            <span key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
                        <div className="flex gap-2 items-center bg-gray-100 rounded-xl px-4 py-2.5">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Describe your symptoms..."
                                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                            />
                            {recognitionRef.current && (
                                <button
                                    onClick={toggleVoice}
                                    className={`text-sm transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-blue-600'}`}
                                    aria-label="Voice input"
                                >
                                    {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
                                </button>
                            )}
                            <button
                                onClick={() => sendMessage()}
                                disabled={!input.trim()}
                                className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                                aria-label="Send"
                            >
                                <FaPaperPlane className="text-xs" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar: quick symptoms + info */}
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                        <h3 className="font-semibold text-gray-800 mb-3 text-sm">Quick Symptom Select</h3>
                        <div className="space-y-2">
                            {QUICK_SYMPTOMS.map((s) => (
                                <button
                                    key={s.label}
                                    onClick={() => sendMessage(s.value)}
                                    className="w-full text-left text-sm bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 hover:border-blue-200 px-3 py-2 rounded-xl transition-all"
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FaExclamationTriangle className="text-red-500" />
                            <h3 className="font-semibold text-red-700 text-sm">Emergency?</h3>
                        </div>
                        <p className="text-xs text-red-600 mb-3">If you have chest pain, difficulty breathing, or are unconscious — call emergency immediately.</p>
                        <a href="tel:112" className="flex items-center justify-center gap-2 bg-red-600 text-white text-sm font-bold py-2 rounded-xl w-full hover:bg-red-700 transition-colors">
                            <FaPhoneAlt /> Call 112
                        </a>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                        <h3 className="font-semibold text-blue-800 text-sm mb-2">Find a Doctor</h3>
                        <p className="text-xs text-blue-600 mb-3">Browse verified specialists and book an appointment.</p>
                        <Link to="/doctors" className="flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-medium py-2 rounded-xl w-full hover:bg-blue-700 transition-colors">
                            <FaUserMd /> Browse Doctors
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SymptomCheckerPage;
