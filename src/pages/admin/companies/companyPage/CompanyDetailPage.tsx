import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CompanyService from '@/services/companyService';
import InvoiceService from '@/services/invoiceService';
import QuotationService from '@/services/quotationService';
import PaymentService from '@/services/paymentService';
import type { Company } from '@/types/company';
import type { Invoice } from '@/types/invoice';
import type { Quotation } from '@/types/quotation';
import type { Payment } from '@/types/payment';
import {
  CompanySummaryTab,
  CompanyQuotationsTab,
  CompanyInvoicesTab,
  CompanyPaymentsTab,
  CompanyStatementsTab,
  CompanyEditTab,
  CompanyContactsTab,
} from './tabs';
import { AppPageHeader } from '@/components/ComponentsIndex';

type TabId = 'summary' | 'contacts' | 'quotations' | 'invoices' | 'payments' | 'statements' | 'edit';

export function CompanyDetailPage() {
  const navigate = useNavigate(); 
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('summary');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    CompanyService.findById(Number(id))
      .then((data) => {
        if (!cancelled) setCompany(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load company');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!company?.name) return;
    let cancelled = false;
    setDocsLoading(true);
    Promise.all([
      InvoiceService.findAll({
        where: { customer_name: company.name },
        orderBy: 'issue_date',
        orderDirection: 'DESC',
        limit: 200,
      }),
      QuotationService.findAll({
        where: { customer_name: company.name },
        limit: 200,
      }).catch(() => [] as Quotation[]),
      PaymentService.findByCompany(company.name).catch(() => [] as Payment[]),
    ])
      .then(([inv, quot, pay]) => {
        if (!cancelled) {
          setInvoices(inv);
          setQuotations(quot);
          setPayments(Array.isArray(pay) ? pay : []);
        }
      })
      .finally(() => {
        if (!cancelled) setDocsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [company?.name]);

  const tabButtons = useMemo(
    () => [
      { id: 'summary' as TabId, label: 'Summary' },
      { id: 'contacts' as TabId, label: 'Contacts' },
      { id: 'quotations' as TabId, label: 'Quotations' },
      { id: 'invoices' as TabId, label: 'Invoices' },
      { id: 'payments' as TabId, label: 'Payments' },
      { id: 'statements' as TabId, label: 'Statements' },
      { id: 'edit' as TabId, label: 'Edit' },
    ],
    []
  );

  const handleCompanyUpdate = (updated: Company) => {
    setCompany(updated);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-slate-500 dark:text-slate-400">Loading…</div>
      </div>
    );
  }
  if (error || !company) {
    return (
      <div className="space-y-4">
        <p className="text-red-600 dark:text-red-400">{error ?? 'Company not found.'}</p>
        <Link
          to="/app/companies"
          className="text-indigo-600 dark:text-indigo-400 hover:underline no-underline"
        >
          Back to companies
        </Link>
      </div>
    );
  }

  const tabProps = {
    company,
    invoices,
    quotations,
    payments,
    docsLoading,
    onCompanyUpdate: handleCompanyUpdate,
  };

  return (
    <div className="space-y-6">
      <AppPageHeader
        title={company.name}
        subtitle="Company Details"
        showBackButton={true}
        showButton={true}
        buttonText="Back"
        onBackClick={() => navigate(-1)}
      />


      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex gap-1 flex-wrap" aria-label="Tabs">
          {tabButtons.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-white dark:bg-slate-800'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'summary' && <CompanySummaryTab {...tabProps} />}
      {activeTab === 'contacts' && <CompanyContactsTab company={company} />}
      {activeTab === 'quotations' && <CompanyQuotationsTab {...tabProps} />}
      {activeTab === 'invoices' && <CompanyInvoicesTab {...tabProps} />}
      {activeTab === 'payments' && <CompanyPaymentsTab {...tabProps} />}
      {activeTab === 'statements' && <CompanyStatementsTab {...tabProps} />}
      {activeTab === 'edit' && <CompanyEditTab company={company} onCompanyUpdate={handleCompanyUpdate} />}
    </div>
  );
}
