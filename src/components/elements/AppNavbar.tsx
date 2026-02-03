import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/data/AuthStore';
import { NavbarProfile } from '../navbar/NavbarProfile';

function useBreadcrumbs() {
  const location = useLocation();
  const path = location.pathname;

  if (path === '/app' || path === '/app/' || path === '/app/dashboard') {
    return [{ label: 'Dashboard', path: '/app/dashboard' }];
  }

  const segments = path.replace(/^\/app\/?/, '').split('/').filter(Boolean);
  const crumbs: { label: string; path: string }[] = [{ label: 'Dashboard', path: '/app/dashboard' }];

  let acc = '/app';
  for (let i = 0; i < segments.length; i++) {
    acc += `/${segments[i]}`;
    const segment = segments[i];
    const label =
      segment === 'dashboard' ? 'Dashboard' :
      segment === 'invoices' ? 'Invoices' :
      segment === 'customers' ? 'Customers' :
      segment === 'items' ? 'Stock' :
      segment === 'quotations' ? 'Quotations' :
      segment === 'statements' ? 'Statements' :
      segment === 'create' ? 'New' :
      segment === 'edit' ? 'Edit' :
      /^\d+$/.test(segment) ? `#${segment}` :
      segment;
    crumbs.push({ label, path: acc });
  }

  return crumbs;
}

export function AppNavbar() {
  const sessionUser = useAuthStore((s) => s.sessionUser);
  const breadcrumbs = useBreadcrumbs();

  const companyName = sessionUser?.association_name || sessionUser?.name || 'My Company';

  return (
    <header className="shrink-0 flex items-center justify-between gap-4 px-6 py-3 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {companyName}
        </span>
        <nav className="flex items-center flex-wrap gap-1 text-sm" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.path} className="inline-flex items-center gap-1">
              {i > 0 && <span className="text-slate-300 select-none">/</span>}
              {i === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-slate-800">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-indigo-600 no-underline hover:text-indigo-700 hover:underline transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <input
            type="search"
            placeholder="Search…"
            className="w-48 pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-shadow bg-size-[1rem_1rem] bg-position-[0.5rem_center] bg-no-repeat"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z'/%3E%3C/svg%3E")`,
            }}
            aria-label="Search"
          />
        </div>
        <NavbarProfile />
      </div>
    </header>
  );
}
