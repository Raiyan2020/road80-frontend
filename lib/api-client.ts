import { ofetch, type FetchOptions } from 'ofetch';

const BASE_URL = 'https://portal.road-80.com/api';

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
  async onResponseError({ response }) {
    if (response.status === 401) {
      // Handle 401
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
