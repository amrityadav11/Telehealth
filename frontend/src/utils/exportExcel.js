import * as XLSX from 'xlsx';

/**
 * Export an array of objects to an Excel (.xlsx) file.
 * @param {Object[]} data - Array of row objects
 * @param {string[]} columns - Column keys to include (in order)
 * @param {string[]} headers - Human-readable header labels (same order as columns)
 * @param {string} sheetName - Name of the worksheet
 * @param {string} fileName - Output file name (without extension)
 */
export const exportToExcel = (data, columns, headers, sheetName, fileName) => {
    // Build rows: header row + data rows
    const rows = [
        headers,
        ...data.map((row) =>
            columns.map((col) => {
                const val = col.split('.').reduce((obj, key) => obj?.[key], row);
                if (val instanceof Date) return val.toLocaleDateString('en-IN');
                if (typeof val === 'boolean') return val ? 'Yes' : 'No';
                return val ?? '—';
            })
        ),
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Auto column widths
    const colWidths = headers.map((h, i) => {
        const maxLen = Math.max(
            h.length,
            ...data.map((row) => {
                const val = columns[i].split('.').reduce((obj, key) => obj?.[key], row);
                return String(val ?? '').length;
            })
        );
        return { wch: Math.min(maxLen + 4, 40) };
    });
    ws['!cols'] = colWidths;

    // Style header row bold (basic)
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[cellAddr]) continue;
        ws[cellAddr].s = { font: { bold: true } };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
};

// ── Preset exporters ────────────────────────────────────────────────────────

export const exportUsersExcel = (users) => {
    exportToExcel(
        users,
        ['name', 'email', 'role', 'isActive', 'createdAt'],
        ['Name', 'Email', 'Role', 'Active', 'Joined'],
        'Users',
        `telehealth-users-${new Date().toISOString().slice(0, 10)}`
    );
};

export const exportPatientsExcel = (users) => {
    const patients = users.filter((u) => u.role === 'patient');
    exportToExcel(
        patients,
        ['name', 'email', 'phone', 'isActive', 'createdAt'],
        ['Name', 'Email', 'Phone', 'Active', 'Joined'],
        'Patients',
        `telehealth-patients-${new Date().toISOString().slice(0, 10)}`
    );
};

export const exportDoctorsExcel = (doctors) => {
    const rows = doctors.map((d) => ({
        name: d.user?.name,
        email: d.user?.email,
        specialization: d.specialization,
        category: d.category,
        experience: d.experience,
        fee: d.consultationFee,
        approved: d.isApproved,
        joined: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN') : '—',
    }));
    exportToExcel(
        rows,
        ['name', 'email', 'specialization', 'category', 'experience', 'fee', 'approved', 'joined'],
        ['Name', 'Email', 'Specialization', 'Category', 'Experience (yrs)', 'Fee ($)', 'Approved', 'Joined'],
        'Doctors',
        `telehealth-doctors-${new Date().toISOString().slice(0, 10)}`
    );
};
