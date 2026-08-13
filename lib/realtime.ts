import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { getLang } from '@/i18n';
import { API_BASE_URL } from '@/lib/api-base-url';

let echo: Echo<'pusher'> | null = null;

const parsePort = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * Starts the single authenticated Echo connection used by the application.
 * Returns null when no public Pusher key was supplied so REST polling remains
 * a working fallback in local and partially configured deployments.
 */
export function connectRealtime(token: string): Echo<'pusher'> | null {
  disconnectRealtime();

  const key = import.meta.env.VITE_PUSHER_APP_KEY?.trim();
  if (!key) {
    if (import.meta.env.DEV) {
      console.info('[realtime] VITE_PUSHER_APP_KEY is not configured; using polling fallback');
    }
    return null;
  }

  const cluster = import.meta.env.VITE_PUSHER_APP_CLUSTER?.trim() || 'mt1';
  const host = import.meta.env.VITE_PUSHER_HOST?.trim();
  const scheme = import.meta.env.VITE_PUSHER_SCHEME?.trim() || 'https';
  const port = parsePort(import.meta.env.VITE_PUSHER_PORT, scheme === 'https' ? 443 : 80);

  echo = new Echo<'pusher'>({
    broadcaster: 'pusher',
    key,
    cluster,
    Pusher,
    forceTLS: scheme === 'https',
    authEndpoint: `${API_BASE_URL}/broadcasting/auth`,
    bearerToken: token,
    auth: {
      headers: {
        Accept: 'application/json',
        'Accept-Language': getLang(),
      },
    },
    ...(host
      ? {
          wsHost: host,
          wsPort: port,
          wssPort: port,
          enabledTransports: ['ws', 'wss'],
        }
      : {}),
  });

  return echo;
}

export function getRealtimeSocketId(): string | undefined {
  return echo?.socketId();
}

export function disconnectRealtime() {
  echo?.disconnect();
  echo = null;
}
