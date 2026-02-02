import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/data/AuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const sessionUser = useAuthStore((s) => s.sessionUser);

  const isAuthenticated = !!(accessToken || sessionUser?.accessToken);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
