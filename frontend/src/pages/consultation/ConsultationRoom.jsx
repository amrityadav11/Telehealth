import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { initSocket, getSocket } from '../../services/socket';
import {
    FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash,
    FaPhoneSlash, FaComments, FaTimes, FaPaperPlane,
    FaDesktop, FaWifi, FaUserCircle,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ],
};

const ConsultationRoom = () => {
    const { roomId } = useParams();
    const [searchParams] = useSearchParams();
    const appointmentId = searchParams.get('appointmentId');
    const navigate = useNavigate();

    // Support both Redux store (same-tab) and localStorage (new tab)
    const reduxUser = useSelector((s) => s.auth?.user);
    const user = reduxUser || (() => {
        try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    })();

    // Refs
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    // State
    const [socketReady, setSocketReady] = useState(false);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [remotePeer, setRemotePeer] = useState(null);
    const [callDuration, setCallDuration] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [connectionQuality, setConnectionQuality] = useState('good'); // 'good' | 'fair' | 'poor'
    const screenStreamRef = useRef(null);
    const timerRef = useRef(null);
    const qualityCheckRef = useRef(null);

    // ── Step 1: Ensure socket is connected (works in new tab too) ──────────
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Not authenticated. Please log in again.');
            navigate('/login');
            return;
        }

        // Re-use existing socket or create a new one with the stored token
        let sock = getSocket();
        if (!sock || !sock.connected) {
            sock = initSocket(token);
        }
        socketRef.current = sock;

        if (sock.connected) {
            setSocketReady(true);
        } else {
            sock.once('connect', () => setSocketReady(true));
            sock.once('connect_error', (err) => {
                toast.error('Could not connect to server. Please refresh.');
                console.error('Socket connect error:', err.message);
            });
        }

        return () => {
            // Don't disconnect — the socket may be shared with the main app
        };
    }, [navigate]);

    // ── Step 2: Once socket is ready, set up media + WebRTC ───────────────
    useEffect(() => {
        if (!socketReady) return;

        const socket = socketRef.current;

        const init = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStreamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                socket.emit('join_room', { roomId, appointmentId });
            } catch (err) {
                if (err.name === 'NotAllowedError') {
                    toast.error('Camera/microphone permission denied. Please allow access and refresh.');
                } else {
                    toast.error('Could not access camera/microphone.');
                }
                console.error('Media error:', err);
            }
        };

        init();

        // ── Socket event handlers ──────────────────────────────────────────

        const onExistingPeers = (peers) => {
            if (peers.length > 0) createOffer(peers[0].socketId);
        };

        const onUserJoined = (data) => {
            setRemotePeer(data);
            toast.success(`${data.name} joined the call`);
        };

        const onOffer = async ({ offer, fromSocketId }) => {
            await handleOffer(offer, fromSocketId);
        };

        const onAnswer = async ({ answer }) => {
            if (peerConnectionRef.current) {
                try {
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                } catch (e) {
                    console.error('setRemoteDescription error:', e);
                }
            }
        };

        const onIceCandidate = async ({ candidate }) => {
            if (peerConnectionRef.current && candidate) {
                try {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error('addIceCandidate error:', e);
                }
            }
        };

        const onMessage = (msg) => {
            setMessages((prev) => [...prev, msg]);
            setUnreadMessages((n) => n + 1);
        };

        const onUserLeft = (data) => {
            toast(`${data.name} left the call`, { icon: '👋' });
            setIsConnected(false);
            setRemotePeer(null);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
        };

        socket.on('existing_peers', onExistingPeers);
        socket.on('user_joined', onUserJoined);
        socket.on('webrtc_offer', onOffer);
        socket.on('webrtc_answer', onAnswer);
        socket.on('ice_candidate', onIceCandidate);
        socket.on('receive_message', onMessage);
        socket.on('user_left', onUserLeft);

        // Start call timer
        timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);

        return () => {
            socket.off('existing_peers', onExistingPeers);
            socket.off('user_joined', onUserJoined);
            socket.off('webrtc_offer', onOffer);
            socket.off('webrtc_answer', onAnswer);
            socket.off('ice_candidate', onIceCandidate);
            socket.off('receive_message', onMessage);
            socket.off('user_left', onUserLeft);
            cleanup();
        };
    }, [socketReady, roomId]);

    // Auto-scroll chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Reset unread when chat opens
    useEffect(() => {
        if (isChatOpen) setUnreadMessages(0);
    }, [isChatOpen]);

    const createPeerConnection = (targetSocketId) => {
        // Close any existing connection first
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;
        const socket = socketRef.current;

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        pc.ontrack = (event) => {
            if (remoteVideoRef.current && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0];
                setIsConnected(true);
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit('ice_candidate', { candidate: event.candidate, targetSocketId });
            }
        };

        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            if (state === 'connected') setIsConnected(true);
            if (state === 'disconnected' || state === 'failed') {
                setIsConnected(false);
                toast('Connection lost. Trying to reconnect...', { icon: '⚠️' });
            }
        };

        return pc;
    };

    const createOffer = async (targetSocketId) => {
        const socket = socketRef.current;
        const pc = createPeerConnection(targetSocketId);
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('webrtc_offer', { roomId, offer, targetSocketId });
        } catch (e) {
            console.error('createOffer error:', e);
        }
    };

    const handleOffer = async (offer, fromSocketId) => {
        const socket = socketRef.current;
        const pc = createPeerConnection(fromSocketId);
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc_answer', { answer, targetSocketId: fromSocketId });
        } catch (e) {
            console.error('handleOffer error:', e);
        }
    };

    const toggleAudio = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsAudioEnabled(track.enabled);
                socketRef.current?.emit('toggle_media', { roomId, type: 'audio', enabled: track.enabled });
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getVideoTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsVideoEnabled(track.enabled);
                socketRef.current?.emit('toggle_media', { roomId, type: 'video', enabled: track.enabled });
            }
        }
    };

    const sendMessage = useCallback(() => {
        const text = messageInput.trim();
        if (!text || !socketRef.current) return;
        socketRef.current.emit('send_message', { roomId, message: text, appointmentId });
        setMessageInput('');
    }, [messageInput, roomId, appointmentId]);

    const endCall = () => {
        socketRef.current?.emit('leave_room', { roomId });
        cleanup();
        // Navigate based on role — works in same tab; closes if new tab
        const role = user?.role;
        if (window.opener) {
            window.close();
        } else if (role === 'doctor') {
            navigate('/doctor/appointments');
        } else if (role === 'patient') {
            navigate('/patient/appointments');
        } else {
            navigate('/');
        }
    };

    const cleanup = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((t) => t.stop());
            screenStreamRef.current = null;
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (qualityCheckRef.current) {
            clearInterval(qualityCheckRef.current);
            qualityCheckRef.current = null;
        }
    };

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            // Stop screen sharing, revert to camera
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach((t) => t.stop());
                screenStreamRef.current = null;
            }
            if (localStreamRef.current && peerConnectionRef.current) {
                const videoTrack = localStreamRef.current.getVideoTracks()[0];
                if (videoTrack) {
                    const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
                    if (sender) sender.replaceTrack(videoTrack);
                }
                if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
            }
            setIsScreenSharing(false);
            toast('Screen sharing stopped');
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
                screenStreamRef.current = screenStream;
                const screenTrack = screenStream.getVideoTracks()[0];

                if (peerConnectionRef.current) {
                    const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
                    if (sender) sender.replaceTrack(screenTrack);
                }
                if (localVideoRef.current) {
                    const combined = new MediaStream([screenTrack, ...(localStreamRef.current?.getAudioTracks() || [])]);
                    localVideoRef.current.srcObject = combined;
                }

                screenTrack.onended = () => {
                    setIsScreenSharing(false);
                    if (localStreamRef.current && peerConnectionRef.current) {
                        const videoTrack = localStreamRef.current.getVideoTracks()[0];
                        if (videoTrack) {
                            const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video');
                            if (sender) sender.replaceTrack(videoTrack);
                        }
                        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
                    }
                };

                setIsScreenSharing(true);
                toast.success('Screen sharing started');
            } catch (err) {
                if (err.name !== 'NotAllowedError') {
                    toast.error('Could not start screen sharing');
                }
            }
        }
    };

    // Connection quality check via RTCPeerConnection stats
    useEffect(() => {
        if (!isConnected) return;
        qualityCheckRef.current = setInterval(async () => {
            if (!peerConnectionRef.current) return;
            try {
                const stats = await peerConnectionRef.current.getStats();
                let rtt = null;
                stats.forEach((report) => {
                    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                        rtt = report.currentRoundTripTime;
                    }
                });
                if (rtt !== null) {
                    if (rtt < 0.1) setConnectionQuality('good');
                    else if (rtt < 0.3) setConnectionQuality('fair');
                    else setConnectionQuality('poor');
                }
            } catch (_) { }
        }, 5000);
        return () => {
            if (qualityCheckRef.current) clearInterval(qualityCheckRef.current);
        };
    }, [isConnected]);

    const qualityColor = connectionQuality === 'good' ? 'text-green-400' : connectionQuality === 'fair' ? 'text-yellow-400' : 'text-red-400';
    const qualityBars = connectionQuality === 'good' ? 3 : connectionQuality === 'fair' ? 2 : 1;

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // ── Render ─────────────────────────────────────────────────────────────

    if (!socketReady) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-300">Connecting to server...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <span className="text-white font-medium text-sm">
                        {isConnected
                            ? `Connected with ${remotePeer?.name || 'peer'}`
                            : 'Waiting for other participant...'}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    {/* Session Timer - prominent */}
                    <div className="flex items-center gap-2 bg-gray-700 px-3 py-1.5 rounded-lg">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-white text-sm font-mono font-bold">{formatDuration(callDuration)}</span>
                    </div>
                    {/* Connection Quality Indicator */}
                    {isConnected && (
                        <div className="flex items-center gap-1.5" title={`Connection: ${connectionQuality}`}>
                            <FaWifi className={`text-sm ${qualityColor}`} />
                            <div className="flex gap-0.5 items-end">
                                {[1, 2, 3].map((bar) => (
                                    <div
                                        key={bar}
                                        className={`w-1 rounded-sm transition-colors ${bar <= qualityBars ? qualityColor.replace('text-', 'bg-') : 'bg-gray-600'}`}
                                        style={{ height: `${bar * 4}px` }}
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-gray-400 capitalize hidden sm:block">{connectionQuality}</span>
                        </div>
                    )}
                    <span className="text-gray-500 text-xs hidden sm:block">Room: {roomId.slice(-8)}</span>
                </div>
            </div>

            {/* Video Area */}
            <div className="flex-1 relative p-4 overflow-hidden">
                {/* Remote Video */}
                <div className="relative w-full h-full max-h-[calc(100vh-160px)] rounded-xl overflow-hidden bg-gray-800">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />

                    {/* Waiting Room State */}
                    {!isConnected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
                            <div className="text-center text-white max-w-sm px-6">
                                <div className="relative w-24 h-24 mx-auto mb-6">
                                    <div className="w-24 h-24 bg-blue-600/30 rounded-full flex items-center justify-center">
                                        <FaUserCircle className="text-5xl text-blue-400" />
                                    </div>
                                    <div className="absolute inset-0 rounded-full border-4 border-blue-500/50 animate-ping" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Waiting Room</h3>
                                <p className="text-gray-300 text-sm mb-4">
                                    You're in the waiting room. The other participant will join shortly.
                                </p>
                                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                                    <span className="ml-1">Waiting for participant</span>
                                </div>
                                <div className="mt-4 bg-gray-800/80 rounded-lg px-4 py-2 text-xs text-gray-400">
                                    Room ID: <span className="text-gray-200 font-mono">{roomId.slice(-12)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Participant name overlay on remote video */}
                    {isConnected && remotePeer?.name && (
                        <div className="absolute bottom-4 left-4">
                            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                                <FaUserCircle className="text-gray-300 text-sm" />
                                <span className="text-white text-sm font-medium">{remotePeer.name}</span>
                                <div className="w-2 h-2 bg-green-400 rounded-full" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Local Video (Picture-in-Picture) */}
                <div className="absolute bottom-8 right-8 w-36 h-28 sm:w-48 sm:h-36 rounded-xl overflow-hidden border-2 border-gray-600 shadow-xl bg-gray-800">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                    {!isVideoEnabled && (
                        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                            <FaVideoSlash className="text-gray-400 text-xl" />
                        </div>
                    )}
                    <div className="absolute bottom-1 left-0 right-0 text-center">
                        <span className="text-white text-xs bg-black/50 px-2 py-0.5 rounded-full">
                            {isScreenSharing ? '🖥 Screen' : 'You'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-gray-800 px-6 py-4 flex items-center justify-center gap-3 flex-shrink-0 flex-wrap">
                <button
                    onClick={toggleAudio}
                    title={isAudioEnabled ? 'Mute' : 'Unmute'}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isAudioEnabled ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                >
                    {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
                </button>

                <button
                    onClick={toggleVideo}
                    title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isVideoEnabled ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                >
                    {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
                </button>

                {/* Screen Share Button */}
                <button
                    onClick={toggleScreenShare}
                    title={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isScreenSharing ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'
                        }`}
                >
                    <FaDesktop />
                </button>

                <button
                    onClick={endCall}
                    title="End call"
                    className="w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
                >
                    <FaPhoneSlash className="text-xl" />
                </button>

                <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    title="Chat"
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors relative ${isChatOpen ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'
                        }`}
                >
                    <FaComments />
                    {unreadMessages > 0 && !isChatOpen && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                            {unreadMessages > 9 ? '9+' : unreadMessages}
                        </span>
                    )}
                </button>
            </div>

            {/* Chat Panel */}
            {isChatOpen && (
                <div className="fixed right-0 top-0 h-full w-80 bg-gray-800 border-l border-gray-700 flex flex-col z-50 shadow-2xl">
                    <div className="flex items-center justify-between p-4 border-b border-gray-700">
                        <h3 className="text-white font-semibold">In-call Chat</h3>
                        <button
                            onClick={() => setIsChatOpen(false)}
                            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center mt-8">No messages yet</p>
                        ) : (
                            messages.map((msg) => {
                                const isMe = msg.senderId === user?._id;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                    >
                                        <span className="text-xs text-gray-500 mb-1">{msg.senderName}</span>
                                        <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm break-words ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'
                                            }`}>
                                            {msg.message}
                                        </div>
                                        <span className="text-xs text-gray-600 mt-1">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-gray-700">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                                placeholder="Type a message..."
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!messageInput.trim()}
                                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg flex items-center justify-center text-white transition-colors"
                            >
                                <FaPaperPlane className="text-sm" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultationRoom;
