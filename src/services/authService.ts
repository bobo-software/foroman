/**
 * Auth Service
 * Register and login via Skaftin app-api auth (SuperTokens).
 */

import { skaftinClient } from '../backend';
import useAuthStore from '../stores/data/AuthStore';
import type { SessionUser } from '../types/Types';

export interface RegisterPayload {
  name: string;
  last_name?: string;
  email: string;
  password: string;
  phone?: string;
  role_key?: string;
  metadata?: Record<string, unknown>;
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
  session: AuthResponseSession;
  organisation_id?: number;
  organisation_name?: string;
  organisation?: { id: number; name: string; is_admin?: boolean };
  is_admin?: boolean;
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

export const authService = {
  async register(payload: RegisterPayload): Promise<SessionUser> {
    const response = await skaftinClient.post<AuthResponseData>(
      '/app-api/auth/auth/register',
      {
        name: payload.name,
        last_name: payload.last_name,
        email: payload.email,
        password: payload.password,
        phone: payload.phone,
        role_key: payload.role_key ?? 'user',
        metadata: payload.metadata,
        otp_method: 'email',
      }
    );
    const data = response.data;
    if (!data?.user || !data?.session?.accessToken) {
      throw new Error('Invalid register response');
    }
    const sessionUser = mapAuthResponseToSessionUser(data);
    useAuthStore.getState().login(sessionUser);
    return sessionUser;
  },

  async login(payload: LoginPayload): Promise<SessionUser> {
    const response = await skaftinClient.post<AuthResponseData>(
      '/app-api/auth/login',
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
    useAuthStore.getState().login(sessionUser);
    return sessionUser;
  },

  logout(): void {
    useAuthStore.getState().logout();
  },
};
