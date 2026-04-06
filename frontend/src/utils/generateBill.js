import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const fmt = (n) => 'Rs. ' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Generates and downloads a PDF bill for a customer's monthly ledger.
 *
 * @param {Object} customer  - Customer object from the API
 * @param {Array}  entries   - Ledger entries for the selected month
 * @param {string} month     - "MM" string e.g. "03"
 * @param {string} year      - "YYYY" string e.g. "2025"
 */
export function generateBill({ customer, entries, month, year }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const periodLabel = `${MONTH_NAMES[parseInt(month)]} ${year}`;

  // ── Header bar ────────────────────────────────────────────────────────────
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageW, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Khatabook', marginX, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Daily Credit Ledger', pageW - marginX, 14, { align: 'right' });

  // ── Customer info block ───────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  let y = 32;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(customer.name, marginX, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  y += 6;
  doc.text(`Phone: ${customer.phone}`, marginX, y);
  y += 5;
  doc.text(`Daily Rate: ${fmt(customer.dailyAmount)}  ·  Since: ${customer.startDate}`, marginX, y);

  // Period badge (right side)
  doc.setFillColor(239, 246, 255); // blue-50
  doc.roundedRect(pageW - 58, 28, 44, 16, 3, 3, 'F');
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PERIOD', pageW - 36, 34, { align: 'center' });
  doc.setFontSize(11);
  doc.text(periodLabel, pageW - 36, 40, { align: 'center' });

  // Divider
  y += 8;
  doc.setDrawColor(220, 220, 220);
  doc.line(marginX, y, pageW - marginX, y);
  y += 6;

  // ── Summary cards ─────────────────────────────────────────────────────────
  const activeEntries = entries.filter((e) => !e.isSkipped);
  const totalDebit  = activeEntries.filter((e) => e.type === 'debit').reduce((s, e) => s + e.amount, 0);
  const totalCredit = activeEntries.filter((e) => e.type === 'credit').reduce((s, e) => s + e.amount, 0);
  const balance     = totalDebit - totalCredit;
  const skippedCount = entries.filter((e) => e.isSkipped).length;

  const cardW = (pageW - marginX * 2 - 6) / 3;
  const cards = [
    { label: 'Total Debit',  value: fmt(totalDebit),  color: [220, 38, 38]  },
    { label: 'Total Paid',   value: fmt(totalCredit), color: [5, 150, 105]  },
    { label: 'Balance Due',  value: fmt(balance),     color: balance > 0 ? [234, 88, 12] : [37, 99, 235] },
  ];

  cards.forEach((card, i) => {
    const cx = marginX + i * (cardW + 3);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cx, y, cardW, 18, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(card.label.toUpperCase(), cx + cardW / 2, y + 6, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...card.color);
    doc.text(card.value, cx + cardW / 2, y + 14, { align: 'center' });
  });

  y += 23;

  // ── Entries table ─────────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction Details', marginX, y);
  y += 4;

  const tableRows = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => [
      e.date,
      e.type.charAt(0).toUpperCase() + e.type.slice(1),
      (e.type === 'debit' ? '-' : '+') + fmt(e.amount),
      e.notes || '—',
      e.isSkipped ? 'Skipped' : '',
    ]);

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [['Date', 'Type', 'Amount', 'Notes', 'Status']],
    body: tableRows,
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 20 },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 22, halign: 'center' },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell(data) {
      const rowIdx = data.row.index;
      const entry = tableRows[rowIdx];
      if (!entry) return;

      if (data.column.index === 2) {
        // Amount column: red for debit, green for credit
        if (data.section === 'body') {
          data.cell.styles.textColor = entry[1] === 'Debit' ? [220, 38, 38] : [5, 150, 105];
          data.cell.styles.fontStyle = 'bold';
        }
      }
      if (data.column.index === 4 && data.section === 'body' && entry[4] === 'Skipped') {
        data.cell.styles.textColor = [161, 110, 0];
        data.cell.styles.fontStyle = 'bold';
      }
      // Dim entire row if skipped
      if (entry[4] === 'Skipped' && data.section === 'body' && data.column.index !== 4) {
        data.cell.styles.textColor = [160, 160, 160];
      }
    },
  });

  const finalY = doc.lastAutoTable.finalY + 6;

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(140, 140, 140);

  const footerLines = [];
  footerLines.push(`Total entries: ${entries.length}${skippedCount > 0 ? `  ·  Skipped: ${skippedCount}` : ''}`);
  footerLines.push(`Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`);

  footerLines.forEach((line, i) => {
    doc.text(line, pageW / 2, finalY + i * 5, { align: 'center' });
  });

  // Page border line
  const pgH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(220, 220, 220);
  doc.line(marginX, pgH - 10, pageW - marginX, pgH - 10);
  doc.setFontSize(7);
  doc.text('Khatabook — Daily Credit Manager', pageW / 2, pgH - 5, { align: 'center' });

  // ── Save ──────────────────────────────────────────────────────────────────
  const fileName = `${customer.name.replace(/\s+/g, '_')}_Bill_${periodLabel.replace(' ', '_')}.pdf`;
  doc.save(fileName);
}
