import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getSocket } from '../../services/socket';
import {
    FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash,
    FaPhoneSlash, FaComments, FaTimes, FaPaperPlane
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

const ConsultationRoom = () => {
    const { roomId } = useParams();
    const [searchParams] = useSearchParams();
    const appointmentId = searchParams.get('appointmentId');
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);

    // Refs
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);

    // State
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [remotePeer, setRemotePeer] = useState(null);
    const [callDuration, setCallDuration] = useState(0);
    const timerRef = useRef(null);

    const socket = getSocket();

    // Initialize media and WebRTC
    useEffect(() => {
        if (!socket) {
            toast.error('Socket not connected. Please refresh.');
            return;
        }

        const init = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStreamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                socket.emit('join_room', { roomId, appointmentId });
            } catch (err) {
                toast.error('Could not access camera/microphone. Please check permissions.');
                console.error('Media error:', err);
            }
        };

        init();

        // Socket event handlers
        socket.on('existing_peers', (peers) => {
            if (peers.length > 0) {
                createOffer(peers[0].socketId);
            }
        });

        socket.on('user_joined', (data) => {
            setRemotePeer(data);
            toast.success(`${data.name} joined the call`);
        });

        socket.on('webrtc_offer', async ({ offer, fromSocketId, fromName }) => {
            await handleOffer(offer, fromSocketId);
        });

        socket.on('webrtc_answer', async ({ answer }) => {
            if (peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        socket.on('ice_candidate', async ({ candidate }) => {
            if (peerConnectionRef.current && candidate) {
                try {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error('ICE candidate error:', err);
                }
            }
        });

        socket.on('receive_message', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        socket.on('user_left', (data) => {
            toast(`${data.name} left the call`, { icon: '👋' });
            setIsConnected(false);
            setRemotePeer(null);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        });

        socket.on('peer_media_toggle', ({ type, enabled }) => {
            // Visual indicator that remote peer toggled media
        });

        // Start call timer
        timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);

        return () => {
            cleanup();
        };
    }, [roomId]);

    const createPeerConnection = (targetSocketId) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        // Handle remote stream
        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
                setIsConnected(true);
            }
        };

        // ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit('ice_candidate', { candidate: event.candidate, targetSocketId });
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') setIsConnected(true);
            if (['disconnected', 'failed'].includes(pc.connectionState)) setIsConnected(false);
        };

        return pc;
    };

    const createOffer = async (targetSocketId) => {
        const pc = createPeerConnection(targetSocketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc_offer', { roomId, offer, targetSocketId });
    };

    const handleOffer = async (offer, fromSocketId) => {
        const pc = createPeerConnection(fromSocketId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc_answer', { answer, targetSocketId: fromSocketId });
    };

    const toggleAudio = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
                socket.emit('toggle_media', { roomId, type: 'audio', enabled: audioTrack.enabled });
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
                socket.emit('toggle_media', { roomId, type: 'video', enabled: videoTrack.enabled });
            }
        }
    };

    const sendMessage = () => {
        if (!messageInput.trim()) return;
        socket.emit('send_message', { roomId, message: messageInput, appointmentId });
        setMessageInput('');
    };

    const endCall = () => {
        socket.emit('leave_room', { roomId });
        cleanup();
        navigate('/dashboard');
    };

    const cleanup = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                    <span className="text-white font-medium text-sm">
                        {isConnected ? `Connected with ${remotePeer?.name || 'peer'}` : 'Waiting for other participant...'}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm font-mono">{formatDuration(callDuration)}</span>
                    <span className="text-gray-400 text-xs">Room: {roomId.slice(-8)}</span>
                </div>
            </div>

            {/* Video Area */}
            <div className="flex-1 relative p-4">
                {/* Remote Video */}
                <div className="video-container w-full h-full max-h-[calc(100vh-200px)] rounded-xl overflow-hidden bg-gray-800">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    {!isConnected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-white">
                                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaVideo className="text-3xl text-gray-400" />
                                </div>
                                <p className="text-gray-300">Waiting for the other participant to join...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Local Video (PiP) */}
                <div className="local-video">
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
                </div>
            </div>

            {/* Controls */}
            <div className="bg-gray-800 px-6 py-4 flex items-center justify-center gap-4">
                <button
                    onClick={toggleAudio}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isAudioEnabled ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                    aria-label={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                >
                    {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
                </button>

                <button
                    onClick={toggleVideo}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isVideoEnabled ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                    aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                    {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
                </button>

                <button
                    onClick={endCall}
                    className="w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-colors"
                    aria-label="End call"
                >
                    <FaPhoneSlash className="text-xl" />
                </button>

                <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors relative ${isChatOpen ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'
                        }`}
                    aria-label="Toggle chat"
                >
                    <FaComments />
                    {messages.length > 0 && !isChatOpen && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                            {messages.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Chat Panel */}
            {isChatOpen && (
                <div className="fixed right-0 top-0 h-full w-80 bg-gray-800 border-l border-gray-700 flex flex-col z-50">
                    <div className="flex items-center justify-between p-4 border-b border-gray-700">
                        <h3 className="text-white font-medium">Chat</h3>
                        <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white">
                            <FaTimes />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center">No messages yet</p>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${msg.senderId === user?._id ? 'items-end' : 'items-start'}`}
                                >
                                    <span className="text-xs text-gray-500 mb-1">{msg.senderName}</span>
                                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.senderId === user?._id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-100'
                                        }`}>
                                        {msg.message}
                                    </div>
                                    <span className="text-xs text-gray-600 mt-1">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-700">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Type a message..."
                            />
                            <button
                                onClick={sendMessage}
                                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center text-white transition-colors"
                                aria-label="Send message"
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
