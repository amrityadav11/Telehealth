const nodemailer = require('nodemailer');

const createTransporter = () => {
  const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10);
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
    port,
    secure: port === 465, // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: process.env.EMAIL_USER || process.env.SMTP_EMAIL,
      pass: process.env.EMAIL_PASS || process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // allow self-signed certs in dev
    },
  });
};

const templates = {
  emailVerification: ({ name, verifyUrl }) => ({
    subject: 'Verify Your Email - TeleHealth',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to TeleHealth, ${name}!</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;">
          Verify Email
        </a>
        <p>This link expires in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      </div>
    `,
  }),

  passwordReset: ({ name, resetUrl }) => ({
    subject: 'Password Reset Request - TeleHealth',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset</h2>
        <p>Hi ${name}, you requested a password reset.</p>
        <a href="${resetUrl}" style="background:#dc2626;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;">
          Reset Password
        </a>
        <p>This link expires in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  }),

  appointmentConfirmation: ({ patientName, doctorName, date, time, appointmentId }) => ({
    subject: `Appointment Confirmed - ${appointmentId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Appointment Confirmed!</h2>
        <p>Hi ${patientName},</p>
        <p>Your appointment has been booked successfully.</p>
        <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin:16px 0;">
          <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Appointment ID:</strong> ${appointmentId}</p>
        </div>
        <p>Please be ready 5 minutes before your scheduled time.</p>
      </div>
    `,
  }),

  doctorApproval: ({ name, isApproved, rejectionReason }) => ({
    subject: isApproved ? 'Profile Approved - TeleHealth' : 'Profile Update Required - TeleHealth',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${isApproved ? '#16a34a' : '#dc2626'};">
          ${isApproved ? 'Profile Approved!' : 'Profile Update Required'}
        </h2>
        <p>Hi Dr. ${name},</p>
        ${isApproved
        ? '<p>Your profile has been approved. You can now start receiving appointments.</p>'
        : `<p>Your profile requires updates. Reason: <strong>${rejectionReason || 'Please contact support'}</strong></p>`
      }
      </div>
    `,
  }),

  appointmentReminder: ({ patientName, doctorName, date, time, appointmentId, hoursUntil }) => ({
    subject: `Reminder: Appointment in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''} - TeleHealth`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #2563eb; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Appointment Reminder</h1>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 16px;">Hi <strong>${patientName}</strong>,</p>
          <p>Your appointment is coming up in <strong>${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}</strong>.</p>
          <div style="background:#eff6ff;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #2563eb;">
            <p style="margin:4px 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
            <p style="margin:4px 0;"><strong>Date:</strong> ${date}</p>
            <p style="margin:4px 0;"><strong>Time:</strong> ${time}</p>
            <p style="margin:4px 0;"><strong>ID:</strong> ${appointmentId}</p>
          </div>
          <p>Please be ready 5 minutes before your scheduled time. Make sure your camera and microphone are working.</p>
        </div>
      </div>
    `,
  }),

  appointmentCancellation: ({ recipientName, patientName, doctorName, date, time, cancelledBy, reason }) => ({
    subject: 'Appointment Cancelled - TeleHealth',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #dc2626; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Appointment Cancelled</h1>
        </div>
        <div style="padding: 24px;">
          <p>Hi <strong>${recipientName}</strong>,</p>
          <p>Your appointment has been cancelled by the <strong>${cancelledBy}</strong>.</p>
          <div style="background:#fef2f2;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #dc2626;">
            <p style="margin:4px 0;"><strong>Patient:</strong> ${patientName}</p>
            <p style="margin:4px 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
            <p style="margin:4px 0;"><strong>Date:</strong> ${date}</p>
            <p style="margin:4px 0;"><strong>Time:</strong> ${time}</p>
            ${reason ? `<p style="margin:4px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </div>
    `,
  }),

  appointmentRescheduled: ({ doctorName, patientName, oldDate, newDate, newTime }) => ({
    subject: 'Appointment Rescheduled - TeleHealth',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #7c3aed; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Appointment Rescheduled</h1>
        </div>
        <div style="padding: 24px;">
          <p>Hi Dr. <strong>${doctorName}</strong>,</p>
          <p><strong>${patientName}</strong> has rescheduled their appointment.</p>
          <div style="background:#f5f3ff;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #7c3aed;">
            <p style="margin:4px 0;"><strong>Previous Date:</strong> <s>${oldDate}</s></p>
            <p style="margin:4px 0;"><strong>New Date:</strong> ${newDate}</p>
            <p style="margin:4px 0;"><strong>New Time:</strong> ${newTime}</p>
          </div>
        </div>
      </div>
    `,
  }),

  paymentReceipt: ({ patientName, doctorName, date, time, amount, transactionId, appointmentId }) => ({
    subject: `Payment Receipt - ${appointmentId} - TeleHealth`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #16a34a; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">✓ Payment Successful</h1>
        </div>
        <div style="padding: 24px;">
          <p>Hi <strong>${patientName}</strong>,</p>
          <p>Your payment has been processed successfully.</p>
          <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #16a34a;">
            <p style="margin:4px 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
            <p style="margin:4px 0;"><strong>Date:</strong> ${date}</p>
            <p style="margin:4px 0;"><strong>Time:</strong> ${time}</p>
            <p style="margin:4px 0;"><strong>Amount Paid:</strong> $${amount}</p>
            <p style="margin:4px 0;"><strong>Transaction ID:</strong> ${transactionId}</p>
            <p style="margin:4px 0;"><strong>Appointment ID:</strong> ${appointmentId}</p>
          </div>
          <p>Please keep this receipt for your records.</p>
        </div>
      </div>
    `,
  }),

  reviewRequest: ({ patientName, doctorName, appointmentId }) => ({
    subject: 'How was your consultation? - TeleHealth',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #f59e0b; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">⭐ Share Your Experience</h1>
        </div>
        <div style="padding: 24px;">
          <p>Hi <strong>${patientName}</strong>,</p>
          <p>Your consultation with <strong>Dr. ${doctorName}</strong> is complete. We'd love to hear your feedback!</p>
          <p>Your review helps other patients find the right doctor.</p>
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/patient/appointments" 
             style="background:#f59e0b;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;">
            Leave a Review
          </a>
        </div>
      </div>
    `,
  }),

  loginOtp: ({ name, otp }) => ({
    subject: 'Your TeleHealth Login OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #2563eb; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Login Verification</h1>
        </div>
        <div style="padding: 24px;">
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your one-time login code is:</p>
          <div style="background:#eff6ff;border:2px dashed #2563eb;border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
            <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#1d4ed8;">${otp}</span>
          </div>
          <p style="color:#6b7280;font-size:14px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
          <p style="color:#6b7280;font-size:14px;">If you didn't request this, please ignore this email or contact support.</p>
        </div>
      </div>
    `,
  }),
};

const sendEmail = async ({ email, subject, template, data, html }) => {
  const transporter = createTransporter();

  let emailHtml = html;
  let emailSubject = subject;

  if (template && templates[template]) {
    const rendered = templates[template](data);
    emailHtml = rendered.html;
    emailSubject = rendered.subject;
  }

  const fromName = process.env.EMAIL_FROM || process.env.FROM_NAME || 'TeleHealth';
  const fromEmail = process.env.EMAIL_USER || process.env.FROM_EMAIL;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject: emailSubject,
    html: emailHtml,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent: ${info.messageId}`);
  return info;
};

module.exports = { sendEmail };
