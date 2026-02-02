import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/data/AuthStore';
import './NavbarProfile.css';

export function NavbarProfile() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const sessionUser = useAuthStore((s) => s.sessionUser);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const name = sessionUser?.name ?? sessionUser?.email ?? 'User';
  const initial = (name.charAt(0) ?? 'U').toUpperCase();
  const email = sessionUser?.email ?? '';

  return (
    <div className="navbar-profile" ref={ref}>
      <button
        type="button"
        className="navbar-profile-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="navbar-profile-avatar">{initial}</span>
      </button>
      {open && (
        <div className="navbar-profile-dropdown">
          <div className="navbar-profile-header">
            <span className="navbar-profile-dropdown-avatar">{initial}</span>
            <div className="navbar-profile-info">
              <span className="navbar-profile-name">{name}</span>
              {email && <span className="navbar-profile-email">{email}</span>}
            </div>
          </div>
          <div className="navbar-profile-divider" />
          <button
            type="button"
            className="navbar-profile-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
