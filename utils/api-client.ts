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
          const user = JSON.parse(userStr);
          if (user.token) {
              const headers = new Headers(options.headers);
              headers.set('Authorization', `Bearer ${user.token}`);
              options.headers = headers;
          }
      }
      
      if (options.body instanceof FormData) {
        if (options.headers instanceof Headers) {
           options.headers.delete('Content-Type');
        } else if ((options.headers as any)?.['Content-Type']) {
           delete (options.headers as any)['Content-Type'];
        }
      }
    } catch (error) {
      // Fail silently
    }
  },
  async onResponseError({ request, response }) {
    if (response.status === 401) {
       // Handle unauthorized
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
