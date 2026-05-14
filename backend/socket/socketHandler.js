const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Track active rooms and users
const activeRooms = new Map(); // roomId -> { doctor, patient, peers }
const userSockets = new Map(); // userId -> Set of socketIds (multi-tab support)

// Export so routes can query online status
const isUserOnline = (userId) => {
    const sockets = userSockets.get(userId.toString());
    return sockets ? sockets.size > 0 : false;
};

const initSocket = (io) => {
    // Auth middleware for socket
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error('Authentication required'));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (!user) return next(new Error('User not found'));

            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user._id.toString();

        // Multi-tab: track all socket IDs per user
        if (!userSockets.has(userId)) userSockets.set(userId, new Set());
        userSockets.get(userId).add(socket.id);

        console.log(`🔌 User connected: ${socket.user.name} (${socket.user.role})`);

        // Join personal room for notifications
        socket.join(`${socket.user.role}_${userId}`);

        // Broadcast online status to all chat rooms this user is in
        socket.broadcast.emit('user_online', { userId });

        // ─── Video Consultation Events ───────────────────────────────────────

        // Join consultation room
        socket.on('join_room', ({ roomId, appointmentId }) => {
            socket.join(roomId);

            if (!activeRooms.has(roomId)) {
                activeRooms.set(roomId, { peers: [] });
            }

            const room = activeRooms.get(roomId);
            room.peers.push({ userId, socketId: socket.id, role: socket.user.role });

            // Notify others in room
            socket.to(roomId).emit('user_joined', {
                userId,
                name: socket.user.name,
                role: socket.user.role,
                socketId: socket.id,
            });

            // Send existing peers to new joiner
            const otherPeers = room.peers.filter((p) => p.socketId !== socket.id);
            socket.emit('existing_peers', otherPeers);

            console.log(`📹 ${socket.user.name} joined room: ${roomId}`);
        });

        // WebRTC signaling: offer
        socket.on('webrtc_offer', ({ roomId, offer, targetSocketId }) => {
            socket.to(targetSocketId).emit('webrtc_offer', {
                offer,
                fromSocketId: socket.id,
                fromUserId: userId,
                fromName: socket.user.name,
            });
        });

        // WebRTC signaling: answer
        socket.on('webrtc_answer', ({ answer, targetSocketId }) => {
            socket.to(targetSocketId).emit('webrtc_answer', {
                answer,
                fromSocketId: socket.id,
            });
        });

        // WebRTC signaling: ICE candidate
        socket.on('ice_candidate', ({ candidate, targetSocketId }) => {
            socket.to(targetSocketId).emit('ice_candidate', {
                candidate,
                fromSocketId: socket.id,
            });
        });

        // Toggle media (mute/unmute, camera on/off)
        socket.on('toggle_media', ({ roomId, type, enabled }) => {
            socket.to(roomId).emit('peer_media_toggle', {
                userId,
                type, // 'audio' | 'video'
                enabled,
            });
        });

        // ─── Chat Events (video room) ─────────────────────────────────────────

        socket.on('send_message', ({ roomId, message, appointmentId }) => {
            const msgData = {
                id: Date.now(),
                senderId: userId,
                senderName: socket.user.name,
                senderRole: socket.user.role,
                message,
                timestamp: new Date().toISOString(),
            };

            io.to(roomId).emit('receive_message', msgData);
        });

        // ─── Typing indicator (video room) ───────────────────────────────────

        socket.on('typing', ({ roomId }) => {
            socket.to(roomId).emit('user_typing', { userId, name: socket.user.name });
        });

        socket.on('stop_typing', ({ roomId }) => {
            socket.to(roomId).emit('user_stop_typing', { userId });
        });

        // ─── Persistent Chat (appointment-based) ─────────────────────────────

        socket.on('join_chat', ({ appointmentId }) => {
            socket.join(`chat_${appointmentId}`);
        });

        socket.on('leave_chat', ({ appointmentId }) => {
            socket.leave(`chat_${appointmentId}`);
        });

        socket.on('send_chat_message', async ({ appointmentId, message }) => {
            if (!message?.trim()) return;
            try {
                const Chat = require('../models/Chat');
                const Appointment = require('../models/Appointment');

                const appt = await Appointment.findById(appointmentId).populate('doctor', 'user');
                if (!appt) return;

                const patientId = appt.patient.toString();
                const doctorUserId = appt.doctor?.user?.toString();
                if (userId !== patientId && userId !== doctorUserId) return;

                let chat = await Chat.findOne({ appointment: appointmentId });
                if (!chat) {
                    chat = await Chat.create({
                        appointment: appointmentId,
                        doctor: doctorUserId,
                        patient: patientId,
                        messages: [],
                    });
                }

                const newMsg = {
                    senderId: socket.user._id,
                    senderName: socket.user.name,
                    senderRole: socket.user.role,
                    message: message.trim(),
                    readBy: [socket.user._id],
                };

                chat.messages.push(newMsg);
                chat.lastMessage = { text: message.trim(), at: new Date() };
                await chat.save();

                const savedMsg = chat.messages[chat.messages.length - 1];
                io.to(`chat_${appointmentId}`).emit('receive_chat_message', {
                    ...savedMsg.toObject(),
                    appointmentId,
                });
            } catch (err) {
                console.error('Chat socket error:', err.message);
            }
        });

        socket.on('chat_typing', ({ appointmentId }) => {
            socket.to(`chat_${appointmentId}`).emit('chat_user_typing', { userId, name: socket.user.name });
        });

        socket.on('chat_stop_typing', ({ appointmentId }) => {
            socket.to(`chat_${appointmentId}`).emit('chat_user_stop_typing', { userId });
        });

        // ─── Online status check ─────────────────────────────────────────────

        socket.on('check_online', ({ userIds }) => {
            const statuses = {};
            (userIds || []).forEach((id) => {
                const sockets = userSockets.get(id.toString());
                statuses[id] = sockets ? sockets.size > 0 : false;
            });
            socket.emit('online_statuses', statuses);
        });

        // ─── Leave room ──────────────────────────────────────────────────────

        socket.on('leave_room', ({ roomId }) => {
            socket.leave(roomId);
            socket.to(roomId).emit('user_left', { userId, name: socket.user.name });

            if (activeRooms.has(roomId)) {
                const room = activeRooms.get(roomId);
                room.peers = room.peers.filter((p) => p.socketId !== socket.id);
                if (room.peers.length === 0) activeRooms.delete(roomId);
            }
        });

        // ─── Disconnect ──────────────────────────────────────────────────────

        socket.on('disconnect', () => {
            // Multi-tab: only remove this specific socket
            const sockets = userSockets.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    userSockets.delete(userId);
                    // Broadcast offline only when truly no sockets remain
                    socket.broadcast.emit('user_offline', { userId });
                }
            }

            // Remove from all active rooms
            activeRooms.forEach((room, roomId) => {
                const wasMember = room.peers.some((p) => p.socketId === socket.id);
                if (wasMember) {
                    room.peers = room.peers.filter((p) => p.socketId !== socket.id);
                    socket.to(roomId).emit('user_left', { userId, name: socket.user.name });
                    if (room.peers.length === 0) activeRooms.delete(roomId);
                }
            });

            console.log(`🔌 User disconnected: ${socket.user.name}`);
        });
    });
};

module.exports = { initSocket, isUserOnline, userSockets };
