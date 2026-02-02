import { Link } from 'react-router-dom';

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
          Foroman
        </h1>
        <p className="text-lg text-slate-600">
          Invoices, quotations, and customer statements in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-3 text-base font-medium text-white hover:bg-slate-800 transition"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
