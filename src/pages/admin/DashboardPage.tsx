import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppText from '@/components/text/AppText';
import InvoiceService from '@/services/invoiceService';
import CompanyService from '@/services/companyService';
import { useBusinessStore } from '@/stores/data/BusinessStore';
import QuotationService from '@/services/quotationService';
import ItemService from '@/services/itemService';
import BankingDetailsService from '@/services/bankingDetailsService';
import type { Invoice } from '@/types/invoice';
import { formatCurrency } from '@/utils/currency';
import {
  LuUsers,
  LuFileText,
  LuPackage,
  LuQuote,
  LuTrendingUp,
} from 'react-icons/lu';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  to?: string;
  loading?: boolean;
}

function StatCard({ title, value, icon, to, loading }: StatCardProps) {
  const content = (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 shadow-sm px-3 py-2.5 flex items-center gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
      <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 shrink-0 [&>svg]:w-4 [&>svg]:h-4">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <AppText variant="label" className="text-xs" text={title} />
        <AppText variant="value" className="text-lg leading-tight">{loading ? '—' : value}</AppText>
      </div>
    </div>
  );
  if (to) {
    return (
      <Link to={to} className="block no-underline text-inherit">
        {content}
      </Link>
    );
  }
  return content;
}

export function DashboardPage() {
  const currentBusiness = useBusinessStore((s) => s.currentBusiness);
  const businessLoading = useBusinessStore((s) => s.loading);
  const businesses = useBusinessStore((s) => s.businesses);
  const businessId = useBusinessStore((s) => s.currentBusiness?.id);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    companies: 0,
    invoices: 0,
    quotations: 0,
    items: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [hasBankingDetails, setHasBankingDetails] = useState(false);
  const [bankingLoading, setBankingLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const businessWhere = businessId != null ? { business_id: businessId } : undefined;
        const [companies, invoices, quotations, items, recent] = await Promise.all([
          CompanyService.count(businessWhere),
          InvoiceService.count(businessWhere),
          QuotationService.count(businessWhere),
          ItemService.count(businessWhere),
          InvoiceService.findAll({
            where: businessWhere,
            orderBy: 'issue_date',
            orderDirection: 'DESC',
            limit: 5,
          }),
        ]);
        if (!cancelled) {
          setStats({ companies, invoices, quotations, items });
          setRecentInvoices(recent);
        }
      } catch (e) {
        if (!cancelled) {
          setRecentError(e instanceof Error ? e.message : 'Failed to load dashboard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  useEffect(() => {
    let cancelled = false;
    const userId = currentBusiness?.user_id;
    if (!userId) {
      setHasBankingDetails(false);
      setBankingLoading(false);
      return;
    }

    setBankingLoading(true);
    BankingDetailsService.findByUserId(Number(userId))
      .then((rows) => {
        if (!cancelled) setHasBankingDetails(rows.length > 0);
      })
      .catch(() => {
        if (!cancelled) setHasBankingDetails(false);
      })
      .finally(() => {
        if (!cancelled) setBankingLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentBusiness?.user_id]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-baseline">
        <AppText variant="h1" className="text-xl" text="Dashboard"  />
        <AppText variant="subtitle" className="text-xs" text="Overview of your CRM and sales activity." />
      </div>

      {!businessLoading && businesses.length === 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/20">
          <AppText variant="label" className="text-xs text-amber-800 dark:text-amber-200 font-semibold" text="Company setup required" />
          <AppText variant="body" className="text-xs text-amber-800 dark:text-amber-200">
            You have not registered your company yet.{' '}
            <Link to="/onboard" className="font-medium underline text-amber-900 dark:text-amber-100">
              Register your company
            </Link>{' '}
            to start using settings and documents.
          </AppText>
        </div>
      )}

      {!businessLoading && !!currentBusiness && !bankingLoading && !hasBankingDetails && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/20">
          <AppText variant="label" className="text-xs text-amber-800 dark:text-amber-200 font-semibold" text="Banking details missing" />
          <AppText variant="body" className="text-xs text-amber-800 dark:text-amber-200">
            Add your banking details so customers can pay you.{' '}
            <Link
              to="/app/settings/banking"
              className="font-medium underline text-amber-900 dark:text-amber-100"
            >
              Open banking settings
            </Link>
            .
          </AppText>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <StatCard
          title="Companies"
          value={stats.companies}
          icon={<LuUsers />}
          to="/app/companies"
          loading={loading}
        />
        <StatCard
          title="Invoices"
          value={stats.invoices}
          icon={<LuFileText />}
          loading={loading}
        />
        <StatCard
          title="Quotations"
          value={stats.quotations}
          icon={<LuQuote />}
          to="/app/quotations"
          loading={loading}
        />
        <StatCard
          title="Stock Items"
          value={stats.items}
          icon={<LuPackage />}
          to="/app/items"
          loading={loading}
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <LuTrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <AppText variant="h2" className="text-sm" text="Recent Invoices" />
        </div>
        <div className="overflow-x-auto">
          {recentError && (
            <div className="px-4 py-2 text-xs text-amber-700 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
              {recentError}
            </div>
          )}
          {loading ? (
            <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">Loading…</div>
          ) : recentInvoices.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">No invoices yet.</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-left text-slate-500 dark:text-slate-400 font-medium">
                  <th className="px-4 py-2">Invoice #</th>
                  <th className="px-4 py-2">Company</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-slate-100 dark:border-slate-700/60 hover:bg-slate-50/60 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-100">{inv.invoice_number}</td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{inv.customer_name}</td>
                    <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{formatDate(inv.issue_date)}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-slate-800 dark:text-slate-100">
                      {formatCurrency(inv.total, inv.currency)}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        to={`/app/invoices/${inv.id}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium no-underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
