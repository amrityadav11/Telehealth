const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { sendEmail } = require('./sendEmail');

/**
 * Runs every 30 minutes.
 * Sends reminder emails for appointments happening in ~24 hours and ~1 hour.
 */
const startReminderCron = () => {
    // Run every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
        try {
            const now = new Date();

            // Windows for 24h reminder: 23.5h → 24.5h from now
            const h24Start = new Date(now.getTime() + 23.5 * 60 * 60 * 1000);
            const h24End = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);

            // Windows for 1h reminder: 0.5h → 1.5h from now
            const h1Start = new Date(now.getTime() + 0.5 * 60 * 60 * 1000);
            const h1End = new Date(now.getTime() + 1.5 * 60 * 60 * 1000);

            // Fetch upcoming confirmed appointments that haven't had a reminder sent
            const appointments = await Appointment.find({
                status: { $in: ['confirmed', 'pending'] },
                reminderSent: false,
                appointmentDate: { $gte: h1Start, $lte: h24End },
            })
                .populate('patient', 'name email')
                .populate({
                    path: 'doctor',
                    populate: { path: 'user', select: 'name' },
                });

            for (const appt of appointments) {
                const apptTime = appt.appointmentDate.getTime();
                const diffHours = (apptTime - now.getTime()) / (1000 * 60 * 60);

                // Determine which reminder window this falls in
                let hoursUntil = null;
                if (apptTime >= h24Start.getTime() && apptTime <= h24End.getTime()) {
                    hoursUntil = 24;
                } else if (apptTime >= h1Start.getTime() && apptTime <= h1End.getTime()) {
                    hoursUntil = 1;
                }

                if (hoursUntil === null) continue;

                try {
                    await sendEmail({
                        email: appt.patient.email,
                        template: 'appointmentReminder',
                        data: {
                            patientName: appt.patient.name,
                            doctorName: appt.doctor?.user?.name || 'Your Doctor',
                            date: appt.appointmentDate.toDateString(),
                            time: appt.timeSlot.startTime,
                            appointmentId: appt.appointmentId,
                            hoursUntil,
                        },
                    });

                    // Mark reminder sent only after the 1h reminder (final one)
                    if (hoursUntil === 1) {
                        appt.reminderSent = true;
                        await appt.save({ validateBeforeSave: false });
                    }

                    console.log(`⏰ Reminder sent to ${appt.patient.email} (${hoursUntil}h before)`);
                } catch (emailErr) {
                    console.error(`❌ Reminder email failed for ${appt.appointmentId}:`, emailErr.message);
                }
            }
        } catch (err) {
            console.error('❌ Reminder cron error:', err.message);
        }
    });

    console.log('⏰ Appointment reminder cron started (runs every 30 min)');
};

module.exports = { startReminderCron };
