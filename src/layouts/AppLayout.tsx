import { Outlet } from 'react-router-dom';
import { AppSidebar, AppNavbar } from '../components/ComponentsIndex';

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <AppSidebar />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <AppNavbar />
        <main className="flex-1 min-h-0 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
