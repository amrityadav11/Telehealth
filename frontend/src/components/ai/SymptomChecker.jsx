import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FaRobot, FaTimes, FaPaperPlane, FaUserMd, FaExclamationTriangle,
    FaStethoscope, FaMicrophone, FaMicrophoneSlash, FaMapMarkerAlt,
    FaPhoneAlt, FaChevronDown, FaChevronUp,
} from 'react-icons/fa';

// ── Symptom → Specialist mapping ──────────────────────────────────────────
const SPECIALIST_MAP = [
    {
        keywords: ['chest pain', 'heart', 'palpitation', 'shortness of breath', 'breathless', 'breathing difficulty', 'irregular heartbeat', 'chest tightness'],
        specialist: 'Cardiologist',
        emoji: '❤️',
        category: 'Cardiology',
        emergency: true,
        emergencyKeywords: ['chest pain', 'heart attack', 'breathless', 'breathing difficulty'],
    },
    {
        keywords: ['skin', 'rash', 'acne', 'itching', 'itch', 'bumps', 'eczema', 'psoriasis', 'hives', 'redness', 'dry skin', 'pimple', 'blister', 'wound'],
        specialist: 'Dermatologist',
        emoji: '🧴',
        category: 'Dermatology',
        emergency: false,
    },
    {
        keywords: ['headache', 'migraine', 'dizziness', 'nerve', 'numbness', 'seizure', 'memory', 'tremor', 'paralysis', 'fainting', 'unconscious', 'stroke'],
        specialist: 'Neurologist',
        emoji: '🧠',
        category: 'Neurology',
        emergency: false,
        emergencyKeywords: ['unconscious', 'seizure', 'stroke', 'paralysis'],
    },
    {
        keywords: ['eye', 'vision', 'blur', 'blurry', 'sight', 'glasses', 'cataract', 'glaucoma', 'red eye', 'eye pain', 'watery eyes'],
        specialist: 'Ophthalmologist',
        emoji: '👁️',
        category: 'Ophthalmology',
        emergency: false,
    },
    {
        keywords: ['ear', 'nose', 'throat', 'hearing', 'tonsil', 'sinus', 'sneezing', 'cold', 'runny nose', 'sore throat', 'hoarse', 'nasal', 'earache', 'tinnitus'],
        specialist: 'ENT Specialist',
        emoji: '👂',
        category: 'ENT',
        emergency: false,
    },
    {
        keywords: ['bone', 'joint', 'knee', 'back pain', 'spine', 'fracture', 'muscle pain', 'arthritis', 'shoulder', 'hip', 'ankle', 'wrist', 'neck pain', 'swollen joint'],
        specialist: 'Orthopedic Surgeon',
        emoji: '🦴',
        category: 'Orthopedics',
        emergency: false,
    },
    {
        keywords: ['anxiety', 'depression', 'stress', 'mental', 'mood', 'panic', 'insomnia', 'sleep', 'phobia', 'ocd', 'bipolar', 'hallucination', 'suicidal', 'sad', 'lonely'],
        specialist: 'Psychiatrist / Psychologist',
        emoji: '🧘',
        category: 'Psychiatry',
        emergency: false,
        emergencyKeywords: ['suicidal'],
    },
    {
        keywords: ['child', 'baby', 'infant', 'toddler', 'kid', 'fever in child', 'vaccination', 'growth', 'pediatric'],
        specialist: 'Pediatrician',
        emoji: '👶',
        category: 'Pediatrics',
        emergency: false,
    },
    {
        keywords: ['stomach', 'abdomen', 'digestion', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'bloating', 'acid reflux', 'ulcer', 'liver', 'gastric', 'bowel'],
        specialist: 'Gastroenterologist',
        emoji: '🫁',
        category: 'Gastroenterology',
        emergency: false,
    },
    {
        keywords: ['diabetes', 'thyroid', 'hormone', 'weight gain', 'weight loss', 'fatigue', 'sugar', 'insulin', 'adrenal', 'pituitary'],
        specialist: 'Endocrinologist',
        emoji: '⚗️',
        category: 'Endocrinology',
        emergency: false,
    },
    {
        keywords: ['urine', 'kidney', 'bladder', 'urinary', 'prostate', 'uti', 'burning urination', 'blood in urine', 'frequent urination'],
        specialist: 'Urologist',
        emoji: '🫘',
        category: 'Urology',
        emergency: false,
    },
    {
        keywords: ['pregnancy', 'period', 'menstrual', 'ovary', 'uterus', 'vaginal', 'gynecology', 'pcos', 'fertility', 'breast pain', 'menopause'],
        specialist: 'Gynecologist',
        emoji: '🌸',
        category: 'Gynecology',
        emergency: false,
    },
    {
        keywords: ['lung', 'cough', 'asthma', 'tuberculosis', 'tb', 'pneumonia', 'wheezing', 'mucus', 'phlegm', 'respiratory'],
        specialist: 'Pulmonologist',
        emoji: '🫁',
        category: 'Pulmonology',
        emergency: false,
        emergencyKeywords: ['severe breathing', 'can\'t breathe'],
    },
];

const EMERGENCY_PHRASES = [
    'chest pain', 'heart attack', 'unconscious', 'not breathing', 'stroke',
    'severe bleeding', 'suicidal', 'overdose', 'seizure', 'paralysis',
    'can\'t breathe', 'difficulty breathing',
];

// ── AI Logic ──────────────────────────────────────────────────────────────
const analyzeSymptoms = (text) => {
    const lower = text.toLowerCase();

    // Check for emergency
    const isEmergency = EMERGENCY_PHRASES.some((phrase) => lower.includes(phrase));

    // Find matching specialists
    const matches = [];
    for (const entry of SPECIALIST_MAP) {
        const matchedKeywords = entry.keywords.filter((kw) => lower.includes(kw));
        if (matchedKeywords.length > 0) {
            matches.push({ ...entry, matchCount: matchedKeywords.length, matchedKeywords });
        }
    }

    // Sort by match count
    matches.sort((a, b) => b.matchCount - a.matchCount);

    return { isEmergency, matches: matches.slice(0, 2) };
};

// ── Conversation flow ─────────────────────────────────────────────────────
const FOLLOW_UP_QUESTIONS = [
    { key: 'duration', question: 'How long have you had these symptoms? (e.g. 2 days, 1 week)' },
    { key: 'pain', question: 'On a scale of 1–10, how would you rate your pain or discomfort?' },
    { key: 'fever', question: 'Do you have a fever? If yes, what is your temperature?' },
    { key: 'other', question: 'Any other symptoms like nausea, vomiting, or skin changes?' },
];

const buildBotResponse = (userText, conversationState) => {
    const lower = userText.toLowerCase();

    // Initial greeting response
    if (conversationState.step === 'initial') {
        const { isEmergency, matches } = analyzeSymptoms(userText);

        if (isEmergency) {
            return {
                type: 'emergency',
                text: '🚨 **EMERGENCY ALERT!** Your symptoms sound serious. Please call emergency services (112 / 911) immediately or go to the nearest emergency room. Do not wait!',
                nextStep: 'done',
            };
        }

        if (matches.length === 0) {
            return {
                type: 'followup',
                text: 'I see. Could you describe your symptoms in a bit more detail? For example, where exactly is the pain or discomfort?',
                nextStep: 'clarify',
            };
        }

        // Store matches and ask follow-up
        return {
            type: 'followup',
            text: `I understand. Let me ask a few quick questions to better understand your condition.\n\n${FOLLOW_UP_QUESTIONS[0].question}`,
            nextStep: 'followup_0',
            matches,
        };
    }

    // Follow-up questions
    if (conversationState.step?.startsWith('followup_')) {
        const idx = parseInt(conversationState.step.split('_')[1]);
        const nextIdx = idx + 1;

        if (nextIdx < FOLLOW_UP_QUESTIONS.length) {
            return {
                type: 'followup',
                text: FOLLOW_UP_QUESTIONS[nextIdx].question,
                nextStep: `followup_${nextIdx}`,
            };
        }

        // All follow-ups done → give recommendation
        return {
            type: 'recommendation',
            text: null, // rendered as component
            nextStep: 'done',
            matches: conversationState.matches,
        };
    }

    // After recommendation — handle new query
    if (conversationState.step === 'done') {
        const { isEmergency, matches } = analyzeSymptoms(userText);
        if (isEmergency) {
            return {
                type: 'emergency',
                text: '🚨 **EMERGENCY!** Please call 112 / 911 immediately!',
                nextStep: 'done',
            };
        }
        if (matches.length > 0) {
            return {
                type: 'followup',
                text: `Got it! Let me ask a few questions.\n\n${FOLLOW_UP_QUESTIONS[0].question}`,
                nextStep: 'followup_0',
                matches,
            };
        }
        return {
            type: 'text',
            text: 'Could you describe your symptoms more clearly? I\'m here to help!',
            nextStep: 'initial',
        };
    }

    // Clarify step
    const { isEmergency, matches } = analyzeSymptoms(userText);
    if (isEmergency) {
        return {
            type: 'emergency',
            text: '🚨 **EMERGENCY!** Please call 112 / 911 immediately!',
            nextStep: 'done',
        };
    }
    if (matches.length > 0) {
        return {
            type: 'followup',
            text: `Thank you! ${FOLLOW_UP_QUESTIONS[0].question}`,
            nextStep: 'followup_0',
            matches,
        };
    }
    return {
        type: 'text',
        text: 'I\'m not sure I understood. Could you describe your main symptom in one sentence?',
        nextStep: 'clarify',
    };
};

// ── Message bubble ────────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
    const isBot = msg.role === 'bot';

    if (msg.type === 'emergency') {
        return (
            <div className="flex gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                    <FaExclamationTriangle className="text-white text-xs" />
                </div>
                <div className="bg-red-50 border border-red-300 rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%]">
                    <p className="text-red-700 font-semibold text-sm">{msg.text}</p>
                    <a
                        href="tel:112"
                        className="mt-2 flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-lg w-fit"
                    >
                        <FaPhoneAlt /> Call Emergency: 112
                    </a>
                </div>
            </div>
        );
    }

    if (msg.type === 'recommendation' && msg.matches) {
        return (
            <div className="flex gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <FaRobot className="text-white text-xs" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 max-w-[90%] shadow-sm">
                    <p className="text-sm text-gray-700 mb-3">
                        Based on your symptoms, here's my recommendation:
                    </p>
                    {msg.matches.map((m, i) => (
                        <div key={i} className={`mb-2 p-3 rounded-xl border ${i === 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">{m.emoji}</span>
                                <span className="font-semibold text-gray-900 text-sm">{m.specialist}</span>
                                {i === 0 && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Best Match</span>}
                            </div>
                            <p className="text-xs text-gray-500">Category: {m.category}</p>
                            <Link
                                to={`/doctors?category=${m.category}`}
                                className="mt-2 inline-flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                                <FaUserMd className="text-xs" /> Find {m.specialist}
                            </Link>
                        </div>
                    ))}
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800">
                            ⚠️ <strong>Disclaimer:</strong> This is not a medical diagnosis. Please consult a qualified doctor for proper treatment.
                        </p>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Do you have any other symptoms to discuss?</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex gap-2 mb-3 ${!isBot ? 'flex-row-reverse' : ''}`}>
            {isBot && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <FaRobot className="text-white text-xs" />
                </div>
            )}
            <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm ${isBot
                    ? 'bg-white border border-gray-200 text-gray-700 rounded-tl-none shadow-sm'
                    : 'bg-blue-600 text-white rounded-tr-none'
                }`}>
                {msg.text?.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
                ))}
            </div>
        </div>
    );
};

// ── Quick symptom chips ───────────────────────────────────────────────────
const QUICK_SYMPTOMS = [
    '😷 Fever & Cold', '🤕 Headache', '💔 Chest Pain', '🦴 Joint Pain',
    '🧴 Skin Rash', '😰 Anxiety', '👁️ Eye Problem', '👂 Ear Pain',
];

// ── Main SymptomChecker component ─────────────────────────────────────────
const SymptomChecker = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'bot',
            type: 'text',
            text: 'Hi there! 👋 I\'m your AI Health Assistant.\n\nPlease tell me what symptoms or health problems you\'re experiencing, and I\'ll help suggest the right specialist for you.',
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [conversationState, setConversationState] = useState({ step: 'initial', matches: [] });
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Voice recognition setup
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-IN';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
            };
            recognitionRef.current.onerror = () => setIsListening(false);
            recognitionRef.current.onend = () => setIsListening(false);
        }
    }, []);

    const toggleVoice = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const sendMessage = (text) => {
        const trimmed = (text || input).trim();
        if (!trimmed) return;

        // Add user message
        setMessages((prev) => [...prev, { role: 'user', type: 'text', text: trimmed }]);
        setInput('');
        setIsTyping(true);

        // Simulate AI thinking delay
        setTimeout(() => {
            const response = buildBotResponse(trimmed, conversationState);

            // Update conversation state
            setConversationState((prev) => ({
                step: response.nextStep,
                matches: response.matches || prev.matches,
            }));

            setMessages((prev) => [...prev, { role: 'bot', ...response }]);
            setIsTyping(false);
        }, 800 + Math.random() * 400);
    };

    const handleQuickSymptom = (symptom) => {
        // Strip emoji prefix
        const clean = symptom.replace(/^[^\w]+/, '').trim();
        sendMessage(clean);
    };

    const handleReset = () => {
        setMessages([
            {
                role: 'bot',
                type: 'text',
                text: 'Hi again! 👋 Tell me your symptoms and I\'ll help you find the right doctor.',
            },
        ]);
        setConversationState({ step: 'initial', matches: [] });
        setInput('');
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 group"
                aria-label="Open AI Health Assistant"
            >
                <FaStethoscope className="text-2xl group-hover:scale-110 transition-transform" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            </button>
        );
    }

    return (
        <div className={`fixed bottom-6 right-6 z-50 w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all ${isMinimized ? 'h-14' : 'h-[560px]'}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-blue-600 rounded-t-2xl flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <FaStethoscope className="text-white text-sm" />
                    </div>
                    <div>
                        <p className="text-white font-semibold text-sm">AI Health Assistant</p>
                        <p className="text-blue-200 text-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                            Online · Not a doctor
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        aria-label={isMinimized ? 'Expand' : 'Minimize'}
                    >
                        {isMinimized ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        aria-label="Close"
                    >
                        <FaTimes className="text-xs" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-3 py-3 bg-gray-50 space-y-1">
                        {messages.map((msg, i) => (
                            <MessageBubble key={i} msg={msg} />
                        ))}

                        {isTyping && (
                            <div className="flex gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                    <FaRobot className="text-white text-xs" />
                                </div>
                                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                                    <div className="flex gap-1 items-center h-4">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick symptoms (only at start) */}
                    {messages.length <= 1 && (
                        <div className="px-3 py-2 border-t border-gray-100 bg-white">
                            <p className="text-xs text-gray-400 mb-2">Quick select:</p>
                            <div className="flex flex-wrap gap-1.5">
                                {QUICK_SYMPTOMS.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => handleQuickSymptom(s)}
                                        className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="px-3 py-3 border-t border-gray-100 bg-white rounded-b-2xl flex-shrink-0">
                        <div className="flex gap-2 items-center">
                            <button
                                onClick={handleReset}
                                className="text-gray-400 hover:text-gray-600 text-xs px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
                                title="Start over"
                            >
                                Reset
                            </button>
                            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
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
                                        title={isListening ? 'Stop listening' : 'Voice input'}
                                        aria-label="Voice input"
                                    >
                                        {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => sendMessage()}
                                disabled={!input.trim()}
                                className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                                aria-label="Send"
                            >
                                <FaPaperPlane className="text-xs" />
                            </button>
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-2">
                            Not a substitute for professional medical advice
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

export default SymptomChecker;
