import { toast } from 'sonner';
import { getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig, VAPID_KEY } from '@/lib/firebase.config';
import { API_BASE_URL } from '@/lib/api-base-url';
import { getQueryClient } from '@/lib/query-client';
import { useUserStore } from '@/stores/user.store';

const FCM_TOKEN_KEY = 'FCM_TOKEN';
const NATIVE_FCM_TOKEN_KEY = 'NATIVE_FCM_TOKEN';
const NATIVE_FCM_PLATFORM_KEY = 'NATIVE_FCM_PLATFORM';
let nativeBridgeInitialized = false;

type PushPlatform = 'android' | 'ios' | 'web';

declare global {
  interface Window {
    __FCM_TOKEN__?: string;
    __FCM_PLATFORM__?: PushPlatform;
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

const isNativePushPlatform = (platform: unknown): platform is 'android' | 'ios' =>
  platform === 'android' || platform === 'ios';

const getStoredAuthToken = (): string | null => {
  try {
    const userStr = localStorage.getItem('road80_user');
    if (!userStr) return null;

    const parsed = JSON.parse(userStr);
    return parsed?.state?.user?.token || parsed?.token || null;
  } catch {
    return null;
  }
};

const storeNativePushToken = (token: string, platform: 'android' | 'ios') => {
  localStorage.setItem(NATIVE_FCM_TOKEN_KEY, token);
  localStorage.setItem(NATIVE_FCM_PLATFORM_KEY, platform);
};

const syncNativePushTokenFromBridge = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = typeof window.__FCM_TOKEN__ === 'string' ? window.__FCM_TOKEN__ : null;
  const platform = window.__FCM_PLATFORM__;

  if (token && isNativePushPlatform(platform)) {
    storeNativePushToken(token, platform);
    return token;
  }

  return localStorage.getItem(NATIVE_FCM_TOKEN_KEY);
};

export const getNativeFcmToken = (): string | null => syncNativePushTokenFromBridge();

/**
 * Returns the stored FCM registration token from localStorage.
 * Used during OTP verification and logout to send the token to the backend.
 */
export const getFcmToken = (): string | null => {
  return localStorage.getItem(FCM_TOKEN_KEY);
};

export const getDevicePushToken = (): string | null => {
  return getNativeFcmToken() || getFcmToken();
};

export const getDeviceType = (): PushPlatform => {
  syncNativePushTokenFromBridge();
  const nativePlatform = localStorage.getItem(NATIVE_FCM_PLATFORM_KEY);
  return isNativePushPlatform(nativePlatform) ? nativePlatform : 'web';
};

export const registerCurrentDevice = async (
  token = getDevicePushToken(),
  authToken = getStoredAuthToken()
): Promise<void> => {
  if (!token) {
    return;
  }

  if (!authToken) {
    return;
  }

  const response = await fetch(`${API_BASE_URL}/notifications/register-device`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      device_id: token,
      device_type: getDeviceType(),
      lang: document.documentElement.lang || 'ar',
    }),
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => '');
    throw new Error(`Device registration failed with ${response.status}: ${responseText}`);
  }
};

export function requestNativeDeviceRegistration(authToken: string): void {
  if (!authToken || typeof window === 'undefined') {
    return;
  }

  window.ReactNativeWebView?.postMessage(
    JSON.stringify({
      type: 'REGISTER_PUSH_DEVICE',
      authToken,
    })
  );
}

export async function registerCurrentDeviceWithRetry(
  authToken: string,
  options?: { maxAttempts?: number; delayMs?: number }
): Promise<void> {
  const maxAttempts = options?.maxAttempts ?? 12;
  const delayMs = options?.delayMs ?? 1500;

  requestNativeDeviceRegistration(authToken);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const token = getDevicePushToken();
    if (token) {
      await registerCurrentDevice(token, authToken);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  console.warn('Push device registration skipped: FCM token was not available.');
}

export const initializeNativePushBridge = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const registerBridgeToken = (token: string, platform: 'android' | 'ios') => {
    storeNativePushToken(token, platform);
    void registerCurrentDevice(token).catch((error) => {
      console.warn('Failed to register push device from native bridge.', error);
    });

    const authToken = getStoredAuthToken();
    if (authToken) {
      requestNativeDeviceRegistration(authToken);
    }
  };

  syncNativePushTokenFromBridge();

  if (nativeBridgeInitialized) {
    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'REQUEST_FCM_TOKEN' }));
    return;
  }

  nativeBridgeInitialized = true;

  window.addEventListener('fcm-token', (event) => {
    const detail = (event as CustomEvent<{ token?: string; platform?: PushPlatform }>).detail;
    if (detail?.token && isNativePushPlatform(detail.platform)) {
      registerBridgeToken(detail.token, detail.platform);
    }
  });

  window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'REQUEST_FCM_TOKEN' }));
};

const FALLBACK_DEVICE_ID_KEY = 'FALLBACK_DEVICE_ID';

export const getNotificationCopy = (notif: any) => {
  const data = notif?.data || notif || {};
  return {
    title:
      data.title ||
      data.subject ||
      data.notification_title ||
      notif?.notification?.title ||
      notif?.title ||
      'إشعار',
    body:
      data.message ||
      data.description ||
      data.body ||
      data.content ||
      data.text ||
      notif?.notification?.body ||
      notif?.body ||
      '',
  };
};

/**
 * Returns the FCM token if available, otherwise returns a unique fallback device ID.
 * This ensures the backend always receives a unique identifier per device even if push is disabled.
 */
export const getDeviceId = (): string => {
  const fcmToken = getDevicePushToken();
  if (fcmToken) return fcmToken;

  let fallbackId = localStorage.getItem(FALLBACK_DEVICE_ID_KEY);
  if (!fallbackId) {
    fallbackId =
      'web-' +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    localStorage.setItem(FALLBACK_DEVICE_ID_KEY, fallbackId);
  }
  return fallbackId;
};

/**
 * Force-logout the current user.
 * Called when a push notification with type "block" or "delete" is received.
 * Works without React hooks so it can be called from anywhere.
 */
export const forceLogout = (reason: 'block' | 'delete' | 'session_expired') => {
  const store = useUserStore.getState();
  
  // If the user is already logged out, don't show random toasts
  if (!store.isAuthenticated) {
    return;
  }

  // Clear Zustand store + auth storage directly (no React hooks needed)
  store.logout();

  const msg =
    reason === 'block'
      ? 'تم تعليق حسابك من قبل الإدارة'
      : reason === 'delete'
      ? 'تم حذف حسابك من قبل الإدارة'
      : 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً';

  toast.error(msg, { duration: 12000 });

  // Redirect to /auth — replace so user cannot navigate back
  setTimeout(() => {
    window.location.replace('/auth');
  }, 800);
};

/**
 * Initializes Firebase Cloud Messaging for web.
 *
 * Flow:
 *  1. Requests browser notification permission.
 *  2. Registers the Firebase service worker.
 *  3. Retrieves the FCM registration token the backend needs.
 *  4. Persists the token in localStorage under FCM_TOKEN.
 *  5. Listens for foreground messages — if type is block/delete, force-logout.
 *  6. Listens for SW postMessage for background block/delete notifications.
 *
 * Prerequisites:
 *  - public/firebase-messaging-sw.js must exist and be configured.
 *  - firebaseConfig.appId and VAPID_KEY must be filled in lib/firebase.config.ts.
 */
export const initializePushNotifications = async (): Promise<void> => {
  initializeNativePushBridge();

  if (typeof window !== 'undefined' && window.ReactNativeWebView) {
    return;
  }

  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return;
  }

  // Request permission only if not yet decided
  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    return;
  }

  try {
    // Avoid re-initializing Firebase on hot reloads
    const app =
      getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    // Register the service worker that handles background messages
    const swRegistration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js'
    );

    // Get the FCM registration token — backend needs this to send push notifications
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      localStorage.setItem(FCM_TOKEN_KEY, token);
      void registerCurrentDevice(token).catch(() => undefined);
    }

    // ── Foreground message handler (app tab is open & visible) ──────────────
    onMessage(messaging, (payload) => {
      // The backend sends { data: { type: "block" } } or { data: { type: "delete" } }
      const type = payload.data?.type as string | undefined;

      if (type === 'block' || type === 'delete') {
        forceLogout(type);
        return; // Don't show a normal notification toast
      }

      // Normal notification
      const copy = getNotificationCopy(payload);
      const title = copy.title || payload.notification?.title || 'إشعار جديد';
      const body = copy.body || payload.notification?.body;
      toast.info(title, { description: body, duration: 10000 });
      const queryClient = getQueryClient();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    });

    // ── Background message handler ──────────────────────────────────────────
    // When app is in the background/closed, the service worker handles the FCM
    // message and posts a FORCE_LOGOUT message back to this page when it reopens.
    navigator.serviceWorker.addEventListener('message', (event) => {
      const data = event.data || {};
      if (data.type === 'FORCE_LOGOUT') {
        forceLogout(data.reason as 'block' | 'delete');
      }
    });
  } catch (err) {
    // Handle FCM initialization failure silently
  }
};
