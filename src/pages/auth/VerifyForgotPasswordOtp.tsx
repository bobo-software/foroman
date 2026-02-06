import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import useAuthStore from '../../stores/data/AuthStore';

export function VerifyForgotPasswordOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateEmail = (location.state as { email?: string })?.email ?? '';
  
  const [email, setEmail] = useState(stateEmail);
  const [code, setCode] = useState('');
  
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !code.trim()) {
      toast.error('Please enter email and the code from your email');
      return;
    }
    if (code.length < 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }
    
    clearError();
    
    try {
      const { reset_token } = await authService.verifyForgotPasswordOtp(
        email.trim(),
        code.trim()
      );
      sessionStorage.setItem('reset_token', reset_token);
      sessionStorage.setItem('reset_email', email.trim());
      toast.success('Code verified. Enter your new password.');
      navigate('/reset-password', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid or expired code';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white no-underline"
          >
            <img src="/favicon.png" alt="" className="h-10 w-10 rounded-lg object-contain" />
            Foroman
          </Link>
          <h2 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-100">
            Enter verification code
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            We sent a 6-digit code to your email. Enter it below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Verification code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              disabled={isLoading}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 text-center text-xl tracking-widest placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                Verifying…
              </>
            ) : (
              'Verify code'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          <Link
            to="/forgot-password"
            className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Back to forgot password
          </Link>
          {' · '}
          <Link
            to="/login"
            className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
