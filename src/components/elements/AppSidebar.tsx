import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/data/AuthStore';

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const navLink = (to: string, label: string, exact?: boolean) => {
    const isActive = exact
      ? location.pathname === to
      : (location.pathname === to || location.pathname.startsWith(to + '/'));
    return (
      <Link
        to={to}
        className={`
          block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
          ${isActive
            ? 'bg-indigo-500/25 text-indigo-200'
            : 'text-slate-400 hover:bg-white/10 hover:text-slate-200'}
        `}
      >
        {label}
      </Link>
    );
  };

  return (
    <aside className="w-[260px] min-w-[260px] flex flex-col shrink-0 bg-slate-800 text-slate-200">
      <div className="px-5 py-4 border-b border-white/10">
        <Link
          to="/app/dashboard"
          className="text-xl font-bold tracking-tight text-white no-underline"
        >
          Foroman
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navLink('/app/dashboard', 'Dashboard')}
        {navLink('/app/customers', 'Customers')}
        {navLink('/app/items', 'Stock')}
        {navLink('/app/invoices', 'Invoices')}
        {navLink('/app/quotations', 'Quotations')}
        {navLink('/app/statements', 'Statements')}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
          className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-left text-slate-400 bg-transparent border-none cursor-pointer hover:bg-white/10 hover:text-slate-200 transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
