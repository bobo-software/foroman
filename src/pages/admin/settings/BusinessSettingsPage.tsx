import { Link } from 'react-router-dom';
import { useBusinessStore } from '@/stores/data/BusinessStore';

export function BusinessSettingsPage() {
  const currentBusiness = useBusinessStore((s) => s.currentBusiness);
  const loading = useBusinessStore((s) => s.loading);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Business</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Your business details for invoices and documents.
      </p>
      {loading ? (
        <p className="mt-6 text-slate-500 dark:text-slate-400">Loading…</p>
      ) : currentBusiness ? (
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Business name</dt>
            <dd className="mt-1 text-slate-800 dark:text-slate-200">{currentBusiness.name}</dd>
          </div>
          {currentBusiness.phone && (
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Phone</dt>
              <dd className="mt-1 text-slate-800 dark:text-slate-200">{currentBusiness.phone}</dd>
            </div>
          )}
          {currentBusiness.address && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Address</dt>
              <dd className="mt-1 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {currentBusiness.address}
              </dd>
            </div>
          )}
          {currentBusiness.tax_id && (
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Tax ID</dt>
              <dd className="mt-1 text-slate-800 dark:text-slate-200">{currentBusiness.tax_id}</dd>
            </div>
          )}
          {currentBusiness.vat_number && (
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">VAT number</dt>
              <dd className="mt-1 text-slate-800 dark:text-slate-200">{currentBusiness.vat_number}</dd>
            </div>
          )}
          {currentBusiness.registration_number && (
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Registration number
              </dt>
              <dd className="mt-1 text-slate-800 dark:text-slate-200">
                {currentBusiness.registration_number}
              </dd>
            </div>
          )}
          {currentBusiness.banking_details && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Banking details
              </dt>
              <dd className="mt-1 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {currentBusiness.banking_details}
              </dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="mt-6 text-slate-500 dark:text-slate-400">
          No business set. Add your business to get started.
        </p>
      )}
      <div className="mt-6">
        <Link
          to="/onboard"
          className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-indigo-500"
        >
          {currentBusiness ? 'Edit business details' : 'Add business'}
        </Link>
      </div>
    </div>
  );
}
