import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/data/AuthStore';
import '../App.css';

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navLink = (to: string, label: string) => {
    const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
    return (
      <Link
        to={to}
        className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="app">
      <nav className="app-nav">
        <div className="nav-content">
          <Link to="/app" className="nav-logo">
            Foroman
          </Link>
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {navLink('/app/invoices', 'Invoices')}
            {navLink('/app/items', 'Items')}
            {navLink('/app/quotations', 'Quotations')}
            {navLink('/app/statements', 'Statements')}
            {location.pathname.startsWith('/app/invoices') && (
              <Link to="/app/invoices/create" className="btn-primary">
                + New Invoice
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
