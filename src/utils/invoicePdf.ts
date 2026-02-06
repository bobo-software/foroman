import InvoiceService from '../services/invoiceService';
import InvoiceItemService from '../services/invoiceItemService';
import type { Invoice, InvoiceItem } from '../types/invoice';
import type { Business } from '../types/business';
import { formatCurrency } from './currency';
import { useBusinessStore } from '../stores/data/BusinessStore';

/** Fetch invoice + line items by id, then download PDF. Use from list view. */
export async function downloadInvoicePdfById(invoiceId: number): Promise<void> {
  const [invoice, items] = await Promise.all([
    InvoiceService.findById(invoiceId),
    InvoiceItemService.findByInvoiceId(invoiceId),
  ]);
  if (!invoice) throw new Error('Invoice not found');
  const lineItems = Array.isArray(items) ? items : [];
  const business = useBusinessStore.getState().currentBusiness;
  await generateInvoicePdf(invoice, lineItems, business);
}

const PDF = {
  margin: 15,
  pageWidth: 210,
  pageHeight: 297,
  lineHeight: 5,
  get contentWidth() {
    return this.pageWidth - this.margin * 2;
  },
};

function drawHLine(doc: import('jspdf').jsPDF, y: number, thick = false) {
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(thick ? 0.6 : 0.3);
  doc.line(PDF.margin, y, PDF.pageWidth - PDF.margin, y);
}

export async function generateInvoicePdf(
  invoice: Invoice,
  lineItems: InvoiceItem[] = [],
  business?: Business | null
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const margin = PDF.margin;
  const lh = PDF.lineHeight;
  const contentWidth = PDF.contentWidth;
  const rightEdge = PDF.pageWidth - margin;
  const middleX = PDF.pageWidth / 2;
  let y = margin;

  const curr = invoice.currency || 'ZAR';

  // ============ HEADER SECTION ============
  // Left column: Business name and address
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(business?.name || 'Business Name', margin, y);
  y += lh + 1;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  if (business?.address) {
    const addressLines = doc.splitTextToSize(business.address, 60);
    doc.text(addressLines, margin, y);
    y += addressLines.length * 4;
  }
  
  // Middle column: Phone, VAT, Reg (positioned at top)
  let headerY = margin;
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  if (business?.phone) {
    doc.text(`Tel: ${business.phone}`, middleX - 15, headerY);
    headerY += 4;
  }
  if (business?.vat_number) {
    doc.text(`VAT: ${business.vat_number}`, middleX - 15, headerY);
    headerY += 4;
  }
  if (business?.registration_number) {
    doc.text(`Reg: ${business.registration_number}`, middleX - 15, headerY);
  }

  // Right column: Invoice number, Order number, Page
  headerY = margin;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`Invoice`, rightEdge, headerY, { align: 'right' });
  headerY += 6;
  doc.setFontSize(11);
  doc.text(`#${invoice.invoice_number}`, rightEdge, headerY, { align: 'right' });
  headerY += 5;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  if (invoice.order_number) {
    doc.text(`Order: ${invoice.order_number}`, rightEdge, headerY, { align: 'right' });
    headerY += 4;
  }
  doc.text(`Page 1`, rightEdge, headerY, { align: 'right' });
  
  // Status badge
  headerY += 5;
  const statusColors: Record<string, [number, number, number]> = {
    draft: [100, 100, 100],
    sent: [59, 130, 246],
    paid: [34, 197, 94],
    overdue: [239, 68, 68],
    cancelled: [156, 163, 175],
  };
  const statusColor = statusColors[invoice.status] || [100, 100, 100];
  doc.setTextColor(...statusColor);
  doc.setFontSize(8);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, rightEdge, headerY, { align: 'right' });

  y = Math.max(y, headerY) + 8;
  drawHLine(doc, y, true);
  y += 8;

  // ============ CUSTOMER SECTION ============
  const customerLeftX = margin;
  const customerRightX = middleX + 10;
  let customerY = y;
  let deliveryY = y;

  // Left: Customer details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', customerLeftX, customerY);
  customerY += lh;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(invoice.customer_name, customerLeftX, customerY);
  customerY += lh;

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  if (invoice.customer_vat_number) {
    doc.text(`VAT: ${invoice.customer_vat_number}`, customerLeftX, customerY);
    customerY += 4;
  }
  if (invoice.customer_address) {
    const addrLines = doc.splitTextToSize(invoice.customer_address, 70);
    doc.text(addrLines, customerLeftX, customerY);
    customerY += addrLines.length * 4;
  }
  if (invoice.customer_email) {
    doc.text(invoice.customer_email, customerLeftX, customerY);
    customerY += 4;
  }

  // Right: Delivery details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Deliver To:', customerRightX, deliveryY);
  deliveryY += lh;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  if (invoice.delivery_address) {
    const delAddrLines = doc.splitTextToSize(invoice.delivery_address, 70);
    doc.text(delAddrLines, customerRightX, deliveryY);
    deliveryY += delAddrLines.length * 4;
  } else {
    doc.text('Same as billing address', customerRightX, deliveryY);
    deliveryY += 4;
  }

  if (invoice.delivery_conditions) {
    deliveryY += 2;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const conditionLabel = invoice.delivery_conditions === 'collect' ? 'COLLECT' : 'DELIVER';
    doc.text(`Delivery: ${conditionLabel}`, customerRightX, deliveryY);
  }

  y = Math.max(customerY, deliveryY) + 6;
  drawHLine(doc, y);
  y += 6;

  // ============ DATES & TERMS ROW ============
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  const dateColWidth = contentWidth / 3;
  doc.text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, margin, y);
  doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, margin + dateColWidth, y);
  if (invoice.terms) {
    doc.text(`Terms: ${invoice.terms}`, margin + dateColWidth * 2, y);
  }
  
  y += lh + 6;

  // ============ LINE ITEMS TABLE ============
  const subtotalFromLines = lineItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const subtotal = lineItems.length > 0 ? subtotalFromLines : Number(invoice.subtotal) || 0;
  const vatRate = Number(invoice.tax_rate) || 0;
  const vatAmount = (subtotal * vatRate) / 100;
  const total = subtotal + vatAmount;

  if (lineItems.length > 0) {
    // Table header
    const colWidths = [25, 70, 20, 30, 35]; // SKU, Description, Qty, Unit Price, Line Total
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const colStart = (i: number) => margin + colWidths.slice(0, i).reduce((a, b) => a + b, 0);

    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, tableWidth, 8, 'F');
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, tableWidth, 8, 'S');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text('SKU', colStart(0) + 2, y + 5.5);
    doc.text('Description', colStart(1) + 2, y + 5.5);
    doc.text('Qty', colStart(2) + 2, y + 5.5);
    doc.text('Unit Price', colStart(3) + 2, y + 5.5);
    doc.text('Line Total', colStart(4) + 2, y + 5.5);
    
    const tableTop = y;
    y += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    lineItems.forEach((item, idx) => {
      const rowY = y;
      // Alternating row background
      if (idx % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, rowY, tableWidth, 7, 'F');
      }
      
      doc.setFontSize(9);
      const sku = item.sku || '—';
      doc.text(sku.slice(0, 12), colStart(0) + 2, rowY + 5);
      doc.text(String(item.description).slice(0, 38), colStart(1) + 2, rowY + 5);
      doc.text(String(item.quantity), colStart(2) + 2, rowY + 5);
      doc.text(formatCurrency(Number(item.unit_price), curr), colStart(3) + 2, rowY + 5);
      doc.text(formatCurrency(Number(item.total), curr), colStart(4) + 2, rowY + 5);
      y += 7;
    });

    // Draw table border and column lines
    doc.setDrawColor(180, 180, 180);
    doc.rect(margin, tableTop, tableWidth, y - tableTop, 'S');
    for (let i = 1; i < colWidths.length; i++) {
      doc.line(colStart(i), tableTop, colStart(i), y);
    }
    
    y += 8;
  }

  // ============ BOTTOM SECTION: BANKING + TOTALS ============
  const bankingX = margin;
  const totalsX = middleX + 20;
  let bankingY = y;
  let totalsY = y;

  // Left: Banking details
  if (business?.banking_details) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Banking Details:', bankingX, bankingY);
    bankingY += lh;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const bankLines = doc.splitTextToSize(business.banking_details, 70);
    doc.text(bankLines, bankingX, bankingY);
    bankingY += bankLines.length * 4;
  }

  // Right: Totals (aligned right)
  const totalsWidth = 70;
  const totalsRightX = rightEdge;
  const totalsLabelX = totalsRightX - totalsWidth;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Subtotal:', totalsLabelX, totalsY);
  doc.text(formatCurrency(subtotal, curr), totalsRightX, totalsY, { align: 'right' });
  totalsY += lh;
  
  doc.text(`VAT (${vatRate}%):`, totalsLabelX, totalsY);
  doc.text(formatCurrency(vatAmount, curr), totalsRightX, totalsY, { align: 'right' });
  totalsY += lh;
  
  // Total line with emphasis
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  drawHLine(doc, totalsY - 1);
  totalsY += 3;
  doc.text('Total:', totalsLabelX, totalsY);
  doc.text(formatCurrency(total, curr), totalsRightX, totalsY, { align: 'right' });
  totalsY += 2;
  drawHLine(doc, totalsY);

  y = Math.max(bankingY, totalsY) + 10;

  // ============ NOTES SECTION ============
  if (invoice.notes) {
    drawHLine(doc, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('Notes:', margin, y);
    y += lh;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const noteLines = doc.splitTextToSize(invoice.notes, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4 + 8;
  }

  // ============ SIGNATURE SECTION ============
  // Only add if there's enough space, otherwise new page
  if (y > 240) {
    doc.addPage();
    y = margin;
  }

  y = Math.max(y, 230); // Position signature section near bottom
  
  drawHLine(doc, y);
  y += 10;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');

  const sigLineWidth = 50;
  const sigGap = 20;
  const sigStartX = margin + 10;

  // Name field
  doc.text('Full Name & Surname:', sigStartX, y);
  doc.line(sigStartX + 40, y + 1, sigStartX + 40 + sigLineWidth, y + 1);

  // Date field  
  const dateFieldX = sigStartX + 40 + sigLineWidth + sigGap;
  doc.text('Date:', dateFieldX, y);
  doc.line(dateFieldX + 15, y + 1, dateFieldX + 15 + 40, y + 1);

  // Signature field
  const signFieldX = dateFieldX + 15 + 40 + sigGap;
  doc.text('Signature:', signFieldX, y);
  doc.line(signFieldX + 22, y + 1, rightEdge - 5, y + 1);

  // ============ FOOTER ============
  y = PDF.pageHeight - 12;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Foroman by Bobo Softwares (2026)', middleX, y, { align: 'center' });

  doc.save(`invoice-${invoice.invoice_number}.pdf`);
}
