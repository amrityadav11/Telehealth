import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate and download a payment receipt PDF for an appointment.
 * @param {Object} appointment - The appointment object (populated with doctor/patient)
 */
export const downloadReceiptPDF = (appointment) => {
    const doc = new jsPDF();

    const primaryColor = [37, 99, 235]; // blue-600
    const lightGray = [248, 250, 252];
    const darkText = [17, 24, 39];
    const mutedText = [107, 114, 128];

    const pageWidth = doc.internal.pageSize.getWidth();

    // ── Header banner ──────────────────────────────────────────────
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('TeleHealth', 14, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment Receipt', 14, 28);

    // Receipt number (top-right)
    doc.setFontSize(9);
    doc.text(`Receipt #: ${appointment.appointmentId || appointment._id?.slice(-8).toUpperCase()}`, pageWidth - 14, 18, { align: 'right' });
    doc.text(
        `Date: ${appointment.payment?.paidAt
            ? new Date(appointment.payment.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
        pageWidth - 14, 28, { align: 'right' }
    );

    // ── Payment Status badge ────────────────────────────────────────
    const statusY = 50;
    doc.setFillColor(220, 252, 231); // green-100
    doc.roundedRect(14, statusY - 7, 60, 12, 3, 3, 'F');
    doc.setTextColor(22, 163, 74); // green-600
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('✓  PAYMENT SUCCESSFUL', 44, statusY, { align: 'center' });

    // ── Patient & Doctor Info ───────────────────────────────────────
    const infoY = 72;
    doc.setFillColor(...lightGray);
    doc.roundedRect(14, infoY, (pageWidth - 28) / 2 - 4, 44, 3, 3, 'F');
    doc.roundedRect(14 + (pageWidth - 28) / 2 + 4, infoY, (pageWidth - 28) / 2 - 4, 44, 3, 3, 'F');

    // Patient block
    doc.setTextColor(...mutedText);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('PATIENT', 20, infoY + 10);
    doc.setTextColor(...darkText);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const patientName = appointment.patient?.name || 'Patient';
    doc.text(patientName, 20, infoY + 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedText);
    if (appointment.patient?.email) doc.text(appointment.patient.email, 20, infoY + 30);

    // Doctor block
    const col2X = 14 + (pageWidth - 28) / 2 + 8;
    doc.setTextColor(...mutedText);
    doc.setFontSize(8);
    doc.text('DOCTOR', col2X, infoY + 10);
    doc.setTextColor(...darkText);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const doctorName = appointment.doctor?.user?.name || 'Doctor';
    doc.text(`Dr. ${doctorName}`, col2X, infoY + 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedText);
    if (appointment.doctor?.specialization) doc.text(appointment.doctor.specialization, col2X, infoY + 30);

    // ── Appointment Details Table ───────────────────────────────────
    const tableY = infoY + 54;
    doc.setTextColor(...darkText);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Appointment Details', 14, tableY);

    const apptDate = appointment.appointmentDate
        ? new Date(appointment.appointmentDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
        : '—';

    autoTable(doc, {
        startY: tableY + 4,
        head: [],
        body: [
            ['Appointment ID', appointment.appointmentId || '—'],
            ['Date', apptDate],
            ['Time', `${appointment.timeSlot?.startTime || '—'} – ${appointment.timeSlot?.endTime || '—'}`],
            ['Type', appointment.type === 'video' ? 'Video Consultation' : 'In-Person'],
            ['Status', appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1) || '—'],
        ],
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 4, textColor: darkText },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 55, textColor: mutedText },
            1: { cellWidth: 'auto' },
        },
        alternateRowStyles: { fillColor: lightGray },
        margin: { left: 14, right: 14 },
    });

    // ── Payment Details Table ───────────────────────────────────────
    const payY = doc.lastAutoTable.finalY + 10;
    doc.setTextColor(...darkText);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Details', 14, payY);

    const methodLabel = {
        stripe: 'Credit / Debit Card (Stripe)',
        upi: 'UPI',
        netbanking: 'Net Banking',
        mock: 'Online Payment',
        cash: 'Cash',
    };

    autoTable(doc, {
        startY: payY + 4,
        head: [],
        body: [
            ['Transaction ID', appointment.payment?.transactionId || '—'],
            ['Payment Method', methodLabel[appointment.payment?.method] || appointment.payment?.method || '—'],
            ['Paid On', appointment.payment?.paidAt
                ? new Date(appointment.payment.paidAt).toLocaleString('en-IN')
                : '—'],
            ['Amount Paid', `₹ ${appointment.payment?.amount?.toFixed(2) || '0.00'}`],
        ],
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 4, textColor: darkText },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 55, textColor: mutedText },
            1: { cellWidth: 'auto' },
        },
        alternateRowStyles: { fillColor: lightGray },
        margin: { left: 14, right: 14 },
    });

    // ── Total Amount highlight ──────────────────────────────────────
    const totalY = doc.lastAutoTable.finalY + 8;
    doc.setFillColor(...primaryColor);
    doc.roundedRect(14, totalY, pageWidth - 28, 18, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount Paid', 22, totalY + 12);
    doc.text(`₹ ${appointment.payment?.amount?.toFixed(2) || '0.00'}`, pageWidth - 22, totalY + 12, { align: 'right' });

    // ── Footer ─────────────────────────────────────────────────────
    const footerY = totalY + 30;
    doc.setDrawColor(229, 231, 235);
    doc.line(14, footerY, pageWidth - 14, footerY);
    doc.setTextColor(...mutedText);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('This is a computer-generated receipt and does not require a signature.', pageWidth / 2, footerY + 8, { align: 'center' });
    doc.text('For support, contact: support@telehealth.com', pageWidth / 2, footerY + 15, { align: 'center' });
    doc.text('© TeleHealth Platform', pageWidth / 2, footerY + 22, { align: 'center' });

    // ── Save ───────────────────────────────────────────────────────
    const filename = `receipt-${appointment.appointmentId || appointment._id?.slice(-8)}.pdf`;
    doc.save(filename);
};
