const asyncHandler = require('express-async-handler');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { sendEmail } = require('../utils/sendEmail');
const { v4: uuidv4 } = require('uuid');

// @desc    Book appointment
// @route   POST /api/appointments
// @access  Private (Patient)
const bookAppointment = asyncHandler(async (req, res) => {
  const { doctorId, appointmentDate, timeSlot, symptoms, type = 'video', bookedForId } = req.body;

  const doctor = await Doctor.findById(doctorId).populate('user', 'name email');
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  if (!doctor.isApproved) {
    res.status(400);
    throw new Error('Doctor is not approved yet');
  }

  // Check if slot is already booked
  const existingAppointment = await Appointment.findOne({
    doctor: doctorId,
    appointmentDate: new Date(appointmentDate),
    'timeSlot.startTime': timeSlot.startTime,
    status: { $in: ['pending', 'confirmed'] },
  });

  if (existingAppointment) {
    res.status(400);
    throw new Error('This time slot is already booked');
  }

  // Validate appointment date is in the future
  if (new Date(appointmentDate) < new Date()) {
    res.status(400);
    throw new Error('Appointment date must be in the future');
  }

  // Resolve family member if booking for dependent
  let bookedForName = null;
  if (bookedForId) {
    const FamilyMember = require('../models/FamilyMember');
    const member = await FamilyMember.findOne({ _id: bookedForId, patient: req.user._id });
    if (!member) {
      res.status(404);
      throw new Error('Family member not found');
    }
    bookedForName = member.name;
  }

  const appointment = await Appointment.create({
    patient: req.user._id,
    doctor: doctorId,
    appointmentDate: new Date(appointmentDate),
    timeSlot,
    symptoms,
    type,
    payment: {
      amount: doctor.consultationFee,
      status: 'pending',
    },
    bookedFor: bookedForId || undefined,
    bookedForName: bookedForName || undefined,
  });

  // ── Auto-create chat thread so both parties see each other in inbox ──
  try {
    const Chat = require('../models/Chat');
    await Chat.findOneAndUpdate(
      { appointment: appointment._id },
      {
        $setOnInsert: {
          appointment: appointment._id,
          doctor: doctor.user._id,
          patient: req.user._id,
          messages: [],
        },
      },
      { upsert: true, new: true }
    );
  } catch (chatErr) {
    console.error('Chat init error:', chatErr.message);
  }

  await appointment.populate([
    { path: 'patient', select: 'name email phone' },
    { path: 'doctor', populate: { path: 'user', select: 'name email' } },
  ]);

  // Notify doctor
  const doctorUser = await User.findById(doctor.user._id);
  doctorUser.addNotification(
    `New appointment booked by ${req.user.name} on ${new Date(appointmentDate).toDateString()}`,
    'appointment',
    `/doctor/appointments/${appointment._id}`
  );
  await doctorUser.save({ validateBeforeSave: false });

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.to(`doctor_${doctor.user._id}`).emit('new_appointment', {
      appointment,
      message: `New appointment from ${req.user.name}`,
    });
  }

  // Send confirmation email
  try {
    await sendEmail({
      email: req.user.email,
      subject: 'Appointment Booking Confirmation',
      template: 'appointmentConfirmation',
      data: {
        patientName: req.user.name,
        doctorName: doctor.user.name,
        date: new Date(appointmentDate).toDateString(),
        time: timeSlot.startTime,
        appointmentId: appointment.appointmentId,
      },
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }

  res.status(201).json({ success: true, appointment });
});

// @desc    Get patient's appointments
// @route   GET /api/appointments/my-appointments
// @access  Private (Patient)
const getMyAppointments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const filter = { patient: req.user._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Appointment.countDocuments(filter);

  const appointments = await Appointment.find(filter)
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'name avatar' },
      select: 'specialization category consultationFee rating user',
    })
    .sort({ appointmentDate: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.json({
    success: true,
    count: appointments.length,
    total,
    pages: Math.ceil(total / Number(limit)),
    currentPage: Number(page),
    appointments,
  });
});

// @desc    Get doctor's appointments
// @route   GET /api/appointments/doctor-appointments
// @access  Private (Doctor)
const getDoctorAppointments = asyncHandler(async (req, res) => {
  const { status, date, page = 1, limit = 10 } = req.query;

  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  const filter = { doctor: doctor._id };
  if (status) filter.status = status;
  if (date) {
    const d = new Date(date);
    filter.appointmentDate = {
      $gte: d,
      $lt: new Date(d.setDate(d.getDate() + 1)),
    };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Appointment.countDocuments(filter);

  const appointments = await Appointment.find(filter)
    .populate('patient', 'name email avatar phone')
    .sort({ appointmentDate: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.json({
    success: true,
    count: appointments.length,
    total,
    pages: Math.ceil(total / Number(limit)),
    currentPage: Number(page),
    appointments,
  });
});

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'name email avatar phone')
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'name email avatar' },
    });

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  // Ensure user owns this appointment
  const isPatient = appointment.patient._id.toString() === req.user._id.toString();
  const doctor = await Doctor.findOne({ user: req.user._id });
  const isDoctor = doctor && appointment.doctor._id.toString() === doctor._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isPatient && !isDoctor && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to view this appointment');
  }

  res.json({ success: true, appointment });
});

// @desc    Update appointment status (Doctor: confirm/cancel, Patient: cancel)
// @route   PUT /api/appointments/:id/status
// @access  Private
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, cancellationReason, prescription } = req.body;

  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'name email')
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } });

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  const doctor = await Doctor.findOne({ user: req.user._id });

  // Authorization checks
  if (req.user.role === 'patient') {
    if (appointment.patient._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized');
    }
    if (!['cancelled'].includes(status)) {
      res.status(400);
      throw new Error('Patients can only cancel appointments');
    }
    appointment.cancelledBy = 'patient';
  } else if (req.user.role === 'doctor') {
    if (!doctor || appointment.doctor._id.toString() !== doctor._id.toString()) {
      res.status(403);
      throw new Error('Not authorized');
    }
    if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status for doctor');
    }
    if (status === 'cancelled') appointment.cancelledBy = 'doctor';
  }

  appointment.status = status;
  if (cancellationReason) appointment.cancellationReason = cancellationReason;
  if (prescription && status === 'completed') {
    appointment.prescription = prescription;
  }

  // Update doctor stats on completion
  if (status === 'completed') {
    appointment.payment.status = 'paid';
    appointment.payment.paidAt = new Date();

    await Doctor.findByIdAndUpdate(appointment.doctor._id, {
      $inc: {
        totalEarnings: appointment.payment.amount,
        totalAppointments: 1,
      },
    });
  }

  await appointment.save();

  // ── Ensure chat thread exists when appointment is confirmed ──────────
  if (status === 'confirmed') {
    try {
      const Chat = require('../models/Chat');
      const doctorDoc = await Doctor.findById(appointment.doctor._id).select('user');
      if (doctorDoc) {
        await Chat.findOneAndUpdate(
          { appointment: appointment._id },
          {
            $setOnInsert: {
              appointment: appointment._id,
              doctor: doctorDoc.user,
              patient: appointment.patient._id,
              messages: [],
            },
          },
          { upsert: true, new: true }
        );
      }
    } catch (chatErr) {
      console.error('Chat init error on confirm:', chatErr.message);
    }
  }

  // Notify patient
  const patientUser = await User.findById(appointment.patient._id);
  patientUser.addNotification(
    `Your appointment on ${appointment.appointmentDate.toDateString()} has been ${status}`,
    'appointment',
    `/patient/appointments/${appointment._id}`
  );
  await patientUser.save({ validateBeforeSave: false });

  // Socket notification
  const io = req.app.get('io');
  if (io) {
    io.to(`patient_${appointment.patient._id}`).emit('appointment_update', {
      appointmentId: appointment._id,
      status,
      message: `Your appointment has been ${status}`,
    });
  }

  // Send email notifications
  try {
    if (status === 'cancelled') {
      // Email patient
      await sendEmail({
        email: appointment.patient.email,
        template: 'appointmentCancellation',
        data: {
          recipientName: appointment.patient.name,
          patientName: appointment.patient.name,
          doctorName: appointment.doctor.user.name,
          date: appointment.appointmentDate.toDateString(),
          time: appointment.timeSlot.startTime,
          cancelledBy: appointment.cancelledBy || req.user.role,
          reason: cancellationReason,
        },
      });
    } else if (status === 'completed') {
      // Email patient with review request
      await sendEmail({
        email: appointment.patient.email,
        template: 'reviewRequest',
        data: {
          patientName: appointment.patient.name,
          doctorName: appointment.doctor.user.name,
          appointmentId: appointment.appointmentId,
        },
      });
    }
  } catch (err) {
    console.error('Email error:', err.message);
  }

  res.json({ success: true, appointment });
});

// @desc    Start consultation (generate room)
// @route   POST /api/appointments/:id/start-consultation
// @access  Private (Doctor)
const startConsultation = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  if (appointment.status !== 'confirmed') {
    res.status(400);
    throw new Error('Appointment must be confirmed to start consultation');
  }

  const roomId = `room_${appointment._id}_${uuidv4().slice(0, 8)}`;
  appointment.consultation.roomId = roomId;
  appointment.consultation.startedAt = new Date();
  await appointment.save();

  // Notify patient
  const io = req.app.get('io');
  if (io) {
    io.to(`patient_${appointment.patient}`).emit('consultation_started', {
      appointmentId: appointment._id,
      roomId,
      message: 'Your doctor has started the consultation',
    });
  }

  res.json({ success: true, roomId, appointment });
});

// @desc    End consultation
// @route   POST /api/appointments/:id/end-consultation
// @access  Private (Doctor)
const endConsultation = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  appointment.consultation.endedAt = new Date();
  if (appointment.consultation.startedAt) {
    const durationMs = appointment.consultation.endedAt - appointment.consultation.startedAt;
    appointment.consultation.duration = Math.round(durationMs / 60000);
  }
  appointment.status = 'completed';
  appointment.payment.status = 'paid';
  appointment.payment.paidAt = new Date();

  await appointment.save();

  await Doctor.findByIdAndUpdate(appointment.doctor, {
    $inc: {
      totalEarnings: appointment.payment.amount,
      totalAppointments: 1,
    },
  });

  res.json({ success: true, appointment });
});

// @desc    Reschedule appointment
// @route   PUT /api/appointments/:id/reschedule
// @access  Private (Patient)
const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { appointmentDate, timeSlot } = req.body;

  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'name email')
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } });

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  if (appointment.patient._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  if (!['pending', 'confirmed'].includes(appointment.status)) {
    res.status(400);
    throw new Error('Only pending or confirmed appointments can be rescheduled');
  }

  if (new Date(appointmentDate) < new Date()) {
    res.status(400);
    throw new Error('New appointment date must be in the future');
  }

  // Check if new slot is available
  const conflict = await Appointment.findOne({
    _id: { $ne: appointment._id },
    doctor: appointment.doctor._id,
    appointmentDate: new Date(appointmentDate),
    'timeSlot.startTime': timeSlot.startTime,
    status: { $in: ['pending', 'confirmed'] },
  });

  if (conflict) {
    res.status(400);
    throw new Error('This time slot is already booked');
  }

  const oldDate = appointment.appointmentDate;
  appointment.appointmentDate = new Date(appointmentDate);
  appointment.timeSlot = timeSlot;
  appointment.status = 'pending'; // reset to pending after reschedule
  await appointment.save();

  // Notify doctor
  const doctorUser = await User.findById(appointment.doctor.user._id);
  doctorUser.addNotification(
    `Appointment rescheduled by ${req.user.name} to ${new Date(appointmentDate).toDateString()} at ${timeSlot.startTime}`,
    'appointment',
    `/doctor/appointments/${appointment._id}`
  );
  await doctorUser.save({ validateBeforeSave: false });

  const io = req.app.get('io');
  if (io) {
    io.to(`doctor_${appointment.doctor.user._id}`).emit('appointment_update', {
      appointmentId: appointment._id,
      status: 'rescheduled',
      message: `Appointment rescheduled by ${req.user.name}`,
    });
  }

  // Send email
  try {
    await sendEmail({
      email: appointment.doctor.user.email,
      subject: 'Appointment Rescheduled - TeleHealth',
      template: 'appointmentRescheduled',
      data: {
        doctorName: appointment.doctor.user.name,
        patientName: req.user.name,
        oldDate: oldDate.toDateString(),
        newDate: new Date(appointmentDate).toDateString(),
        newTime: timeSlot.startTime,
      },
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }

  res.json({ success: true, appointment });
});

module.exports = {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getAppointment,
  updateAppointmentStatus,
  startConsultation,
  endConsultation,
  rescheduleAppointment,
};
