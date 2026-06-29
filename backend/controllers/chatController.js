const asyncHandler = require('express-async-handler');
const Chat = require('../models/Chat');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const fs = require('fs');

// Helper: verify the requesting user belongs to this appointment
const verifyAccess = async (appointmentId, userId) => {
    const appt = await Appointment.findById(appointmentId)
        .populate('doctor', 'user');

    if (!appt) return null;

    const patientId = appt.patient.toString();
    const doctorUserId = appt.doctor?.user?.toString();

    const isPatient = patientId === userId.toString();
    const isDoctor = doctorUserId === userId.toString();

    if (!isPatient && !isDoctor) return null;

    return { appt, isPatient, isDoctor, patientId, doctorUserId };
};

// @desc    Get or create chat for an appointment
// @route   GET /api/chat/:appointmentId
// @access  Private (patient or doctor of that appointment)
const getChat = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = 50;

    const access = await verifyAccess(appointmentId, userId);
    if (!access) {
        res.status(403);
        throw new Error('Access denied to this chat');
    }

    const { appt } = access;

    let chat = await Chat.findOne({ appointment: appointmentId });

    if (!chat) {
        chat = await Chat.create({
            appointment: appointmentId,
            doctor: access.doctorUserId,
            patient: access.patientId,
            messages: [],
        });
    }

    // Mark all messages as read by this user
    await Chat.updateOne(
        { appointment: appointmentId },
        { $addToSet: { 'messages.$[].readBy': userId } }
    );

    // Re-fetch with pagination (slice from end for latest messages)
    chat = await Chat.findOne({ appointment: appointmentId });
    const totalMessages = chat.messages.length;
    const start = Math.max(0, totalMessages - page * limit);
    const end = totalMessages - (page - 1) * limit;
    const paginatedMessages = chat.messages.slice(start, end);

    res.json({
        success: true,
        chat: {
            ...chat.toObject(),
            messages: paginatedMessages,
        },
        pagination: {
            page,
            limit,
            total: totalMessages,
            hasMore: start > 0,
        },
    });
});

// @desc    Send a message (REST fallback — primary is socket)
// @route   POST /api/chat/:appointmentId/messages
// @access  Private (patient or doctor of that appointment)
const sendMessage = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    if (!message?.trim()) {
        res.status(400);
        throw new Error('Message cannot be empty');
    }

    const access = await verifyAccess(appointmentId, userId);
    if (!access) {
        res.status(403);
        throw new Error('Access denied to this chat');
    }

    let chat = await Chat.findOne({ appointment: appointmentId });
    if (!chat) {
        chat = await Chat.create({
            appointment: appointmentId,
            doctor: access.doctorUserId,
            patient: access.patientId,
            messages: [],
        });
    }

    const newMsg = {
        senderId: userId,
        senderName: req.user.name,
        senderRole: req.user.role,
        message: message.trim(),
        readBy: [userId],
    };

    chat.messages.push(newMsg);
    chat.lastMessage = { text: message.trim(), at: new Date(), senderId: userId };
    await chat.save();

    const savedMsg = chat.messages[chat.messages.length - 1];

    const io = req.app.get('io');
    if (io) {
        io.to(`chat_${appointmentId}`).emit('receive_chat_message', {
            ...savedMsg.toObject(),
            appointmentId,
        });
    }

    res.status(201).json({ success: true, message: savedMsg });
});

// @desc    Upload media (image/video/file) in chat
// @route   POST /api/chat/:appointmentId/media
// @access  Private (patient or doctor of that appointment)
const sendMedia = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const userId = req.user._id;

    const access = await verifyAccess(appointmentId, userId);
    if (!access) {
        res.status(403);
        throw new Error('Access denied to this chat');
    }

    if (!req.file) {
        res.status(400);
        throw new Error('No file uploaded');
    }

    // Determine media type
    const mime = req.file.mimetype || '';
    let mediaType = 'file';
    if (mime.startsWith('image/')) mediaType = 'image';
    else if (mime.startsWith('video/')) mediaType = 'video';

    // Build URL — works for both Cloudinary and local
    let mediaUrl, publicId;
    if (req.file.path?.startsWith('http') || req.file.secure_url) {
        mediaUrl = req.file.path || req.file.secure_url;
        publicId = req.file.filename || req.file.public_id;
    } else {
        mediaUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;
        publicId = req.file.filename;
    }

    let chat = await Chat.findOne({ appointment: appointmentId });
    if (!chat) {
        chat = await Chat.create({
            appointment: appointmentId,
            doctor: access.doctorUserId,
            patient: access.patientId,
            messages: [],
        });
    }

    const caption = req.body.caption?.trim() || '';
    const newMsg = {
        senderId: userId,
        senderName: req.user.name,
        senderRole: req.user.role,
        message: caption,
        media: {
            url: mediaUrl,
            public_id: publicId,
            type: mediaType,
            name: req.file.originalname,
            size: req.file.size,
        },
        readBy: [userId],
    };

    chat.messages.push(newMsg);
    chat.lastMessage = {
        text: caption || `📎 ${req.file.originalname}`,
        at: new Date(),
        senderId: userId,
    };
    await chat.save();

    const savedMsg = chat.messages[chat.messages.length - 1];

    const io = req.app.get('io');
    if (io) {
        io.to(`chat_${appointmentId}`).emit('receive_chat_message', {
            ...savedMsg.toObject(),
            appointmentId,
        });
    }

    res.status(201).json({ success: true, message: savedMsg });
});

// @desc    Get inbox — all chats for current user (doctor or patient)
// @route   GET /api/chat/inbox
// @access  Private
const getInbox = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const field = req.user.role === 'doctor' ? 'doctor' : 'patient';

    const chats = await Chat.find({ [field]: userId })
        .sort({ 'lastMessage.at': -1, updatedAt: -1 })
        .populate('appointment', 'appointmentId appointmentDate status')
        .populate('doctor', 'name avatar')
        .populate('patient', 'name avatar');

    // Attach unread count per chat
    const inbox = chats.map((chat) => {
        const unread = chat.messages.filter(
            (m) => !m.readBy.map((id) => id.toString()).includes(userId.toString())
        ).length;

        // For doctor: other = patient; for patient: other = doctor (User doc)
        const other = req.user.role === 'doctor' ? chat.patient : chat.doctor;

        return {
            _id: chat._id,
            appointmentId: chat.appointment?._id,
            appointmentRef: chat.appointment?.appointmentId,
            appointmentDate: chat.appointment?.appointmentDate,
            appointmentStatus: chat.appointment?.status,
            other: {
                _id: other?._id,
                name: other?.name,
                avatar: other?.avatar,
            },
            lastMessage: chat.lastMessage,
            unread,
            totalMessages: chat.messages.length,
        };
    });

    const totalUnread = inbox.reduce((sum, c) => sum + c.unread, 0);

    res.json({ success: true, inbox, totalUnread });
});

// @desc    Get unread count for all chats of current user
// @route   GET /api/chat/unread
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const field = req.user.role === 'doctor' ? 'doctor' : 'patient';

    const chats = await Chat.find({ [field]: userId });

    let total = 0;
    const perAppointment = {};

    chats.forEach((chat) => {
        const unread = chat.messages.filter(
            (m) => !m.readBy.map((id) => id.toString()).includes(userId.toString())
        ).length;
        total += unread;
        if (unread > 0) {
            perAppointment[chat.appointment.toString()] = unread;
        }
    });

    res.json({ success: true, total, perAppointment });
});

module.exports = { getChat, sendMessage, sendMedia, getInbox, getUnreadCount };
