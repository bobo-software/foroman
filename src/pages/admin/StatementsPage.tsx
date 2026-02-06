import { Link } from 'react-router-dom';

export function StatementsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Company statements</h1>
      <p className="text-slate-600 dark:text-slate-400">
        Statements are generated from each company&apos;s detail page. Open a company, then use the
        <strong> Statements </strong>
        tab to set a date range, generate a running balance, and download a PDF.
      </p>
      <Link
        to="/app/companies"
        className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-indigo-500"
      >
        Go to companies
      </Link>
    </div>
  );
}
