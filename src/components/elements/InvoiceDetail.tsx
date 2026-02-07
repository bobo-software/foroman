import { useState, useEffect, useCallback } from 'react';
import { LuFileDown } from 'react-icons/lu';
import type { Invoice, InvoiceItem } from '../../types/invoice';
import InvoiceService from '../../services/invoiceService';
import InvoiceItemService from '../../services/invoiceItemService';
import { formatCurrency } from '../../utils/currency';
import { generateInvoicePdf } from '../../utils/invoicePdf';
import { useBusinessStore } from '../../stores/data/BusinessStore';
import { TEMPLATE_LIST, getTemplateConfig, type DocumentTemplateId, type RGB } from '../../types/documentTemplate';

interface InvoiceDetailProps {
  invoiceId: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function InvoiceDetail({ invoiceId, onEdit, onDelete }: InvoiceDetailProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const business = useBusinessStore((s) => s.currentBusiness);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplateId>(
    (business?.document_template as DocumentTemplateId) || 'classic'
  );

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const [inv, items] = await Promise.all([
        InvoiceService.findById(invoiceId),
        InvoiceItemService.findByInvoiceId(invoiceId),
      ]);
      setInvoice(inv);
      setLineItems(Array.isArray(items) ? items : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = useCallback(async () => {
    if (!invoice) return;
    setExporting(true);
    try {
      await generateInvoicePdf(invoice, lineItems, business, selectedTemplate);
    } finally {
      setExporting(false);
    }
  }, [invoice, lineItems, business, selectedTemplate]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      await InvoiceService.delete(invoiceId);
      onDelete?.();
    } catch (err: any) {
      alert('Failed to delete invoice: ' + err.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300',
      sent: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      paid: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      overdue: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      cancelled: 'bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400',
    };
    return statusMap[status] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto p-4 md:p-8">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-[900px] mx-auto p-4 md:p-8">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg">
          {error || 'Invoice not found'}
        </div>
      </div>
    );
  }

  const vatRate = Number(invoice.tax_rate) || 0;
  const subtotalFromLines = lineItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const subtotal = lineItems.length > 0 ? subtotalFromLines : Number(invoice.subtotal) || 0;
  const vatAmount = (subtotal * vatRate) / 100;
  const total = subtotal + vatAmount;

  // ── Derive theme from template config ──
  const tplConfig = getTemplateConfig(selectedTemplate);
  const rgb = (c: RGB) => `rgb(${c[0]},${c[1]},${c[2]})`;
  const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  return (
    <div className="max-w-[900px] mx-auto p-4 md:p-8">
      {/* Header with actions */}
      <div className="flex flex-col gap-4 mb-8 pb-6 border-b-2 border-gray-200 dark:border-gray-700 md:flex-row md:justify-between md:items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="m-0 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Invoice {invoice.invoice_number}
            </h1>
            {invoice.order_number && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                (Order: {invoice.order_number})
              </span>
            )}
          </div>
          <span
            className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium capitalize ${getStatusBadgeClass(invoice.status)}`}
          >
            {invoice.status}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 md:w-auto w-full">
          {/* Template selector + Export PDF */}
          <div className="flex items-center gap-0 flex-1 md:flex-none">
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value as DocumentTemplateId)}
              className="h-[42px] px-3 text-sm font-medium rounded-l-lg border border-r-0 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 transition-colors"
            >
              {TEMPLATE_LIST.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 h-[42px] px-5 rounded-r-lg text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
            >
              {exporting ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting…
                </>
              ) : (
                <>
                  <LuFileDown size={18} aria-hidden />
                  Export PDF
                </>
              )}
            </button>
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex-1 md:flex-none"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors flex-1 md:flex-none"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* ── Invoice card — styled by selected template ── */}
      <div
        className="rounded-lg shadow border overflow-hidden transition-all duration-300"
        style={{ borderColor: rgba(tplConfig.primaryColor, 0.2) }}
      >
        {/* Accent bar (Modern) */}
        <div
          className="transition-all duration-300"
          style={{
            height: tplConfig.accentBar ? `${Math.max(tplConfig.accentBarHeight, 4)}px` : '0px',
            backgroundColor: rgb(tplConfig.primaryColor),
          }}
        />

        <div className="bg-white dark:bg-gray-800 p-6 md:p-8">

          {/* ── Invoice title row ── */}
          <div
            className="flex items-center justify-between mb-6 pb-4 transition-colors duration-300"
            style={{ borderBottom: `2px solid ${rgba(tplConfig.primaryColor, 0.25)}` }}
          >
            <h2
              className="m-0 text-xl font-bold uppercase tracking-wide transition-colors duration-300"
              style={{ color: rgb(tplConfig.primaryColor) }}
            >
              Invoice
            </h2>
            <span
              className="text-lg font-semibold transition-colors duration-300"
              style={{ color: rgb(tplConfig.primaryColor) }}
            >
              #{invoice.invoice_number}
            </span>
          </div>

          {/* ── Bill To / Deliver To ── */}
          <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3
                  className="mb-3 text-sm font-semibold uppercase tracking-wide transition-colors duration-300"
                  style={{ color: rgb(tplConfig.secondaryTextColor) }}
                >
                  Bill To
                </h3>
                <div className="space-y-2">
                  <p className="m-0 text-base font-medium" style={{ color: rgb(tplConfig.textColor) }}>
                    {invoice.customer_name}
                  </p>
                  {invoice.customer_vat_number && (
                    <p className="m-0 text-sm" style={{ color: rgb(tplConfig.secondaryTextColor) }}>
                      VAT: {invoice.customer_vat_number}
                    </p>
                  )}
                  {invoice.customer_address && (
                    <p className="m-0 text-sm whitespace-pre-line" style={{ color: rgb(tplConfig.secondaryTextColor) }}>
                      {invoice.customer_address}
                    </p>
                  )}
                  {invoice.customer_email && (
                    <p className="m-0 text-sm" style={{ color: rgb(tplConfig.secondaryTextColor) }}>
                      {invoice.customer_email}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h3
                  className="mb-3 text-sm font-semibold uppercase tracking-wide transition-colors duration-300"
                  style={{ color: rgb(tplConfig.secondaryTextColor) }}
                >
                  Deliver To
                </h3>
                <div className="space-y-2">
                  {invoice.delivery_address ? (
                    <p className="m-0 text-sm whitespace-pre-line" style={{ color: rgb(tplConfig.secondaryTextColor) }}>
                      {invoice.delivery_address}
                    </p>
                  ) : (
                    <p className="m-0 text-sm italic" style={{ color: rgb(tplConfig.secondaryTextColor) }}>
                      Same as billing address
                    </p>
                  )}
                  {invoice.delivery_conditions && (
                    <div className="mt-2">
                      <span
                        className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase transition-colors duration-300"
                        style={{
                          backgroundColor: rgba(tplConfig.primaryColor, 0.1),
                          color: rgb(tplConfig.primaryColor),
                        }}
                      >
                        {invoice.delivery_conditions}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Dates & Terms ── */}
          <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h3
              className="mb-3 text-sm font-semibold uppercase tracking-wide transition-colors duration-300"
              style={{ color: rgb(tplConfig.secondaryTextColor) }}
            >
              Invoice Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: rgb(tplConfig.secondaryTextColor) }}>
                  Issue Date
                </label>
                <p className="m-0 text-base" style={{ color: rgb(tplConfig.textColor) }}>
                  {formatDate(invoice.issue_date)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: rgb(tplConfig.secondaryTextColor) }}>
                  Due Date
                </label>
                <p className="m-0 text-base" style={{ color: rgb(tplConfig.textColor) }}>
                  {formatDate(invoice.due_date)}
                </p>
              </div>
              {invoice.terms && (
                <div>
                  <label className="block text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: rgb(tplConfig.secondaryTextColor) }}>
                    Terms
                  </label>
                  <p className="m-0 text-base" style={{ color: rgb(tplConfig.textColor) }}>{invoice.terms}</p>
                </div>
              )}
              {invoice.order_number && (
                <div>
                  <label className="block text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: rgb(tplConfig.secondaryTextColor) }}>
                    Order Number
                  </label>
                  <p className="m-0 text-base" style={{ color: rgb(tplConfig.textColor) }}>
                    {invoice.order_number}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Line Items Table ── */}
          <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h3
              className="mb-3 text-sm font-semibold uppercase tracking-wide transition-colors duration-300"
              style={{ color: rgb(tplConfig.secondaryTextColor) }}
            >
              Invoice Items
            </h3>
            {lineItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table
                  className="w-full text-sm transition-all duration-300"
                  style={{
                    borderCollapse: tplConfig.tableBorders ? 'collapse' : 'separate',
                    borderSpacing: tplConfig.tableBorders ? '0' : '0 1px',
                  }}
                >
                  <thead>
                    <tr
                      className="transition-colors duration-300"
                      style={{
                        backgroundColor: rgb(tplConfig.tableHeaderBg),
                        color: rgb(tplConfig.tableHeaderText),
                      }}
                    >
                      <th
                        className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{
                          borderBottom: tplConfig.tableBorders ? `1px solid ${rgba(tplConfig.primaryColor, 0.2)}` : 'none',
                          borderRight: tplConfig.tableColumnDividers ? `1px solid ${rgba(tplConfig.tableHeaderText, 0.2)}` : 'none',
                        }}
                      >
                        SKU
                      </th>
                      <th
                        className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{
                          borderBottom: tplConfig.tableBorders ? `1px solid ${rgba(tplConfig.primaryColor, 0.2)}` : 'none',
                          borderRight: tplConfig.tableColumnDividers ? `1px solid ${rgba(tplConfig.tableHeaderText, 0.2)}` : 'none',
                        }}
                      >
                        Description
                      </th>
                      <th
                        className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide"
                        style={{
                          borderBottom: tplConfig.tableBorders ? `1px solid ${rgba(tplConfig.primaryColor, 0.2)}` : 'none',
                          borderRight: tplConfig.tableColumnDividers ? `1px solid ${rgba(tplConfig.tableHeaderText, 0.2)}` : 'none',
                        }}
                      >
                        Qty
                      </th>
                      <th
                        className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide"
                        style={{
                          borderBottom: tplConfig.tableBorders ? `1px solid ${rgba(tplConfig.primaryColor, 0.2)}` : 'none',
                          borderRight: tplConfig.tableColumnDividers ? `1px solid ${rgba(tplConfig.tableHeaderText, 0.2)}` : 'none',
                        }}
                      >
                        Unit Price
                      </th>
                      <th
                        className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide"
                        style={{
                          borderBottom: tplConfig.tableBorders ? `1px solid ${rgba(tplConfig.primaryColor, 0.2)}` : 'none',
                        }}
                      >
                        Line Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, idx) => {
                      const qty = Number(item.quantity) || 0;
                      const unitPrice = Number(item.unit_price) || 0;
                      const lineTotal = Number(item.total) ?? qty * unitPrice;
                      const isAlt = idx % 2 === 1;
                      return (
                        <tr
                          key={item.id ?? `${item.description}-${qty}`}
                          className="transition-colors duration-300"
                          style={{
                            backgroundColor: tplConfig.tableAlternateRows && isAlt
                              ? rgb(tplConfig.tableAlternateRowBg)
                              : 'transparent',
                            borderBottom: tplConfig.tableBorders
                              ? `1px solid ${rgba(tplConfig.primaryColor, 0.1)}`
                              : `1px solid rgba(200,200,200,0.3)`,
                          }}
                        >
                          <td
                            className="px-3 py-2 font-mono text-xs"
                            style={{
                              color: rgb(tplConfig.secondaryTextColor),
                              borderRight: tplConfig.tableColumnDividers ? `1px solid ${rgba(tplConfig.primaryColor, 0.08)}` : 'none',
                            }}
                          >
                            {item.sku || '—'}
                          </td>
                          <td
                            className="px-3 py-2"
                            style={{
                              color: rgb(tplConfig.textColor),
                              borderRight: tplConfig.tableColumnDividers ? `1px solid ${rgba(tplConfig.primaryColor, 0.08)}` : 'none',
                            }}
                          >
                            {item.description}
                          </td>
                          <td
                            className="px-3 py-2 text-right"
                            style={{
                              color: rgb(tplConfig.textColor),
                              borderRight: tplConfig.tableColumnDividers ? `1px solid ${rgba(tplConfig.primaryColor, 0.08)}` : 'none',
                            }}
                          >
                            {qty}
                          </td>
                          <td
                            className="px-3 py-2 text-right"
                            style={{
                              color: rgb(tplConfig.textColor),
                              borderRight: tplConfig.tableColumnDividers ? `1px solid ${rgba(tplConfig.primaryColor, 0.08)}` : 'none',
                            }}
                          >
                            {formatCurrency(unitPrice, invoice.currency)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium" style={{ color: rgb(tplConfig.textColor) }}>
                            {formatCurrency(lineTotal, invoice.currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="m-0 p-4 text-sm rounded-lg" style={{ color: rgb(tplConfig.secondaryTextColor), backgroundColor: rgba(tplConfig.primaryColor, 0.04) }}>
                No line items on this invoice.
              </p>
            )}
          </div>

          {/* ── Banking Details & Totals ── */}
          <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                {business?.banking_details && (
                  <>
                    <h3
                      className="mb-3 text-sm font-semibold uppercase tracking-wide transition-colors duration-300"
                      style={{ color: rgb(tplConfig.secondaryTextColor) }}
                    >
                      Banking Details
                    </h3>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: rgba(tplConfig.primaryColor, 0.04) }}>
                      <p className="m-0 text-sm whitespace-pre-line" style={{ color: rgb(tplConfig.secondaryTextColor) }}>
                        {business.banking_details}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div>
                <h3
                  className="mb-3 text-sm font-semibold uppercase tracking-wide transition-colors duration-300"
                  style={{ color: rgb(tplConfig.secondaryTextColor) }}
                >
                  Totals
                </h3>
                <div
                  className="rounded-lg transition-all duration-300"
                  style={{
                    padding: tplConfig.totalsBoxed ? '16px' : '0px',
                    backgroundColor: tplConfig.totalsBoxed ? rgba(tplConfig.primaryColor, 0.05) : 'transparent',
                    border: tplConfig.totalsBoxed ? `1px solid ${rgba(tplConfig.primaryColor, 0.15)}` : 'none',
                  }}
                >
                  <div className="space-y-0">
                    <div
                      className="flex justify-between py-3 text-base transition-colors duration-300"
                      style={{ color: rgb(tplConfig.textColor), borderBottom: `1px solid ${rgba(tplConfig.primaryColor, 0.12)}` }}
                    >
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal, invoice.currency)}</span>
                    </div>
                    <div
                      className="flex justify-between py-3 text-base transition-colors duration-300"
                      style={{ color: rgb(tplConfig.textColor), borderBottom: `1px solid ${rgba(tplConfig.primaryColor, 0.12)}` }}
                    >
                      <span>VAT ({vatRate}%)</span>
                      <span>{formatCurrency(vatAmount, invoice.currency)}</span>
                    </div>
                    <div
                      className="flex justify-between py-3 mt-1 text-xl font-semibold transition-colors duration-300"
                      style={{
                        color: rgb(tplConfig.primaryColor),
                        borderTop: `2px solid ${rgb(tplConfig.primaryColor)}`,
                      }}
                    >
                      <span>Total</span>
                      <span>{formatCurrency(total, invoice.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Notes ── */}
          {invoice.notes && (
            <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
              <h3
                className="mb-3 text-sm font-semibold uppercase tracking-wide transition-colors duration-300"
                style={{ color: rgb(tplConfig.secondaryTextColor) }}
              >
                Notes
              </h3>
              <p
                className="m-0 p-4 rounded-lg leading-relaxed whitespace-pre-wrap text-sm"
                style={{ color: rgb(tplConfig.secondaryTextColor), backgroundColor: rgba(tplConfig.primaryColor, 0.04) }}
              >
                {invoice.notes}
              </p>
            </div>
          )}

          {/* ── Footer ── */}
          {invoice.created_at && (
            <div className="mt-8 pt-4 text-right transition-all duration-300" style={{
              borderTop: tplConfig.footerAccentLine
                ? `2px solid ${rgb(tplConfig.primaryColor)}`
                : '1px solid rgba(200,200,200,0.4)',
            }}>
              <p className="m-0 text-sm" style={{ color: rgb(tplConfig.secondaryTextColor) }}>
                Created: {new Date(invoice.created_at).toLocaleString()}
                {invoice.updated_at && invoice.updated_at !== invoice.created_at && (
                  <> &bull; Updated: {new Date(invoice.updated_at).toLocaleString()}</>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
