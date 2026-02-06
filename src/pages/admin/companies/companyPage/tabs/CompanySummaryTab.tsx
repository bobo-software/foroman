import { useMemo } from 'react';
import { formatCurrency } from '@/utils/currency';
import type { CompanyTabProps } from './types';
import { BUSINESS_TYPE_LABELS } from './types';

export function CompanySummaryTab({ company, invoices, payments, docsLoading }: CompanyTabProps) {
  const balanceByCurrency = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    for (const inv of invoices) {
      const c = inv.currency || 'ZAR';
      byCurrency[c] = (byCurrency[c] ?? 0) + Number(inv.total ?? 0);
    }
    for (const pay of payments) {
      const c = pay.currency || 'ZAR';
      byCurrency[c] = (byCurrency[c] ?? 0) - Number(pay.amount ?? 0);
    }
    return byCurrency;
  }, [invoices, payments]);

  const totalsByCurrency = useMemo(() => {
    const invoicesTotal: Record<string, number> = {};
    const paymentsTotal: Record<string, number> = {};
    for (const inv of invoices) {
      const c = inv.currency || 'ZAR';
      invoicesTotal[c] = (invoicesTotal[c] ?? 0) + Number(inv.total ?? 0);
    }
    for (const pay of payments) {
      const c = pay.currency || 'ZAR';
      paymentsTotal[c] = (paymentsTotal[c] ?? 0) + Number(pay.amount ?? 0);
    }
    return { invoicesTotal, paymentsTotal };
  }, [invoices, payments]);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Contact person</dt>
          <dd className="mt-1 text-slate-800 dark:text-slate-200">{company.contact_person ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Email</dt>
          <dd className="mt-1 text-slate-800 dark:text-slate-200">{company.email ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Phone</dt>
          <dd className="mt-1 text-slate-800 dark:text-slate-200">{company.phone ?? '—'}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Address</dt>
          <dd className="mt-1 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
            {company.address ?? '—'}
          </dd>
        </div>
      </dl>

      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Financial summary
        </h3>
        {docsLoading ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading…</p>
        ) : (
          <div className="space-y-4">
            {/* Statement summary: what they owe at a glance (costs - payments) */}
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-600">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                Statement summary (invoices − payments)
              </dt>
              <dd className="flex flex-wrap items-baseline gap-3 gap-y-1">
                {Object.keys(balanceByCurrency).length === 0 ? (
                  <span className="text-slate-500 dark:text-slate-400">No activity</span>
                ) : (
                  Object.entries(balanceByCurrency).map(([curr, bal]) => {
                    const isOwed = bal > 0;
                    const isCredit = bal < 0;
                    const isZero = bal === 0;
                    return (
                      <span
                        key={curr}
                        className={`text-xl font-bold ${
                          isOwed
                            ? 'text-amber-600 dark:text-amber-400'
                            : isCredit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {isOwed && 'Owed: '}
                        {isCredit && 'Credit: '}
                        {isZero && 'Balance: '}
                        {formatCurrency(bal, curr)}
                      </span>
                    );
                  })
                )}
              </dd>
            </div>

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg p-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/40">
                <dt className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Invoices (costs)
                </dt>
                <dd className="mt-1 flex flex-wrap gap-2 items-baseline">
                  {Object.keys(totalsByCurrency.invoicesTotal).length === 0 ? (
                    <span className="text-slate-500 dark:text-slate-400">—</span>
                  ) : (
                    Object.entries(totalsByCurrency.invoicesTotal).map(([curr, tot]) => (
                      <span key={curr} className="font-semibold text-amber-800 dark:text-amber-200">
                        {formatCurrency(tot, curr)}
                      </span>
                    ))
                  )}
                  <span className="text-slate-500 dark:text-slate-400 text-sm">
                    ({invoices.length} invoice{invoices.length !== 1 ? 's' : ''})
                  </span>
                </dd>
              </div>
              <div className="rounded-lg p-3 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/60 dark:border-emerald-800/40">
                <dt className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Payments received
                </dt>
                <dd className="mt-1 flex flex-wrap gap-2 items-baseline">
                  {Object.keys(totalsByCurrency.paymentsTotal).length === 0 ? (
                    <span className="text-slate-500 dark:text-slate-400">—</span>
                  ) : (
                    Object.entries(totalsByCurrency.paymentsTotal).map(([curr, tot]) => (
                      <span key={curr} className="font-semibold text-emerald-800 dark:text-emerald-200">
                        {formatCurrency(tot, curr)}
                      </span>
                    ))
                  )}
                  <span className="text-slate-500 dark:text-slate-400 text-sm">
                    ({payments.length} payment{payments.length !== 1 ? 's' : ''})
                  </span>
                </dd>
              </div>
              <div className="rounded-lg p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 sm:col-span-2 lg:col-span-1">
                <dt className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Balance due (per currency)
                </dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {Object.keys(balanceByCurrency).length === 0 ? (
                    <span className="text-slate-500 dark:text-slate-400">—</span>
                  ) : (
                    Object.entries(balanceByCurrency).map(([curr, bal]) => (
                      <span
                        key={curr}
                        className={`font-semibold ${
                          bal > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : bal < 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {formatCurrency(bal, curr)}
                      </span>
                    ))
                  )}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {(company.business_type ||
        company.tax_id ||
        company.registration_number ||
        company.vat_number ||
        company.industry ||
        company.website) && (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Business credentials
          </h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {company.business_type && (
              <div>
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Business type
                </dt>
                <dd className="mt-1 text-slate-800 dark:text-slate-200">
                  {BUSINESS_TYPE_LABELS[company.business_type] ?? company.business_type}
                </dd>
              </div>
            )}
            {company.tax_id && (
              <div>
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Tax ID
                </dt>
                <dd className="mt-1 text-slate-800 dark:text-slate-200">{company.tax_id}</dd>
              </div>
            )}
            {company.registration_number && (
              <div>
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Registration number
                </dt>
                <dd className="mt-1 text-slate-800 dark:text-slate-200">
                  {company.registration_number}
                </dd>
              </div>
            )}
            {company.vat_number && (
              <div>
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  VAT number
                </dt>
                <dd className="mt-1 text-slate-800 dark:text-slate-200">
                  {company.vat_number}
                </dd>
              </div>
            )}
            {company.industry && (
              <div>
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Industry
                </dt>
                <dd className="mt-1 text-slate-800 dark:text-slate-200">
                  {company.industry}
                </dd>
              </div>
            )}
            {company.website && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Website
                </dt>
                <dd className="mt-1">
                  <a
                    href={
                      company.website.startsWith('http')
                        ? company.website
                        : `https://${company.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {company.website}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
      {company.notes && (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Notes</dt>
          <dd className="mt-1 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
            {company.notes}
          </dd>
        </div>
      )}
    </div>
  );
}

export default CompanySummaryTab;
