import { Link, Outlet, useLocation } from 'react-router-dom';

const SETTINGS_TABS = [
  { to: '/app/settings', label: 'Business', exact: true },
  { to: '/app/settings/banking', label: 'Banking', exact: false },
  { to: '/app/settings/preferences', label: 'Preferences', exact: false },
];

export function SettingsPage() {
  const location = useLocation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Manage your business and preferences.</p>
      </div>

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {SETTINGS_TABS.map((tab) => {
          const isActive = tab.exact
            ? location.pathname === tab.to
            : location.pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors no-underline ${
                isActive
                  ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-b-white dark:border-b-slate-800 -mb-px text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <Outlet />
    </div>
  );
}
