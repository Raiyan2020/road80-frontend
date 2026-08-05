import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';
import { t } from '@/i18n';

export function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error: unknown, query) => {
        // Skip toast if requested via meta
        if (query.meta?.hideToast) return;

        const err = error as { status?: number; data?: { message?: string }; message?: string };

        // Globally silence "Unauthenticated" (401) errors to avoid noise —
        // the api-client already handles logout/redirect for 401s.
        if (err.status === 401) return;

        if (typeof window !== 'undefined') {
          // Resolved inside the handler so the toast follows the live language.
          const message = err?.data?.message || err?.message || t('common.genericError');
          toast.error(message, {
            description: t('common.networkError'),
          });
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error: unknown, _vars, _context, mutation) => {
        // Skip toast if specifically requested via meta or if it's a 401
        if (mutation.meta?.hideToast) return;

        const err = error as { status?: number; data?: { message?: string }; message?: string };

        // Globally silence "Unauthenticated" (401) errors to avoid noise
        if (err.status === 401) return;

        if (typeof window !== 'undefined') {
          const message = err?.data?.message || err?.message || t('common.actionFailed');
          toast.error(message, {
            id: 'mutation-error', // Prevent duplicate toast for same mutation
          });
        }
      },
    }),
    defaultOptions: {
      queries: {
        // Data is considered fresh for 1 minute before a background refetch is triggered
        staleTime: 60 * 1000,

        // On server: never retry — keep SSR/streaming fast.
        // On client (mobile): 1 retry with 2s delay handles transient mobile network drops
        // without annoying the user with multiple loading states.
        retry: typeof window === 'undefined' ? false : 1,
        retryDelay: 2000,

        // Refetch when the app comes back to the foreground (tab/app resume).
        // Critical for mobile — the user may switch apps for several minutes
        // and data shown on return may be stale.
        refetchOnWindowFocus: true,

        // Do NOT refetch on reconnect by default — too aggressive for mobile.
        // Individual queries can override this where freshness is critical.
        refetchOnReconnect: 'always',
      },
    },
  });
}


let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Returns a singleton QueryClient on the browser,
 * and a fresh one on the server (per-request).
 */
export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always a new client so no shared state between requests
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
