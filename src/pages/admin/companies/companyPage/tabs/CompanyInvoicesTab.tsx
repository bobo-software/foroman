import { Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/currency';
import type { CompanyTabProps } from './types';
import { formatDate } from './types';

export function CompanyInvoicesTab({ invoices, docsLoading }: CompanyTabProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      {docsLoading ? (
        <div className="py-8 text-center text-slate-500 dark:text-slate-400">
          Loading invoices…
        </div>
      ) : invoices.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          No invoices for this company.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {invoices.map((inv) => (
            <li key={inv.id} className="py-3 first:pt-0">
              <Link
                to={`/app/invoices/${inv.id}`}
                className="flex flex-wrap items-center justify-between gap-2 text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 no-underline"
              >
                <span className="font-medium">{inv.invoice_number}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {formatDate(inv.issue_date)} · {inv.status}
                </span>
                <span className="text-sm font-medium">
                  {formatCurrency(Number(inv.total), inv.currency)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CompanyInvoicesTab;
