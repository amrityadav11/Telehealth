import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaFilePdf } from 'react-icons/fa';

/**
 * PrescriptionPDF
 * Generates and downloads a styled prescription PDF for a completed appointment.
 *
 * Props:
 *  - appointment: full appointment object (with doctor.user.name, patient.name, etc.)
 *  - className: optional extra Tailwind classes for the button
 */
const PrescriptionPDF = ({ appointment, className = '' }) => {
    const generatePDF = () => {
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const { prescription, patient, doctor, appointmentDate, timeSlot, appointmentId } = appointment;

        if (!prescription || !prescription.medicines?.length) {
            alert('No prescription available for this appointment.');
            return;
        }

        const pageW = doc.internal.pageSize.getWidth();
        const margin = 20;

        // ── Header bar ──────────────────────────────────────────────────────
        doc.setFillColor(37, 99, 235); // blue-600
        doc.rect(0, 0, pageW, 32, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('TeleHealth', margin, 14);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Doctor Appointment & Telemedicine Platform', margin, 21);
        doc.text('www.telehealth.com  |  support@telehealth.com', margin, 27);

        // Rx symbol top-right
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('Rx', pageW - margin - 10, 22);

        // ── Title ────────────────────────────────────────────────────────────
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(15);
        doc.setFont('helvetica', 'bold');
        doc.text('PRESCRIPTION', margin, 46);

        // Divider
        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(0.5);
        doc.line(margin, 49, pageW - margin, 49);

        // ── Patient & Doctor Info ────────────────────────────────────────────
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);

        const col1X = margin;
        const col2X = pageW / 2 + 5;
        let y = 58;

        const labelVal = (label, value, x, yPos) => {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(50, 50, 50);
            doc.text(`${label}:`, x, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(80, 80, 80);
            doc.text(value || 'N/A', x + 28, yPos);
        };

        labelVal('Patient', patient?.name, col1X, y);
        labelVal('Appointment ID', appointmentId, col2X, y);
        y += 7;
        labelVal('Doctor', `Dr. ${doctor?.user?.name || doctor?.name}`, col1X, y);
        labelVal('Date', new Date(appointmentDate).toDateString(), col2X, y);
        y += 7;
        labelVal('Specialization', doctor?.specialization, col1X, y);
        labelVal('Time', timeSlot?.startTime, col2X, y);
        y += 7;
        labelVal('Patient Phone', patient?.phone || 'N/A', col1X, y);
        labelVal('Status', 'Completed', col2X, y);

        // Divider
        y += 6;
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageW - margin, y);
        y += 8;

        // ── Medicines Table ──────────────────────────────────────────────────
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235);
        doc.text('Prescribed Medicines', margin, y);
        y += 4;

        const medicines = prescription.medicines.map((med, i) => [
            i + 1,
            med.name || '-',
            med.dosage || '-',
            med.frequency || '-',
            med.duration || '-',
        ]);

        autoTable(doc, {
            startY: y,
            head: [['#', 'Medicine Name', 'Dosage', 'Frequency', 'Duration']],
            body: medicines,
            margin: { left: margin, right: margin },
            headStyles: {
                fillColor: [37, 99, 235],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 9,
            },
            bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
            alternateRowStyles: { fillColor: [239, 246, 255] },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                1: { cellWidth: 55 },
                2: { cellWidth: 30 },
                3: { cellWidth: 40 },
                4: { cellWidth: 30 },
            },
        });

        y = doc.lastAutoTable.finalY + 10;

        // ── Instructions ─────────────────────────────────────────────────────
        if (prescription.instructions) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(37, 99, 235);
            doc.text('Doctor\'s Instructions', margin, y);
            y += 6;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);

            const lines = doc.splitTextToSize(prescription.instructions, pageW - margin * 2);
            doc.text(lines, margin, y);
            y += lines.length * 5 + 4;
        }

        // ── Follow-up ────────────────────────────────────────────────────────
        if (prescription.followUpDate) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(220, 38, 38); // red
            doc.text(
                `Follow-up Date: ${new Date(prescription.followUpDate).toDateString()}`,
                margin,
                y
            );
            y += 8;
        }

        // ── Disclaimer ───────────────────────────────────────────────────────
        y += 4;
        doc.setFillColor(254, 249, 195); // yellow-100
        doc.roundedRect(margin, y, pageW - margin * 2, 14, 2, 2, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(120, 80, 0);
        doc.text(
            '⚠  This prescription is generated digitally via TeleHealth. Please consult your doctor before',
            margin + 3,
            y + 5
        );
        doc.text(
            '    making any changes to your medication. Keep this document for your records.',
            margin + 3,
            y + 10
        );

        // ── Footer ───────────────────────────────────────────────────────────
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFillColor(37, 99, 235);
        doc.rect(0, pageH - 14, pageW, 14, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(255, 255, 255);
        doc.text(
            `Generated on ${new Date().toLocaleString()}  |  TeleHealth Platform  |  ${appointmentId}`,
            pageW / 2,
            pageH - 5,
            { align: 'center' }
        );

        // Save
        doc.save(`Prescription_${appointmentId}_${patient?.name?.replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <button
            onClick={generatePDF}
            title="Download Prescription PDF"
            className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors ${className}`}
        >
            <FaFilePdf className="text-base" />
            <span>Prescription PDF</span>
        </button>
    );
};

export default PrescriptionPDF;
