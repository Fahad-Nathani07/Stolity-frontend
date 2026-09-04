import { useState } from 'react';
import * as XLSX from 'xlsx';
// import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import ExportIcon from "../../images/ExportIcon.svg";

export default function ExportDropdown({ candidates = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  console.log("ExportDropdown received candidates:", candidates);

  const download = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    if (!candidates || candidates.length === 0) {
      console.warn('No candidates to export');
      setIsOpen(false);
      return;
    }

    const filename = `candidates-export-${new Date().toISOString().slice(0,10)}.json`;
    const content = JSON.stringify(candidates, null, 2);
    download(content, filename, 'application/json');
    setIsOpen(false);
  };

  const exportCSV = () => {
    if (!candidates || candidates.length === 0) {
      console.warn('No candidates to export');
      setIsOpen(false);
      return;
    }

    const headers = 'ID,Name,Email,Mobile,Status,Job Title,Experience (months),Location,Applied Date,Resume URL,Skills\n';

    const rows = candidates.map(candidate => {
      const totalMonths = (candidate.experienceYears || 0) * 12 + (candidate.experienceMonths || 0);
      const appliedDate = candidate.appliedDate ? candidate.appliedDate.split('T')[0] : '';

      return [
        candidate.id || '',
        `${candidate.first_Name || ''} ${candidate.lastName || ''}`.trim(),
        candidate.userEmail || '',
        candidate.mobile || '',
        candidate.status || '',
        candidate.jobTitle || '',
        totalMonths,
        candidate.jobLocation || '',
        appliedDate,
        candidate.resumeUrl || '',
        candidate.requiredSkills?.join(', ') || ''
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const content = headers + rows.join('\n');
    const filename = `candidates-export-${new Date().toISOString().slice(0,10)}.csv`;
    download(content, filename, 'text/csv;charset=utf-8;');
    setIsOpen(false);
  };

  const exportExcel = () => {
    if (!candidates || candidates.length === 0) {
      console.warn('No candidates to export');
      setIsOpen(false);
      return;
    }

    const data = candidates.map(candidate => {
      const totalMonths = (candidate.experienceYears || 0) * 12 + (candidate.experienceMonths || 0);
      const appliedDate = candidate.appliedDate ? candidate.appliedDate.split('T')[0] : '';

      return {
        Name: `${candidate.first_Name || ''} ${candidate.lastName || ''}`.trim(),
        Email: candidate.userEmail || '',
        Mobile: candidate.mobile || '',
        Status: candidate.status || '',
        'Job Title': candidate.jobTitle || '',
        'Experience (months)': totalMonths,
        Location: candidate.jobLocation || '',
        'Applied Date': appliedDate,
        'Resume URL': candidate.resumeUrl || '',
        Skills: candidate.requiredSkills?.join(', ') || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');

    const filename = `candidates-export-${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    setIsOpen(false);
  };

  const exportPDF = async () => {
  if (!candidates || candidates.length === 0) {
    console.warn('No candidates to export');
    setIsOpen(false);
    return;
  }

  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'landscape' });

  const companyName = "Infomanav";

  // Header
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text(`${companyName} Candidate Export Report`, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(
    `Generated on: ${new Date().toLocaleDateString('en-IN')} | Total Candidates: ${candidates.length}`,
    14,
    28
  );

  // Table data – removed Status (index 4) and Resume URL (index 9)
  const tableData = candidates.map((candidate, index) => {
    const fullName = `${candidate.first_Name || ''} ${candidate.lastName || ''}`.trim() || '-';
    const totalMonths = (candidate.experienceYears || 0) * 12 + (candidate.experienceMonths || 0);
    const appliedDate = candidate.appliedDate ? candidate.appliedDate.split('T')[0] : '-';

    return [
      index + 1,                           // 0: No.
      fullName,                            // 1: Name
      candidate.userEmail || '-',          // 2: Email
      candidate.mobile || '-',             // 3: Mobile
      candidate.jobTitle || '-',           // 4: Job Title
      totalMonths || '-',                  // 5: Exp (mo)
      candidate.jobLocation || '-',        // 6: Location
      appliedDate,                         // 7: Applied
      candidate.requiredSkills?.join(', ') || '-'  // 8: Skills
    ];
  });

  const head = [
    ['No.', 'Name', 'Email', 'Mobile', 'Job Title', 'Exp (mo)', 'Location', 'Applied', 'Skills']
  ];

  const pageWidth = doc.internal.pageSize.getWidth();

  autoTable(doc, {
    head,
    body: tableData,
    startY: 35,
    theme: 'grid',

    styles: {
      fontSize: 9,           // slightly larger now that we have fewer columns
      cellPadding: 3,
      overflow: 'linebreak',
      lineColor: [220, 220, 220],
      lineWidth: 0.3,
      valign: 'middle',
    },

    headStyles: {
      fillColor: [255, 171, 73],     // #FFAB49 in RGB
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 10,
    },

    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },

    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },   // No.
      1: { cellWidth: 30 },                     // Name
      2: { cellWidth: 52 },                     // Email
      3: { cellWidth: 25 },                     // Mobile
      4: { cellWidth: 31 },                     // Job Title
      5: { cellWidth: 15, halign: 'center' },   // Exp (mo)
      6: { cellWidth: 22 },                     // Location
      7: { cellWidth: 23 },                     // Applied
      8: { cellWidth: 45 }                      // Skills – gave more space
    },

    margin: {
      top: 35,
      bottom: 25,
      left: 20,
      right: 20
    },

    tableWidth: 'wrap',

    didParseCell: (data) => {
      // Center most columns except Name & Email
      if (data.column.index > 0 && data.column.index !== 1 && data.column.index !== 2) {
        data.cell.styles.halign = 'center';
      }
    },

    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setTextColor(140);
      doc.text(
        `Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`,
        pageWidth - 30,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
      );
    }
  });

  const filename = `candidates-export-${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(filename);
  setIsOpen(false);
};

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 132,
          height: 48,
          borderRadius: 32,
          padding: '12px 24px',
          border: '1px solid #DCDCDC',
          background: '#FFFFFF',
          color: '#575757',
          fontWeight: 600,
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
        }}
      >
        <img src={ExportIcon} alt="" style={{ width: 20, height: 20 }} />
        <span>Export</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 6,
            background: 'white',
            border: '1px solid #DCDCDC',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            zIndex: 10,
            minWidth: 160,
          }}
        >
          <div style={menuItem} onClick={exportJSON}>JSON</div>
          <div style={menuItem} onClick={exportCSV}>CSV</div>
          <div style={menuItem} onClick={exportExcel}>Excel</div>
          <div style={menuItem} onClick={exportPDF}>PDF</div>
        </div>
      )}
    </div>
  );
}

const menuItem = {
  padding: '10px 16px',
  cursor: 'pointer',
  fontSize: 14,
  color: '#333',
  borderBottom: '1px solid #f0f0f0',
};

menuItem[':hover'] = { background: '#f8f8f8' };