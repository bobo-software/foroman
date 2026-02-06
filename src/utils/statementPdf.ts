import { formatCurrency } from './currency';

export interface StatementRow {
  date: string;
  type: 'invoice' | 'payment';
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  currency: string;
}

const PDF = {
  margin: 20,
  pageWidth: 210,
  lineHeight: 6,
  tableHeaderHeight: 8,
  tableRowHeight: 7,
};

function drawHLine(doc: import('jspdf').jsPDF, y: number, thick = false) {
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(thick ? 0.8 : 0.4);
  doc.line(PDF.margin, y, PDF.pageWidth - PDF.margin, y);
}

export async function generateStatementPdf(
  companyName: string,
  fromDate: string,
  toDate: string,
  rows: StatementRow[],
  currency: string = 'ZAR'
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const margin = PDF.margin;
  let y = margin;
  const lh = PDF.lineHeight;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Statement of Account', margin, y);
  y += lh + 2;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Company: ${companyName}`, margin, y);
  y += lh;
  doc.text(`From: ${fromDate}  To: ${toDate}`, margin, y);
  doc.text(`Currency: ${currency}`, margin + 100, y);
  y += lh + 6;
  drawHLine(doc, y, true);
  y += 6;

  const colDate = margin;
  const colType = margin + 28;
  const colRef = margin + 50;
  const colDebit = margin + 95;
  const colCredit = margin + 125;
  const colBalance = margin + 155;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Date', colDate, y + 4);
  doc.text('Type', colType, y + 4);
  doc.text('Reference', colRef, y + 4);
  doc.text('Debit', colDebit, y + 4);
  doc.text('Credit', colCredit, y + 4);
  doc.text('Balance', colBalance, y + 4);
  y += PDF.tableHeaderHeight;
  doc.setFont('helvetica', 'normal');

  for (const row of rows) {
    if (row.currency !== currency) continue;
    const dateStr = new Date(row.date).toLocaleDateString();
    doc.setFontSize(9);
    doc.text(dateStr, colDate, y + 5);
    doc.text(row.type === 'invoice' ? 'Invoice' : 'Payment', colType, y + 5);
    doc.text(String(row.reference).slice(0, 18), colRef, y + 5);
    doc.text(row.debit > 0 ? formatCurrency(row.debit, currency) : '', colDebit, y + 5);
    doc.text(row.credit > 0 ? formatCurrency(row.credit, currency) : '', colCredit, y + 5);
    doc.text(formatCurrency(row.balance, currency), colBalance, y + 5);
    y += PDF.tableRowHeight;
  }

  y += 4;
  drawHLine(doc, y, true);
  doc.save(`statement-${companyName.replace(/\s+/g, '-')}-${fromDate}-${toDate}.pdf`);
}
