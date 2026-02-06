/**
 * Auth Service
 * Register and login via Skaftin app-api auth (SuperTokens).
 */

import { skaftinClient } from '../backend';
import useAuthStore from '../stores/data/AuthStore';
import { TokenManager } from './TokenManager';
import { SKAFTIN_CONFIG } from '../config/skaftin.config';
import type { SessionUser } from '../types/Types';

export interface RegisterPayload {
  name: string;
  last_name?: string;
  email: string;
  password: string;
  phone?: string;
  role_key?: string;
  metadata?: Record<string, unknown>;
  otp_method?: 'email' | 'sms' | null;
}

export interface LoginPayload {
  username: string;
  password: string;
  method: 'email' | 'phone' | 'custom_field_1' | 'custom_field_2';
}

interface AuthResponseUser {
  id: number;
  name?: string;
  last_name?: string;
  full_name?: string;
  email: string;
  phone?: string | null;
  is_active?: boolean;
  roles?: Array<{ id: number; role_name: string; role_key: string }>;
}

interface AuthResponseSession {
  accessToken: string;
}

interface AuthResponseData {
  user: AuthResponseUser;
  session?: AuthResponseSession;
  organisation_id?: number;
  organisation_name?: string;
  organisation?: { id: number; name: string; is_admin?: boolean };
  is_admin?: boolean;
  requires_otp_verification?: boolean;
  otp_method?: string;
}

function mapAuthResponseToSessionUser(data: AuthResponseData): SessionUser {
  const user = data.user;
  const token = data.session?.accessToken ?? '';
  const orgId = data.organisation_id ?? data.organisation?.id ?? 0;
  const orgName = data.organisation_name ?? data.organisation?.name ?? '';
  const role = user.roles?.[0]?.role_key ?? '';
  const name = user.name ?? user.full_name ?? '';
  const fullName = [name, user.last_name].filter(Boolean).join(' ').trim() || name;

  return {
    id: user.id,
    email: user.email,
    accessToken: token,
    access: token,
    association: orgId,
    association_name: orgName,
    role,
    name: fullName || user.email,
    full_name: fullName,
    last_name: user.last_name,
    first_name: user.name,
    phone: user.phone ?? null,
    is_active: user.is_active,
    roles: user.roles,
    is_admin: data.is_admin ?? data.organisation?.is_admin ?? false,
  };
}

export interface RegisterResult {
  requiresOtp: boolean;
  email?: string;
  userId?: number;
  sessionUser?: SessionUser;
}

export const authService = {
  /**
   * Register a new user
   */
  async register(payload: RegisterPayload): Promise<RegisterResult> {
    const store = useAuthStore.getState();
    store.setLoading(true);
    store.clearError();

    try {
      const response = await skaftinClient.post<AuthResponseData>(
        SKAFTIN_CONFIG.endpoints.register,
        {
          name: payload.name,
          last_name: payload.last_name,
          email: payload.email,
          password: payload.password,
          phone: payload.phone,
          role_key: payload.role_key ?? 'user',
          metadata: payload.metadata,
          otp_method: payload.otp_method ?? 'email',
        }
      );
      const data = response.data;
      if (!data?.user) {
        throw new Error('Invalid register response');
      }

      const sessionUser = data.session?.accessToken
        ? mapAuthResponseToSessionUser(data)
        : undefined;

      if (data.requires_otp_verification) {
        if (sessionUser) {
          TokenManager.setAccessToken(sessionUser.accessToken);
          store.login(sessionUser);
        }
        store.setRequiresOtpVerification(true);
        store.setLoading(false);
        return {
          requiresOtp: true,
          email: payload.email,
          userId: data.user.id,
        };
      }

      if (!sessionUser) throw new Error('Invalid register response');
      
      TokenManager.setAccessToken(sessionUser.accessToken);
      store.login(sessionUser);
      store.setLoading(false);
      return { requiresOtp: false, sessionUser };
    } catch (err: any) {
      const message = err.message || 'Registration failed';
      store.setError(message);
      store.setLoading(false);
      throw err;
    }
  },

  /**
   * Verify OTP after registration. Returns SessionUser if server includes a session;
   * otherwise returns null (account activated, user should log in).
   */
  async verifyOtp(email: string, otp: string): Promise<SessionUser | null> {
    const store = useAuthStore.getState();
    store.setLoading(true);
    store.clearError();

    try {
      const response = await skaftinClient.post<AuthResponseData>(
        SKAFTIN_CONFIG.endpoints.verifyOtp,
        { email, code: otp }
      );
      const data = response.data;
      if (!data?.user) {
        throw new Error('Invalid verify response');
      }

      if (data.session?.accessToken) {
        const sessionUser = mapAuthResponseToSessionUser(data);
        TokenManager.setAccessToken(sessionUser.accessToken);
        store.login(sessionUser);
        store.setRequiresOtpVerification(false);
        store.setLoading(false);
        return sessionUser;
      }

      store.setRequiresOtpVerification(false);
      store.setLoading(false);
      return null;
    } catch (err: any) {
      const message = err.message || 'OTP verification failed';
      store.setError(message);
      store.setLoading(false);
      throw err;
    }
  },

  /**
   * Resend OTP code
   */
  async resendOtp(userId: number, method: 'email' | 'sms' = 'email'): Promise<void> {
    const endpoint = SKAFTIN_CONFIG.endpoints.resendOtp.replace('{userId}', String(userId));
    await skaftinClient.post(endpoint, { method });
  },

  /**
   * Login with credentials
   */
  async login(payload: LoginPayload): Promise<SessionUser> {
    const store = useAuthStore.getState();
    store.setLoading(true);
    store.clearError();

    try {
      const response = await skaftinClient.post<AuthResponseData>(
        SKAFTIN_CONFIG.endpoints.login,
        {
          username: payload.username,
          password: payload.password,
          method: payload.method,
        }
      );
      const data = response.data;
      if (!data?.user || !data?.session?.accessToken) {
        throw new Error('Invalid login response');
      }

      const sessionUser = mapAuthResponseToSessionUser(data);
      TokenManager.setAccessToken(sessionUser.accessToken);
      store.login(sessionUser);
      store.setLoading(false);
      return sessionUser;
    } catch (err: any) {
      const message = err.message || 'Login failed';
      store.setError(message);
      store.setLoading(false);
      throw err;
    }
  },

  /**
   * Logout
   */
  logout(): void {
    useAuthStore.getState().logout();
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ method: string; destination: string }> {
    const store = useAuthStore.getState();
    store.setLoading(true);
    store.clearError();

    try {
      const response = await skaftinClient.post<{
        data?: { method?: string; destination?: string };
        method?: string;
        destination?: string;
      }>(SKAFTIN_CONFIG.endpoints.forgotPassword, { email, method: 'email' });
      
      const data = (response as any).data ?? response;
      store.setLoading(false);
      return {
        method: data?.method ?? 'email',
        destination: data?.destination ?? email,
      };
    } catch (err: any) {
      const message = err.message || 'Failed to send reset email';
      store.setError(message);
      store.setLoading(false);
      throw err;
    }
  },

  /**
   * Verify forgot password OTP
   */
  async verifyForgotPasswordOtp(
    email: string,
    code: string
  ): Promise<{ reset_token: string; expires_in_minutes: number }> {
    const store = useAuthStore.getState();
    store.setLoading(true);
    store.clearError();

    try {
      const response = await skaftinClient.post<{
        data?: { reset_token?: string; expires_in_minutes?: number };
        reset_token?: string;
        expires_in_minutes?: number;
      }>(SKAFTIN_CONFIG.endpoints.verifyForgotPasswordOtp, { email, code });
      
      const data = (response as any).data ?? response;
      const token = data?.reset_token;
      if (!token) throw new Error('Invalid verify response');
      
      store.setLoading(false);
      return {
        reset_token: token,
        expires_in_minutes: data?.expires_in_minutes ?? 15,
      };
    } catch (err: any) {
      const message = err.message || 'Failed to verify code';
      store.setError(message);
      store.setLoading(false);
      throw err;
    }
  },

  /**
   * Reset password with token
   */
  async resetPasswordWithToken(
    email: string,
    resetToken: string,
    newPassword: string
  ): Promise<void> {
    const store = useAuthStore.getState();
    store.setLoading(true);
    store.clearError();

    try {
      await skaftinClient.post(SKAFTIN_CONFIG.endpoints.resetPassword, {
        email,
        reset_token: resetToken,
        new_password: newPassword,
      });
      store.setLoading(false);
    } catch (err: any) {
      const message = err.message || 'Failed to reset password';
      store.setError(message);
      store.setLoading(false);
      throw err;
    }
  },

  /**
   * Get current user from store
   */
  getUser(): SessionUser | null {
    return useAuthStore.getState().sessionUser;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const state = useAuthStore.getState();
    return !!(state.sessionUser?.accessToken || state.accessToken);
  },

  /**
   * Get current access token
   */
  getToken(): string | null {
    return TokenManager.getAccessToken();
  },

  /**
   * Check if user has role
   */
  hasRole(roleKey: string): boolean {
    return useAuthStore.getState().hasRole(roleKey);
  },

  /**
   * Verify current session
   */
  async verifySession(): Promise<boolean> {
    return useAuthStore.getState().verifySession();
  },
};
