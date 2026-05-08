const asyncHandler = require('express-async-handler');
const Chat = require('../models/Chat');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

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

    const access = await verifyAccess(appointmentId, userId);
    if (!access) {
        res.status(403);
        throw new Error('Access denied to this chat');
    }

    const { appt } = access;

    // Find or create chat
    let chat = await Chat.findOne({ appointment: appointmentId });

    if (!chat) {
        const doctorDoc = await Doctor.findById(appt.doctor._id);
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

    // Re-fetch with populated sender info
    chat = await Chat.findOne({ appointment: appointmentId });

    res.json({ success: true, chat });
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

    const newMsg = {
        senderId: userId,
        senderName: req.user.name,
        senderRole: req.user.role,
        message: message.trim(),
        readBy: [userId],
    };

    chat.messages.push(newMsg);
    chat.lastMessage = { text: message.trim(), at: new Date() };
    await chat.save();

    const savedMsg = chat.messages[chat.messages.length - 1];

    // Emit via socket if available
    const io = req.app.get('io');
    if (io) {
        io.to(`chat_${appointmentId}`).emit('receive_chat_message', {
            ...savedMsg.toObject(),
            appointmentId,
        });
    }

    res.status(201).json({ success: true, message: savedMsg });
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

module.exports = { getChat, sendMessage, getUnreadCount };
