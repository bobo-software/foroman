import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuFileDown, LuFileText } from 'react-icons/lu';
import type { Quotation, QuotationLine } from '../../types/quotation';
import type { CreateInvoiceDto } from '../../types/invoice';
import type { Project } from '../../types/project';
import type { BankingDetails } from '../../types/bankingDetails';
import { ACCOUNT_TYPES } from '../../types/bankingDetails';
import type { Contact } from '../../types/contact';
import QuotationService from '../../services/quotationService';
import QuotationLineService from '../../services/quotationLineService';
import InvoiceService from '../../services/invoiceService';
import InvoiceItemService from '../../services/invoiceItemService';
import ProjectService from '../../services/projectService';
import BankingDetailsService from '../../services/bankingDetailsService';
import ContactService from '../../services/contactService';
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
  const [project, setProject] = useState<Project | null>(null);
  const [bankingDetails, setBankingDetails] = useState<BankingDetails[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

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
      if (quo?.project_id != null) {
        ProjectService.findById(quo.project_id).then((p) => setProject(p));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load quotation');
    } finally {
      setLoading(false);
    }
  };

  const business = useBusinessStore((s) => s.currentBusiness);

  useEffect(() => {
    if (business?.id == null) return;
    const fetchBanking = business.user_id != null
      ? BankingDetailsService.findByUserId(business.user_id)
      : BankingDetailsService.findByCompanyId(business.id);
    fetchBanking.then((details) =>
      setBankingDetails(details.filter((d) => d.is_active !== false))
    );
    ContactService.findByCompanyId(business.id).then(setContacts);
  }, [business?.id, business?.user_id]);

  const handleDownloadPdf = useCallback(async () => {
    if (!quotation) return;
    await generateQuotationPdf(quotation, lineItems, business);
  }, [quotation, lineItems, business]);

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
  const globalDiscountPercent = Number(quotation.discount_percent) || 0;
  const linesSubtotal = lineItems.length > 0
    ? lineItems.reduce((sum, item) => sum + Number(item.total || 0), 0)
    : Number(quotation.subtotal) || 0;
  const discountAmount = (linesSubtotal * globalDiscountPercent) / 100;
  const subtotal = linesSubtotal - discountAmount;
  const vatAmount = (subtotal * vatRate) / 100;
  const total = subtotal + vatAmount;

  const hasPage2 = !!quotation.notes;

  return (
    <div className="w-full max-w-[794px] mx-auto px-4 py-4 flex flex-col gap-4">
      {/* Action bar — outside the pages */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="m-0 mb-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Quotation {quotation.quotation_number}
          </h1>
          <span
            className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadgeClass(quotation.status)}`}
          >
            {quotation.status}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors"
          >
            <LuFileDown size={15} aria-hidden />
            Export PDF
          </button>
          <button
            type="button"
            onClick={handleConvertToInvoice}
            disabled={converting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <LuFileText size={15} aria-hidden />
            {quotation.converted_invoice_id != null ? 'View invoice' : converting ? 'Converting…' : 'Convert to invoice'}
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Page 1 */}
      <div className="bg-white dark:bg-gray-800 w-full min-h-[1123px] p-8 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col">
        {/* From / To */}
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
            <div className="pr-6">
              <h2 className="mb-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">From</h2>
              {business ? (
                <div className="flex flex-col gap-0.5 text-sm">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{business.name}</span>
                  {contacts[0]?.email && <span className="text-gray-500 dark:text-gray-400">{contacts[0].email}</span>}
                  {business.phone && <span className="text-gray-500 dark:text-gray-400">{business.phone}</span>}
                  {business.address && <span className="text-gray-500 dark:text-gray-400">{business.address}</span>}
                </div>
              ) : (
                <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
              )}
            </div>
            <div className="pl-6">
              <h2 className="mb-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">To</h2>
              <div className="flex flex-col gap-0.5 text-sm">
                <span className="font-semibold text-gray-800 dark:text-gray-200">{quotation.customer_name}</span>
                {quotation.customer_email && <span className="text-gray-500 dark:text-gray-400">{quotation.customer_email}</span>}
                {quotation.customer_address && <span className="text-gray-500 dark:text-gray-400">{quotation.customer_address}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Quotation details */}
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="mb-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Quotation Details
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-0.5 text-sm text-gray-700 dark:text-gray-300">
            <span><span className="text-gray-400 dark:text-gray-500">Issued </span>{formatDate(quotation.issue_date)}</span>
            {quotation.valid_until && (
              <span><span className="text-gray-400 dark:text-gray-500">Valid until </span>{formatDate(quotation.valid_until)}</span>
            )}
            {project && (
              <span><span className="text-gray-400 dark:text-gray-500">Project </span>{project.name}</span>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Line Items
          </h2>
          {lineItems.length > 0 ? (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1.5 text-left border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Description</th>
                  <th className="px-2 py-1.5 text-right border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Qty</th>
                  <th className="px-2 py-1.5 text-right border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Unit Price</th>
                  <th className="px-2 py-1.5 text-right border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => {
                  const qty = Number(item.quantity) || 0;
                  const unitPrice = Number(item.unit_price) || 0;
                  const lineTotal = Number(item.total) ?? qty * unitPrice;
                  return (
                    <tr key={item.id ?? `${item.description}-${qty}`} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="px-2 py-2 text-gray-800 dark:text-gray-200">{item.description}</td>
                      <td className="px-2 py-2 text-right text-gray-800 dark:text-gray-200">{qty}</td>
                      <td className="px-2 py-2 text-right text-gray-800 dark:text-gray-200">{formatCurrency(unitPrice, quotation.currency)}</td>
                      <td className="px-2 py-2 text-right text-gray-800 dark:text-gray-200">{formatCurrency(lineTotal, quotation.currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="m-0 p-3 text-gray-500 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              No line items on this quotation.
            </p>
          )}
        </div>

        {/* Banking details + Totals side by side — pushed to bottom */}
        <div className="mt-auto pt-5 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-8 items-start">
            {/* Banking details */}
            {bankingDetails.length > 0 ? (
              <div>
                <h2 className="mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Banking Details
                </h2>
                {bankingDetails.map((bd) => (
                  <div key={bd.id} className="text-sm space-y-0.5">
                    {bd.label && <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{bd.label}</p>}
                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-gray-700 dark:text-gray-300">
                      <span className="text-gray-400 dark:text-gray-500">Bank</span>
                      <span>{bd.bank_name}</span>
                      {bd.account_holder && (
                        <>
                          <span className="text-gray-400 dark:text-gray-500">Account Holder</span>
                          <span>{bd.account_holder}</span>
                        </>
                      )}
                      <span className="text-gray-400 dark:text-gray-500">Account No.</span>
                      <span>{bd.account_number}</span>
                      {bd.account_type && (
                        <>
                          <span className="text-gray-400 dark:text-gray-500">Account Type</span>
                          <span>{ACCOUNT_TYPES.find((t) => t.value === bd.account_type)?.label ?? bd.account_type}</span>
                        </>
                      )}
                      {bd.branch_code && (
                        <>
                          <span className="text-gray-400 dark:text-gray-500">Branch Code</span>
                          <span>{bd.branch_code}</span>
                        </>
                      )}
                      {bd.swift_code && (
                        <>
                          <span className="text-gray-400 dark:text-gray-500">SWIFT</span>
                          <span>{bd.swift_code}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div />
            )}

            {/* Totals */}
            <div>
              {globalDiscountPercent > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200">
                  <span className="text-gray-500 dark:text-gray-400">Lines subtotal</span>
                  <span>{formatCurrency(linesSubtotal, quotation.currency)}</span>
                </div>
              )}
              {globalDiscountPercent > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600 text-sm text-red-600 dark:text-red-400">
                  <span>Discount ({globalDiscountPercent}%)</span>
                  <span>−{formatCurrency(discountAmount, quotation.currency)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200">
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span>{formatCurrency(subtotal, quotation.currency)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200">
                <span className="text-gray-500 dark:text-gray-400">VAT ({vatRate}%)</span>
                <span>{formatCurrency(vatAmount, quotation.currency)}</span>
              </div>
              <div className="flex justify-between py-2.5 border-t-2 border-gray-800 dark:border-gray-300 text-base font-semibold text-gray-900 dark:text-gray-100">
                <span>Total</span>
                <span>{formatCurrency(total, quotation.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer timestamp (no page 2) */}
        {!hasPage2 && quotation.created_at && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-right">
            <p className="m-0 text-xs text-gray-400 dark:text-gray-500">
              Created: {new Date(quotation.created_at).toLocaleString()}
              {quotation.updated_at && quotation.updated_at !== quotation.created_at && (
                <> • Updated: {new Date(quotation.updated_at).toLocaleString()}</>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Page 2 — only if notes exist */}
      {hasPage2 && (
        <div className="bg-white dark:bg-gray-800 w-full min-h-[1123px] p-8 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Notes</h2>
            <p className="m-0 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
              {quotation.notes}
            </p>
          </div>

          {quotation.created_at && (
            <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 text-right">
              <p className="m-0 text-xs text-gray-400 dark:text-gray-500">
                Created: {new Date(quotation.created_at).toLocaleString()}
                {quotation.updated_at && quotation.updated_at !== quotation.created_at && (
                  <> • Updated: {new Date(quotation.updated_at).toLocaleString()}</>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
