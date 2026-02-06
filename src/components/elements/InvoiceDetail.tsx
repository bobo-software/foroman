import { useState, useEffect, useCallback } from 'react';
import { LuFileDown } from 'react-icons/lu';
import type { Invoice, InvoiceItem } from '../../types/invoice';
import InvoiceService from '../../services/invoiceService';
import InvoiceItemService from '../../services/invoiceItemService';
import { formatCurrency } from '../../utils/currency';
import { generateInvoicePdf } from '../../utils/invoicePdf';
import { useBusinessStore } from '../../stores/data/BusinessStore';

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
  const business = useBusinessStore((s) => s.currentBusiness);

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
    await generateInvoicePdf(invoice, lineItems, business);
  }, [invoice, lineItems, business]);

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
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors flex-1 md:flex-none min-w-0"
          >
            <LuFileDown size={18} aria-hidden />
            Export PDF
          </button>
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

      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        {/* Company & Delivery Info - Two columns */}
        <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bill To */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
                Bill To
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="m-0 text-base font-medium text-gray-800 dark:text-gray-200">
                    {invoice.customer_name}
                  </p>
                </div>
                {invoice.customer_vat_number && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                      VAT Number
                    </label>
                    <p className="m-0 text-sm text-gray-700 dark:text-gray-300">
                      {invoice.customer_vat_number}
                    </p>
                  </div>
                )}
                {invoice.customer_address && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                      Address
                    </label>
                    <p className="m-0 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {invoice.customer_address}
                    </p>
                  </div>
                )}
                {invoice.customer_email && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                      Email
                    </label>
                    <p className="m-0 text-sm text-gray-700 dark:text-gray-300">
                      {invoice.customer_email}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Deliver To */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
                Deliver To
              </h2>
              <div className="space-y-3">
                {invoice.delivery_address ? (
                  <p className="m-0 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {invoice.delivery_address}
                  </p>
                ) : (
                  <p className="m-0 text-sm text-gray-500 dark:text-gray-400 italic">
                    Same as billing address
                  </p>
                )}
                {invoice.delivery_conditions && (
                  <div className="mt-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                        invoice.delivery_conditions === 'collect'
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {invoice.delivery_conditions}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Details - Dates & Terms */}
        <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
            Invoice Details
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                Issue Date
              </label>
              <p className="m-0 text-base text-gray-800 dark:text-gray-200">
                {formatDate(invoice.issue_date)}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                Due Date
              </label>
              <p className="m-0 text-base text-gray-800 dark:text-gray-200">
                {formatDate(invoice.due_date)}
              </p>
            </div>
            {invoice.terms && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                  Terms
                </label>
                <p className="m-0 text-base text-gray-800 dark:text-gray-200">{invoice.terms}</p>
              </div>
            )}
            {invoice.order_number && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                  Order Number
                </label>
                <p className="m-0 text-base text-gray-800 dark:text-gray-200">
                  {invoice.order_number}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Items with SKU */}
        <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
            Invoice Items
          </h2>
          {lineItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                      SKU
                    </th>
                    <th className="px-3 py-2 text-left border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                      Description
                    </th>
                    <th className="px-3 py-2 text-right border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-right border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                      Unit Price
                    </th>
                    <th className="px-3 py-2 text-right border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                      Line Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => {
                    const qty = Number(item.quantity) || 0;
                    const unitPrice = Number(item.unit_price) || 0;
                    const lineTotal = Number(item.total) ?? qty * unitPrice;
                    return (
                      <tr
                        key={item.id ?? `${item.description}-${qty}`}
                        className={`border-b border-gray-200 dark:border-gray-600 ${
                          idx % 2 === 1 ? 'bg-gray-50 dark:bg-gray-700/30' : ''
                        }`}
                      >
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400 font-mono text-xs">
                          {item.sku || '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-800 dark:text-gray-200">
                          {item.description}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">
                          {qty}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">
                          {formatCurrency(unitPrice, invoice.currency)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200 font-medium">
                          {formatCurrency(lineTotal, invoice.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="m-0 p-4 text-gray-500 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              No line items on this invoice.
            </p>
          )}
        </div>

        {/* Banking Details & Totals - Two columns */}
        <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Banking Details */}
            <div>
              {business?.banking_details && (
                <>
                  <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Banking Details
                  </h2>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="m-0 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {business.banking_details}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Totals */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
                Totals
              </h2>
              <div className="space-y-0">
                <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-600 text-base text-gray-800 dark:text-gray-200">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal, invoice.currency)}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-600 text-base text-gray-800 dark:text-gray-200">
                  <span>VAT ({vatRate}%)</span>
                  <span>{formatCurrency(vatAmount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between py-4 mt-2 pt-4 border-t-2 border-gray-800 dark:border-gray-300 text-xl font-semibold text-gray-900 dark:text-gray-100">
                  <span>Total</span>
                  <span>{formatCurrency(total, invoice.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">Notes</h2>
            <p className="m-0 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {invoice.notes}
            </p>
          </div>
        )}

        {/* Footer timestamps */}
        {invoice.created_at && (
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-right">
            <p className="m-0 text-sm text-gray-400 dark:text-gray-500">
              Created: {new Date(invoice.created_at).toLocaleString()}
              {invoice.updated_at && invoice.updated_at !== invoice.created_at && (
                <> • Updated: {new Date(invoice.updated_at).toLocaleString()}</>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
