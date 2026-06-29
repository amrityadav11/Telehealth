import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    FaRobot, FaTimes, FaPaperPlane, FaUserMd, FaExclamationTriangle,
    FaStethoscope, FaMicrophone, FaMicrophoneSlash,
    FaPhoneAlt, FaChevronDown, FaChevronUp, FaRedo,
} from 'react-icons/fa';
import api from '../../services/api';

// ── Quick symptom chips ───────────────────────────────────────────────────
const QUICK_SYMPTOMS = [
    '😷 Fever & Cold',
    '🤕 Headache',
    '💔 Chest Pain',
    '🦴 Joint Pain',
    '🧴 Skin Rash',
    '😰 Anxiety',
    '👁️ Eye Problem',
    '👂 Ear Pain',
];

// ── Detect emergency keywords client-side for instant alert ──────────────
const EMERGENCY_PHRASES = [
    'chest pain', 'heart attack', 'unconscious', 'not breathing', 'stroke',
    'severe bleeding', 'suicidal', 'overdose', 'seizure', 'paralysis',
    "can't breathe", 'difficulty breathing',
];
const isEmergencyText = (text) =>
    EMERGENCY_PHRASES.some((p) => text.toLowerCase().includes(p));

// ── Render markdown-lite: bold (**text**) and newlines ───────────────────
const renderText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
            <p key={i} className={i > 0 ? 'mt-1' : ''}>
                {parts.map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                )}
            </p>
        );
    });
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

    if (!isBot) {
        return (
            <div className="flex justify-end mb-3">
                <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[80%] text-sm">
                    {msg.text}
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <FaRobot className="text-white text-xs" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%] shadow-sm text-sm text-gray-700">
                {renderText(msg.text)}
                {msg.showFindDoctor && (
                    <Link
                        to="/doctors"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        <FaUserMd /> Browse Doctors
                    </Link>
                )}
            </div>
        </div>
    );
};

// ── Main SymptomChecker component ─────────────────────────────────────────
const SymptomChecker = () => {
    const { user, token } = useSelector((s) => s.auth);

    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'bot',
            type: 'text',
            text: "Hi there! 👋 I'm your AI Health Assistant powered by Gemini.\n\nTell me what symptoms you're experiencing and I'll help suggest the right specialist for you.",
        },
    ]);
    // Gemini multi-turn history (role: 'user' | 'model')
    const [chatHistory, setChatHistory] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Voice recognition setup
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-IN';
            recognitionRef.current.onresult = (e) => {
                setInput(e.results[0][0].transcript);
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

    const sendMessage = async (text) => {
        const trimmed = (text || input).trim();
        if (!trimmed || isLoading) return;

        // Add user message to UI
        setMessages((prev) => [...prev, { role: 'user', type: 'text', text: trimmed }]);
        setInput('');
        setIsLoading(true);

        // Client-side emergency fast-path
        if (isEmergencyText(trimmed)) {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'bot',
                    type: 'emergency',
                    text: '🚨 EMERGENCY ALERT! Your symptoms sound serious. Please call emergency services (112 / 911) immediately or go to the nearest emergency room. Do not wait!',
                },
            ]);
            setIsLoading(false);
            return;
        }

        // If not logged in, fall back to a helpful message
        if (!token) {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'bot',
                    type: 'text',
                    text: 'Please log in to use the AI symptom checker. It helps me give you personalised health guidance.',
                    showFindDoctor: false,
                },
            ]);
            setIsLoading(false);
            return;
        }

        try {
            const { data } = await api.post('/ai/symptom-check', {
                messages: chatHistory,
                userMessage: trimmed,
            });

            const replyText = data.reply || 'Sorry, I could not process that. Please try again.';

            // Update chat history for next turn (Groq format)
            setChatHistory((prev) => [
                ...prev,
                { role: 'user', content: trimmed },
                { role: 'assistant', content: replyText },
            ]);

            // Detect if reply mentions finding a doctor
            const showFindDoctor =
                replyText.toLowerCase().includes('specialist') ||
                replyText.toLowerCase().includes('doctor') ||
                replyText.toLowerCase().includes('consult');

            setMessages((prev) => [
                ...prev,
                { role: 'bot', type: 'text', text: replyText, showFindDoctor },
            ]);
        } catch (err) {
            const errMsg =
                err.response?.data?.message ||
                'Something went wrong. Please try again in a moment.';
            setMessages((prev) => [
                ...prev,
                { role: 'bot', type: 'text', text: `⚠️ ${errMsg}` },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickSymptom = (symptom) => {
        const clean = symptom.replace(/^[^\w]+/, '').trim();
        sendMessage(clean);
    };

    const handleReset = () => {
        setMessages([
            {
                role: 'bot',
                type: 'text',
                text: "Hi again! 👋 Tell me your symptoms and I'll help you find the right doctor.",
            },
        ]);
        setChatHistory([]);
        setInput('');
    };

    // Floating button when closed
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
        <div
            className={`fixed bottom-6 right-6 z-50 w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all ${isMinimized ? 'h-14' : 'h-[560px]'
                }`}
        >
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
                            Gemini AI · Not a doctor
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleReset}
                        className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        aria-label="Reset chat"
                        title="New chat"
                    >
                        <FaRedo className="text-xs" />
                    </button>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        aria-label={isMinimized ? 'Expand' : 'Minimize'}
                    >
                        {isMinimized ? (
                            <FaChevronUp className="text-xs" />
                        ) : (
                            <FaChevronDown className="text-xs" />
                        )}
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
                    <div className="flex-1 overflow-y-auto px-3 py-3 bg-gray-50">
                        {messages.map((msg, i) => (
                            <MessageBubble key={i} msg={msg} />
                        ))}

                        {isLoading && (
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
                        <div className="flex gap-2 items-center bg-gray-100 rounded-xl px-3 py-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Describe your symptoms..."
                                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                                disabled={isLoading}
                            />
                            {recognitionRef.current && (
                                <button
                                    onClick={toggleVoice}
                                    className={`text-sm transition-colors ${isListening
                                        ? 'text-red-500 animate-pulse'
                                        : 'text-gray-400 hover:text-blue-600'
                                        }`}
                                    title={isListening ? 'Stop listening' : 'Voice input'}
                                    aria-label="Voice input"
                                >
                                    {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
                                </button>
                            )}
                            <button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || isLoading}
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
