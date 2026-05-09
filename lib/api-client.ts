import { ofetch, type FetchOptions } from 'ofetch';
import { forceLogout } from '@/shared/utils/notifications';

const BASE_URL = 'https://portal.road-80.com/api';

// Auth endpoints that should never trigger a force-logout on failure
// (e.g. wrong OTP returns status:"needLogin" but user is not logged in yet)
const AUTH_PATHS = ['/v1/auth/login', '/v1/auth/register', '/v1/auth/verify-otp', '/auth/logout'];

const isAuthPath = (url: string) =>
  AUTH_PATHS.some((p) => url.includes(p));

export const apiClient = ofetch.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  async onRequest({ options }) {
    try {
      const userStr = localStorage.getItem('road80_user');
      if (userStr) {
        const parsed = JSON.parse(userStr);
        // Zustand persist format: { state: { user: { token } }, version: 0 }
        // Flat format (legacy): { token: "..." }
        const token = parsed?.state?.user?.token || parsed?.token;
        if (token) {
          const headers = new Headers(options.headers);
          headers.set('Authorization', `Bearer ${token}`);
          options.headers = headers;
        }
      }

      // If we are sending FormData, we MUST NOT set the Content-Type header manually.
      // The browser will automatically set it to multipart/form-data with the correct boundary.
      if (options.body instanceof FormData) {
        const headers = options.headers instanceof Headers 
          ? options.headers 
          : new Headers(options.headers);
        headers.delete('Content-Type');
        options.headers = headers;
      }
    } catch (error) {
      // Handle error
    }
  },

  // ── Body-level status check (HTTP 200 but logically rejected) ─────────────
  // The backend returns { status: "block" } or { status: "needLogin" }
  // as a successful HTTP response (200), so onResponseError won't catch these.
  async onResponse({ request, response }) {
    // Skip auth endpoints — a failed login shouldn't trigger force-logout
    const url = typeof request === 'string' ? request : request.toString();
    if (isAuthPath(url)) return;

    try {
      const body = response._data as any;
      const status = body?.status;

      if (status === 'block') {
        forceLogout('block');
      } else if (status === 'needLogin') {
        // Token is invalid/expired — treat the same as being kicked out
        forceLogout('session_expired');
      }
    } catch {
      // Ignore JSON parse errors (binary responses, etc.)
    }
  },

  // ── HTTP-level 401 Unauthorized ───────────────────────────────────────────
  async onResponseError({ request, response }) {
    if (response.status === 401) {
      const url = typeof request === 'string' ? request : request.toString();
      if (!isAuthPath(url)) {
        forceLogout('session_expired');
      }
    }
  },
});

export const api = {
  get: <T = unknown>(url: string, options?: FetchOptions<'json'>) =>
    apiClient<T>(url, { ...options, method: 'GET' }),

  post: <T = unknown>(url: string, body?: unknown, options?: FetchOptions<'json'>) =>
    apiClient<T>(url, { ...options, method: 'POST', body: body as Record<string, unknown> }),

  put: <T = unknown>(url: string, body?: unknown, options?: FetchOptions<'json'>) =>
    apiClient<T>(url, { ...options, method: 'PUT', body: body as Record<string, unknown> }),

  patch: <T = unknown>(url: string, body?: unknown, options?: FetchOptions<'json'>) =>
    apiClient<T>(url, { ...options, method: 'PATCH', body: body as Record<string, unknown> }),

  delete: <T = unknown>(url: string, options?: FetchOptions<'json'>) =>
    apiClient<T>(url, { ...options, method: 'DELETE' }),
};

export default api;
