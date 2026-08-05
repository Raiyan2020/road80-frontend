import { useLangStore, type Lang } from '@/i18n';

/**
 * The Firebase messaging service worker renders background push notifications,
 * but a service worker can read neither localStorage nor the zustand store.
 * The Cache API is reachable from both contexts, so the page mirrors the active
 * language there and `public/firebase-messaging-sw.js` reads it back.
 */
const LANG_CACHE = 'road80-prefs';
const LANG_KEY = '/__lang';

export async function publishLangToServiceWorker(lang: Lang): Promise<void> {
  if (typeof caches === 'undefined') return;
  try {
    const cache = await caches.open(LANG_CACHE);
    await cache.put(LANG_KEY, new Response(lang));
  } catch {
    // Cache API unavailable (private mode, unsupported browser) — the worker
    // falls back to Arabic, which is the app default anyway.
  }
}

/**
 * Publishes the current language immediately and on every change.
 * Call once during app startup.
 */
export function initSwLangSync(): () => void {
  void publishLangToServiceWorker(useLangStore.getState().lang);
  return useLangStore.subscribe((state, prev) => {
    if (state.lang !== prev.lang) void publishLangToServiceWorker(state.lang);
  });
}
