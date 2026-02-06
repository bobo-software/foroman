import { Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/currency';
import type { CompanyTabProps } from './types';
import { formatDate } from './types';

export function CompanyQuotationsTab({ quotations, docsLoading }: CompanyTabProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      {docsLoading ? (
        <div className="py-8 text-center text-slate-500 dark:text-slate-400">
          Loading quotations…
        </div>
      ) : quotations.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          No quotations for this company.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {quotations.map((q) => (
            <li key={q.id} className="py-3 first:pt-0">
              <Link
                to={q.id != null ? `/app/quotations/${q.id}` : '#'}
                className="block focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400">
                  <span className="font-medium">
                    {q.quotation_number ? `Quote ${q.quotation_number}` : `Quotation #${q.id}`}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {q.issue_date ? formatDate(q.issue_date) : '—'} · {q.status ?? '—'}
                  </span>
                  {q.total != null && (
                    <span className="text-sm font-medium">
                      {formatCurrency(Number(q.total), q.currency)}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CompanyQuotationsTab;
