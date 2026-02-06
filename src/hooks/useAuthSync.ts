// src/hooks/useAuthSync.ts

import { useEffect } from 'react';
import useAuthStore from '../stores/data/AuthStore';
import { SKAFTIN_CONFIG } from '../config/skaftin.config';
import { TokenManager } from '../services/TokenManager';

/**
 * Keep auth state synchronized across browser tabs
 * When user logs out in one tab, all tabs will be logged out
 */
export function useAuthSync() {
  const logout = useAuthStore((s) => s.logout);
  const verifySession = useAuthStore((s) => s.verifySession);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Check if auth storage changed
      if (event.key === SKAFTIN_CONFIG.authStorageKey) {
        if (event.newValue === null) {
          // Storage cleared (logout in another tab)
          TokenManager.clearAll();
          useAuthStore.setState({
            sessionUser: null,
            accessToken: null,
            isLoading: false,
            error: null,
            requiresOtpVerification: false,
          });
        } else if (event.oldValue !== event.newValue) {
          // Auth state changed in another tab - re-verify
          verifySession();
        }
      }
      
      // Check if token directly changed
      if (event.key === SKAFTIN_CONFIG.tokenStorageKey) {
        if (event.newValue === null) {
          // Token removed in another tab
          TokenManager.clearAll();
          useAuthStore.setState({
            sessionUser: null,
            accessToken: null,
            isLoading: false,
            error: null,
            requiresOtpVerification: false,
          });
        } else if (event.oldValue !== event.newValue && event.newValue) {
          // Token changed - sync TokenManager and verify
          TokenManager.setAccessToken(event.newValue);
          verifySession();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [logout, verifySession]);
}

export default useAuthSync;
