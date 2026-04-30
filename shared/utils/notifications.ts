import { toast } from 'sonner';
import { getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig, VAPID_KEY } from '@/lib/firebase.config';
import { useUserStore } from '@/stores/user.store';

const FCM_TOKEN_KEY = 'FCM_TOKEN';

/**
 * Returns the stored FCM registration token from localStorage.
 * Used during OTP verification and logout to send the token to the backend.
 */
export const getFcmToken = (): string | null => {
  return localStorage.getItem(FCM_TOKEN_KEY);
};

const FALLBACK_DEVICE_ID_KEY = 'FALLBACK_DEVICE_ID';

/**
 * Returns the FCM token if available, otherwise returns a unique fallback device ID.
 * This ensures the backend always receives a unique identifier per device even if push is disabled.
 */
export const getDeviceId = (): string => {
  const fcmToken = getFcmToken();
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
export const forceLogout = (reason: 'block' | 'delete') => {
  // Clear Zustand store + auth storage directly (no React hooks needed)
  useUserStore.getState().logout();

  const msg =
    reason === 'block'
      ? 'تم تعليق حسابك من قبل الإدارة'
      : 'تم حذف حسابك من قبل الإدارة';

  toast.error(msg, { duration: 6000 });

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
      const title = payload.notification?.title || 'إشعار جديد';
      const body = payload.notification?.body;
      toast.info(title, { description: body, duration: 5000 });
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
