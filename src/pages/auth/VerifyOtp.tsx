import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import useAuthStore from '../../stores/data/AuthStore';

export function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionUser = useAuthStore((s) => s.sessionUser);
  const state = location.state as { email?: string; userId?: number } | null;
  const email = state?.email ?? sessionUser?.email ?? '';
  const userId = state?.userId ?? (sessionUser?.id as number | undefined);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  if (!email) {
    navigate('/register', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error('Please enter the verification code');
      return;
    }
    setLoading(true);
    try {
      const sessionUser = await authService.verifyOtp(email, otp.trim());
      toast.success(sessionUser ? 'Account verified' : 'Account activated');
      navigate('/onboard', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (userId == null) {
      toast.error('Cannot resend. Please register again.');
      return;
    }
    setResendLoading(true);
    try {
      await authService.resendOtp(userId, 'email');
      toast.success('Verification code sent again');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend';
      toast.error(message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link to="/" className="text-2xl font-bold text-slate-900">
            Foroman
          </Link>
          <h2 className="mt-4 text-xl font-semibold text-slate-800">
            Verify your account
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            We sent a verification code to <strong>{email}</strong>. Enter it below to activate your account.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1">
              Verification code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 text-center text-lg tracking-widest focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="000000"
            />
          </div>
          <button
            type="submit"
            disabled={loading || otp.length < 4}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Verifying…' : 'Verify & activate account'}
          </button>
          {userId != null && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="w-full text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50 transition"
            >
              {resendLoading ? 'Sending…' : 'Resend code'}
            </button>
          )}
        </form>
        <p className="text-center text-sm text-slate-600">
          <Link to="/login" className="font-medium text-slate-900 hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
