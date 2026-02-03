import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import { AppButton } from '@components/ComponentsIndex';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await authService.login({
        username: email.trim(),
        password,
        method: 'email',
      });
      toast.success('Welcome back');
      navigate(from ?? '/app', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link to="/" className="text-2xl font-bold text-slate-900">
            Foroman
          </Link>
          <h2 className="mt-4 text-xl font-semibold text-slate-800">Log in</h2>
        </div>
     
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <AppButton
            label={loading ? 'Signing in…' : 'Log in'}
            variant="blue"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
          />
    
        <p className="text-center text-sm text-slate-600">
          Don’t have an account?{' '}
          <Link to="/register" className="font-medium text-slate-900 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
