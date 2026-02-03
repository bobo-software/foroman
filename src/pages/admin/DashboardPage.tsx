import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import InvoiceService from '@/services/invoiceService';
import CustomerService from '@/services/customerService';
import QuotationService from '@/services/quotationService';
import ItemService from '@/services/itemService';
import type { Invoice } from '@/types/invoice';
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
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex items-start gap-4 hover:border-slate-300 transition-colors">
      <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-600 shrink-0 [&>svg]:w-5 [&>svg]:h-5">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-800 tabular-nums">
          {loading ? '—' : value}
        </p>
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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    customers: 0,
    invoices: 0,
    quotations: 0,
    items: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [recentError, setRecentError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [customers, invoices, quotations, items, recent] = await Promise.all([
          CustomerService.count(),
          InvoiceService.count(),
          QuotationService.count(),
          ItemService.count(),
          InvoiceService.findAll({
            orderBy: 'issue_date',
            orderDirection: 'DESC',
            limit: 5,
          }),
        ]);
        if (!cancelled) {
          setStats({ customers, invoices, quotations, items });
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
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="mt-1 text-slate-600">Overview of your CRM and sales activity.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Customers"
          value={stats.customers}
          icon={<LuUsers className="w-5 h-5" />}
          to="/app/customers"
          loading={loading}
        />
        <StatCard
          title="Invoices"
          value={stats.invoices}
          icon={<LuFileText className="w-5 h-5" />}
          to="/app/invoices"
          loading={loading}
        />
        <StatCard
          title="Quotations"
          value={stats.quotations}
          icon={<LuQuote className="w-5 h-5" />}
          to="/app/quotations"
          loading={loading}
        />
        <StatCard
          title="Stock (Items)"
          value={stats.items}
          icon={<LuPackage className="w-5 h-5" />}
          to="/app/items"
          loading={loading}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <LuTrendingUp className="w-5 h-5 text-indigo-600" />
            Recent Invoices
          </h2>
          <Link
            to="/app/invoices"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 no-underline"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          {recentError && (
            <div className="p-4 text-sm text-amber-700 bg-amber-50 border-b border-amber-200">
              {recentError}
            </div>
          )}
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading…</div>
          ) : recentInvoices.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No invoices yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-600 font-medium">
                  <th className="px-5 py-3">Invoice #</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium text-slate-800">{inv.invoice_number}</td>
                    <td className="px-5 py-3 text-slate-700">{inv.customer_name}</td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(inv.issue_date)}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-slate-800">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        to={`/app/invoices/${inv.id}`}
                        className="text-indigo-600 hover:text-indigo-500 font-medium no-underline"
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
