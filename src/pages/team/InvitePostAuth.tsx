import { useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '@/stores/data/AuthStore';
import { useBusinessStore } from '@/stores/data/BusinessStore';
import { useTeamStore } from '@/stores/data/TeamStore';

export function InvitePostAuth() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const processed = useRef(false);

  const sessionUser = useAuthStore((s) => s.sessionUser);
  const invitePreview = useTeamStore((s) => s.invitePreview);
  const acceptInvite = useTeamStore((s) => s.acceptInvite);
  const fetchInvitePreview = useTeamStore((s) => s.fetchInvitePreview);
  const isLoading = useTeamStore((s) => s.isLoading);
  const error = useTeamStore((s) => s.error);
  const setCurrentBusinessById = useBusinessStore((s) => s.setCurrentBusinessById);

  const isAuthenticated = Boolean(sessionUser?.accessToken);

  useEffect(() => {
    if (!token) return;
    fetchInvitePreview(token);
  }, [token, fetchInvitePreview]);

  const emailMatchesInvite = useMemo(() => {
    if (!invitePreview?.email || !sessionUser?.email) return true;
    return invitePreview.email.toLowerCase() === sessionUser.email.toLowerCase();
  }, [invitePreview?.email, sessionUser?.email]);

  useEffect(() => {
    if (!token || !isAuthenticated || processed.current) return;
    if (invitePreview && !invitePreview.valid) return;
    if (!emailMatchesInvite) return;

    processed.current = true;
    void (async () => {
      const result = await acceptInvite(token);
      if (!result?.success) {
        processed.current = false;
        return;
      }
      if (result.active_business_id) {
        setCurrentBusinessById(result.active_business_id);
      }
      toast.success('Invitation accepted');
      navigate('/app/dashboard', { replace: true });
    })();
  }, [acceptInvite, emailMatchesInvite, invitePreview, isAuthenticated, navigate, setCurrentBusinessById, token]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 py-10">
        <div className="mx-auto max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Sign in required</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Please sign in first to accept this invitation.
          </p>
          <Link
            to="/login"
            state={{ from: { pathname: `/invite/${token}/accept` } }}
            className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-indigo-500"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Completing team invite
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          We are finishing your membership setup for the invited business.
        </p>
        {isLoading && <p className="mt-3 text-sm text-slate-500">Finalizing access…</p>}
        {!emailMatchesInvite && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
            This invite is for <strong>{invitePreview?.email}</strong>, but you are signed in as{' '}
            <strong>{sessionUser?.email}</strong>. Sign in with the invited email to continue.
          </div>
        )}
        {error && !isLoading && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-300">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
