import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/data/AuthStore';
import { NavbarProfile } from '../components/navbar/NavbarProfile';
import '../App.css';

function useBreadcrumbs() {
  const location = useLocation();
  const path = location.pathname;

  if (path === '/app' || path === '/app/') {
    return [{ label: 'Dashboard', path: '/app' }];
  }

  const segments = path.replace(/^\/app\/?/, '').split('/').filter(Boolean);
  const crumbs: { label: string; path: string }[] = [{ label: 'Dashboard', path: '/app' }];

  let acc = '/app';
  for (let i = 0; i < segments.length; i++) {
    acc += `/${segments[i]}`;
    const segment = segments[i];
    const label =
      segment === 'invoices' ? 'Invoices' :
      segment === 'items' ? 'Items' :
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

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionUser = useAuthStore((s) => s.sessionUser);
  const logout = useAuthStore((s) => s.logout);
  const breadcrumbs = useBreadcrumbs();

  const navLink = (to: string, label: string) => {
    const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
    return (
      <Link
        to={to}
        className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
      >
        {label}
      </Link>
    );
  };

  const isInvoices = location.pathname.startsWith('/app/invoices');
  const companyName = sessionUser?.association_name || sessionUser?.name || 'My Company';

  return (
    <div className="app-with-sidebar">
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <Link to="/app" className="sidebar-logo">
            Foroman
          </Link>
        </div>
        <nav className="sidebar-nav">
          {navLink('/app/invoices', 'Invoices')}
          {navLink('/app/items', 'Items')}
          {navLink('/app/quotations', 'Quotations')}
          {navLink('/app/statements', 'Statements')}
          {isInvoices && (
            <Link to="/app/invoices/create" className="sidebar-btn-primary">
              + New Invoice
            </Link>
          )}
        </nav>
        <div className="sidebar-footer">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="sidebar-logout"
          >
            Logout
          </button>
        </div>
      </aside>
      <div className="app-right">
        <header className="app-navbar">
          <div className="app-navbar-left">
            <span className="app-navbar-company">{companyName}</span>
            <nav className="app-navbar-breadcrumbs" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.path} className="app-navbar-breadcrumb-item">
                  {i > 0 && <span className="app-navbar-breadcrumb-sep">/</span>}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="app-navbar-breadcrumb-current">{crumb.label}</span>
                  ) : (
                    <Link to={crumb.path} className="app-navbar-breadcrumb-link">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          </div>
          <div className="app-navbar-right">
            <div className="app-navbar-search-wrap">
              <input
                type="search"
                placeholder="Search…"
                className="app-navbar-search"
                aria-label="Search"
              />
            </div>
            <NavbarProfile />
          </div>
        </header>
        <main className="app-main-with-sidebar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
