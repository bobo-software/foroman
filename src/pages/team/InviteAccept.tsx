import { useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '@/stores/data/AuthStore';
import { useTeamStore } from '@/stores/data/TeamStore';

export function InviteAccept() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionUser = useAuthStore((s) => s.sessionUser);
  const invitePreview = useTeamStore((s) => s.invitePreview);
  const isLoading = useTeamStore((s) => s.isLoading);
  const error = useTeamStore((s) => s.error);
  const fetchInvitePreview = useTeamStore((s) => s.fetchInvitePreview);

  useEffect(() => {
    if (!token) return;
    fetchInvitePreview(token);
  }, [token, fetchInvitePreview]);

  const isAuthenticated = Boolean(sessionUser?.accessToken);
  const returnTo = `/invite/${token}/accept`;

  const handleContinue = () => {
    if (!invitePreview?.valid) return;
    if (isAuthenticated) {
      navigate(`/invite/${token}/accept`, { replace: true });
      return;
    }
    navigate('/login', { state: { from: { pathname: returnTo } } });
  };

  const emailMismatch =
    invitePreview?.email &&
    sessionUser?.email &&
    invitePreview.email.toLowerCase() !== sessionUser.email.toLowerCase();

  useEffect(() => {
    if (emailMismatch) {
      toast.error(`This invite is for ${invitePreview?.email}. Please sign in with that account.`);
    }
  }, [emailMismatch, invitePreview?.email]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Team invitation</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Review the invitation details before you continue.
        </p>

        {isLoading && <p className="mt-4 text-sm text-slate-500">Checking invite…</p>}
        {error && !isLoading && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-300">
            {error}
          </div>
        )}

        {invitePreview && !isLoading && (
          <div className="mt-5 space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <p>
              <span className="font-semibold">Business:</span> {invitePreview.business_name}
            </p>
            <p>
              <span className="font-semibold">Role:</span> {invitePreview.role_key}
            </p>
            <p>
              <span className="font-semibold">Invited email:</span> {invitePreview.email}
            </p>
            <p>
              <span className="font-semibold">Status:</span> {invitePreview.status}
            </p>
            <p>
              <span className="font-semibold">Expires:</span>{' '}
              {new Date(invitePreview.expires_at).toLocaleString()}
            </p>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleContinue}
                disabled={!invitePreview.valid || emailMismatch}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-indigo-500"
              >
                {isAuthenticated ? 'Continue' : 'Login to continue'}
              </button>
              {!isAuthenticated && (
                <Link
                  to="/register"
                  state={{ from: { pathname: returnTo } }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 no-underline hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Create account
                </Link>
              )}
            </div>
          </div>
        )}

        <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
          URL: {location.pathname}
        </p>
      </div>
    </div>
  );
}
