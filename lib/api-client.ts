import { ofetch, type FetchOptions } from 'ofetch';
import { forceLogout } from '@/shared/utils/notifications';
import { API_BASE_URL } from '@/lib/api-base-url';
// Always import i18n through the barrel. Mixing '@/i18n' and '@/i18n/store'
// specifiers risks two module records, i.e. two independent language stores,
// and the api client would then read a language nothing else updates.
import { getLang } from '@/i18n';

// Auth endpoints that should never trigger a force-logout on failure
// (e.g. wrong OTP returns status:"needLogin" but user is not logged in yet)
// NOTE: these must match the paths the services actually call, which carry no
// `/v1` prefix (see lib/api-base-url.ts — the base already ends in `/api`).
// They previously read `/v1/auth/...`, so `isAuthPath()` never matched and a
// failed login/OTP force-logged the user out instead of surfacing the error.
const AUTH_PATHS = [
  '/auth/login',
  '/auth/register',      // also covers /auth/register-company
  '/auth/verify-otp',
  '/auth/resend-otp',
  '/auth/logout',
];

const isAuthPath = (url: string) =>
  AUTH_PATHS.some((p) => url.includes(p));

/** Force a logout when the body carries a terminal account state. */
const checkForcedLogout = (body: unknown) => {
  const status = (body as { status?: unknown } | null)?.status;

  if (status === 'block') {
    forceLogout('block');
  } else if (status === 'needLogin') {
    // Token is invalid/expired — treat the same as being kicked out
    forceLogout('session_expired');
  }
};

export const apiClient = ofetch.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  async onRequest({ options }) {
    try {
      // Tell the backend which language to localize responses and error
      // messages in. Read per-request so it follows the live language.
      {
        const headers = new Headers(options.headers);
        headers.set('Accept-Language', getLang());
        options.headers = headers;
      }

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

  // ── Body-level status check ───────────────────────────────────────────────
  // The backend signals these in the body rather than the HTTP status:
  //   { status: "block" }     — account blocked by an admin
  //   { status: "needLogin" } — token missing/expired
  // `status` is a string here, not the usual boolean.
  async onResponse({ request, response }) {
    // Skip auth endpoints — a failed login shouldn't trigger force-logout
    const url = typeof request === 'string' ? request : request.toString();
    if (isAuthPath(url)) return;

    checkForcedLogout(response._data);
  },

  // ── Error responses ───────────────────────────────────────────────────────
  async onResponseError({ request, response }) {
    const url = typeof request === 'string' ? request : request.toString();
    if (isAuthPath(url)) return;

    if (response.status === 401) {
      forceLogout('session_expired');
      return;
    }

    // The `is_blocked` middleware answers 422 (errorResponse's default status),
    // which lands here rather than in onResponse — ofetch only runs that hook for
    // 2xx. Without this, a blocked user's "block" body was silently swallowed as
    // a generic validation error and they stayed logged in.
    checkForcedLogout(response._data);
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
