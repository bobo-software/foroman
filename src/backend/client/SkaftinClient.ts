/**
 * Skaftin SDK Client
 * Unified client for all Skaftin API interactions
 */

import useAuthStore from '../../stores/data/AuthStore';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  data: T;
}

export class SkaftinClient {
  private config: {
    apiUrl: string;
    apiKey: string;
    accessToken: string;
    projectId: string | null;
  };
  private initialized = false;

  constructor() {
    const apiUrl = import.meta.env.VITE_SKAFTIN_API_URL || 'http://localhost:4006';
    const apiKey = import.meta.env.VITE_SKAFTIN_API_KEY || import.meta.env.VITE_SKAFTIN_API || '';
    const accessToken = import.meta.env.VITE_SKAFTIN_ACCESS_TOKEN || '';
    const projectId = import.meta.env.VITE_SKAFTIN_PROJECT_ID || null;

    this.config = { apiUrl, apiKey, accessToken, projectId };

    if (!apiKey && !accessToken) {
      throw new Error('Skaftin credentials required. Set VITE_SKAFTIN_API_KEY or VITE_SKAFTIN_ACCESS_TOKEN');
    }

    if (import.meta.env.DEV) {
      console.log('🔧 Skaftin Client initialized');
    }

    this.initialized = true;
  }

  getApiUrl(): string {
    return this.config.apiUrl;
  }

  getProjectId(): string | null {
    return this.config.projectId;
  }

  isAuthenticated(): boolean {
    return !!(this.config.apiKey || this.config.accessToken);
  }

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {};

    // Always include X-API-Key header (platform authentication)
    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    } else if (this.config.accessToken) {
      headers['x-access-token'] = this.config.accessToken;
    }

    return headers;
  }

  private buildHeaders(customHeaders: Record<string, string> = {}, isFormData = false): HeadersInit {
    const headers: Record<string, string> = {
      ...(this.getAuthHeaders() as Record<string, string>),
      ...customHeaders,
    };

    // Always add Authorization Bearer token if user is authenticated
    // Get token from AuthStore (stored after login)
    const authState = useAuthStore.getState();
    const jwtToken = authState.sessionUser?.accessToken || authState.sessionUser?.access;
    if (jwtToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${jwtToken}`;
    }

    // CRITICAL: When using FormData, DO NOT set Content-Type header
    // The browser will automatically set it with the correct boundary
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    } else if (isFormData) {
      // Explicitly remove Content-Type if it was set by customHeaders
      delete headers['Content-Type'];
    }

    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    if (!this.initialized) throw new Error('Skaftin client not initialized');

    const url = `${this.config.apiUrl}${endpoint}`;
    const method = options.method || 'GET';
    const isFormData = options.body instanceof FormData;

    const headers = this.buildHeaders(
      (options.headers as Record<string, string>) || {},
      isFormData
    );

    let finalBody: BodyInit | undefined;
    if (isFormData) {
      finalBody = options.body as FormData;
    } else if (options.body) {
      finalBody = typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, {
        ...options,
        method,
        headers,
        credentials: 'include',
        body: finalBody,
      });

      const data = await response.json();

      // Handle 401 Unauthorized - SuperTokens SDK handles refresh automatically
      // But we can retry the request after a short delay to allow refresh
      if (response.status === 401 && this.isUserAuthenticated()) {
        try {
          // Check if SuperTokens session exists (it will auto-refresh)
          const Session = (await import('supertokens-auth-react/recipe/session')).default;
          const sessionExists = await Session.doesSessionExist();

          if (sessionExists) {
            // Wait a bit for SuperTokens to refresh the token
            await new Promise(resolve => setTimeout(resolve, 500));

            // Retry the original request (SuperTokens will have refreshed the token)
            const retryResponse = await fetch(url, {
              ...options,
              method,
              headers: this.buildHeaders(
                (options.headers as Record<string, string>) || {},
                isFormData
              ),
              credentials: 'include',
              body: finalBody,
            });

            const retryData = await retryResponse.json();
            if (retryResponse.ok) {
              return retryData;
            }
          }
        } catch (refreshError) {
          console.error('Failed to refresh session:', refreshError);
        }
      }

      if (!response.ok) {
        const error = new Error(data.message || data.error || `Request failed: ${response.status}`);
        (error as any).status = response.status;
        (error as any).data = data;
        throw error;
      }

      return data;
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error(`[${method}] ${endpoint} ❌`, error);
      }
      throw error;
    }
  }

  private isUserAuthenticated(): boolean {
    const authState = useAuthStore.getState();
    return !!authState.sessionUser?.accessToken;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params && Object.keys(params).length > 0) {
      const query = new URLSearchParams(
        Object.entries(params).reduce((acc, [k, v]) => {
          if (v !== undefined && v !== null) {
            acc[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
          }
          return acc;
        }, {} as Record<string, string>)
      ).toString();
      url += `?${query}`;
    }
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  async delete<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', body });
  }

  /**
   * Upload file using FormData
   * 
   * IMPORTANT: When using FormData, the Content-Type header is automatically
   * set by the browser with the correct boundary. Do NOT set it manually.
   */
  async postFormData<T>(endpoint: string, body: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }
}

export const skaftinClient = new SkaftinClient();
export default skaftinClient;

