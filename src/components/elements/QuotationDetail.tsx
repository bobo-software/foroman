import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuFileDown, LuFileText } from 'react-icons/lu';
import type { Quotation, QuotationLine } from '../../types/quotation';
import type { CreateInvoiceDto } from '../../types/invoice';
import QuotationService from '../../services/quotationService';
import QuotationLineService from '../../services/quotationLineService';
import InvoiceService from '../../services/invoiceService';
import InvoiceItemService from '../../services/invoiceItemService';
import { useBusinessStore } from '../../stores/data/BusinessStore';
import { formatCurrency } from '../../utils/currency';
import { generateQuotationPdf } from '../../utils/quotationPdf';

interface QuotationDetailProps {
  quotationId: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function QuotationDetail({ quotationId, onEdit, onDelete }: QuotationDetailProps) {
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [lineItems, setLineItems] = useState<QuotationLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuotation();
  }, [quotationId]);

  const loadQuotation = async () => {
    try {
      setLoading(true);
      setError(null);
      const [quo, items] = await Promise.all([
        QuotationService.findById(quotationId),
        QuotationLineService.findByQuotationId(quotationId),
      ]);
      setQuotation(quo);
      setLineItems(Array.isArray(items) ? items : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = useCallback(async () => {
    if (!quotation) return;
    await generateQuotationPdf(quotation, lineItems);
  }, [quotation, lineItems]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;

    try {
      await QuotationService.delete(quotationId);
      onDelete?.();
    } catch (err: unknown) {
      alert('Failed to delete quotation: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleConvertToInvoice = useCallback(async () => {
    if (!quotation) return;
    const canConvert = quotation.status === 'accepted' || quotation.status === 'sent';
    if (!canConvert && quotation.status !== 'converted') {
      const ok = confirm(
        'This quotation is not accepted/sent. Convert anyway? (Accepted or sent is recommended.)'
      );
      if (!ok) return;
    }
    if (quotation.converted_invoice_id != null) {
      navigate(`/app/invoices/${quotation.converted_invoice_id}`);
      return;
    }
    try {
      setConverting(true);
      const count = await InvoiceService.count();
      const invoiceNumber = String(count + 1).padStart(4, '0');
      const issueDate = quotation.issue_date.split('T')[0];
      const validUntil = quotation.valid_until ? new Date(quotation.valid_until) : null;
      const issueDateObj = new Date(quotation.issue_date);
      const dueDate =
        validUntil && validUntil > issueDateObj
          ? validUntil.toISOString().split('T')[0]
          : new Date(issueDateObj.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const businessId = useBusinessStore.getState().currentBusiness?.id;
      const payload: CreateInvoiceDto = {
        invoice_number: invoiceNumber,
        customer_name: quotation.customer_name,
        customer_email: quotation.customer_email,
        customer_address: quotation.customer_address,
        issue_date: issueDate,
        due_date: dueDate,
        status: 'draft',
        subtotal: Number(quotation.subtotal) || 0,
        tax_rate: quotation.tax_rate,
        tax_amount: quotation.tax_amount,
        total: Number(quotation.total) || 0,
        currency: quotation.currency || 'ZAR',
        notes: quotation.notes,
        ...(businessId != null && { business_id: businessId }),
      };
      const created = await InvoiceService.create(payload);
      const newId = created?.id;
      if (newId != null && lineItems.length > 0) {
        await InvoiceItemService.insertMany(
          newId,
          lineItems.map((line) => ({
            description: line.description,
            quantity: line.quantity,
            unit_price: Number(line.unit_price) || 0,
            total: Number(line.total) || 0,
            ...(line.item_id != null && { item_id: line.item_id }),
          }))
        );
      }
      try {
        await QuotationService.update(quotationId, {
          status: 'converted',
          ...(newId != null && { converted_invoice_id: newId }),
        });
      } catch {
        // Backend may not have converted_invoice_id column yet
      }
      navigate(`/app/invoices/${newId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to convert to invoice');
      setConverting(false);
    }
  }, [quotation, lineItems, quotationId, navigate]);

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
      accepted: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      declined: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      expired: 'bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400',
      converted: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
    };
    return statusMap[status] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto p-4 md:p-8">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading quotation...</div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="max-w-[900px] mx-auto p-4 md:p-8">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg">
          {error || 'Quotation not found'}
        </div>
      </div>
    );
  }

  const vatRate = Number(quotation.tax_rate) || 0;
  const subtotalFromLines = lineItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const subtotal = lineItems.length > 0 ? subtotalFromLines : Number(quotation.subtotal) || 0;
  const vatAmount = (subtotal * vatRate) / 100;
  const total = subtotal + vatAmount;

  return (
    <div className="max-w-[900px] mx-auto p-4 md:p-8">
      <div className="flex flex-col gap-4 mb-8 pb-6 border-b-2 border-gray-200 dark:border-gray-700 md:flex-row md:justify-between md:items-start">
        <div>
          <h1 className="m-0 mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Quotation {quotation.quotation_number}
          </h1>
          <span
            className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium capitalize ${getStatusBadgeClass(quotation.status)}`}
          >
            {quotation.status}
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
          <button
            type="button"
            onClick={handleConvertToInvoice}
            disabled={converting}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1 md:flex-none min-w-0"
          >
            <LuFileText size={18} aria-hidden />
            {quotation.converted_invoice_id != null ? 'View invoice' : converting ? 'Converting…' : 'Convert to invoice'}
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
        <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
            Company Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                Company Name
              </label>
              <p className="m-0 text-base text-gray-800 dark:text-gray-200">{quotation.customer_name}</p>
            </div>
            {quotation.customer_email && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                  Email
                </label>
                <p className="m-0 text-base text-gray-800 dark:text-gray-200">
                  {quotation.customer_email}
                </p>
              </div>
            )}
            {quotation.customer_address && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                  Address
                </label>
                <p className="m-0 text-base text-gray-800 dark:text-gray-200">
                  {quotation.customer_address}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
            Quotation Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                Issue Date
              </label>
              <p className="m-0 text-base text-gray-800 dark:text-gray-200">
                {formatDate(quotation.issue_date)}
              </p>
            </div>
            {quotation.valid_until && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                  Valid Until
                </label>
                <p className="m-0 text-base text-gray-800 dark:text-gray-200">
                  {formatDate(quotation.valid_until)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
            Line Items
          </h2>
          {lineItems.length > 0 ? (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
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
                {lineItems.map((item) => {
                  const qty = Number(item.quantity) || 0;
                  const unitPrice = Number(item.unit_price) || 0;
                  const lineTotal = Number(item.total) ?? qty * unitPrice;
                  return (
                    <tr
                      key={item.id ?? `${item.description}-${qty}`}
                      className="border-b border-gray-200 dark:border-gray-600"
                    >
                      <td className="px-3 py-2 text-gray-800 dark:text-gray-200">
                        {item.description}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">
                        {qty}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">
                        {formatCurrency(unitPrice, quotation.currency)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">
                        {formatCurrency(lineTotal, quotation.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="m-0 p-4 text-gray-500 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              No line items on this quotation.
            </p>
          )}
        </div>

        <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
            Calculations
          </h2>
          <div className="max-w-md ml-auto space-y-0">
            <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-600 text-base text-gray-800 dark:text-gray-200">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, quotation.currency)}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-600 text-base text-gray-800 dark:text-gray-200">
              <span>VAT ({vatRate}%)</span>
              <span>{formatCurrency(vatAmount, quotation.currency)}</span>
            </div>
            <div className="flex justify-between py-4 mt-2 pt-4 border-t-2 border-gray-800 dark:border-gray-300 text-xl font-semibold text-gray-900 dark:text-gray-100">
              <span>Total</span>
              <span>{formatCurrency(total, quotation.currency)}</span>
            </div>
          </div>
        </div>

        {quotation.notes && (
          <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-200">Notes</h2>
            <p className="m-0 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {quotation.notes}
            </p>
          </div>
        )}

        {quotation.created_at && (
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-right">
            <p className="m-0 text-sm text-gray-400 dark:text-gray-500">
              Created: {new Date(quotation.created_at).toLocaleString()}
              {quotation.updated_at && quotation.updated_at !== quotation.created_at && (
                <> • Updated: {new Date(quotation.updated_at).toLocaleString()}</>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
