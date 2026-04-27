import { toast } from 'sonner';
import { getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig, VAPID_KEY } from '@/lib/firebase.config';

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
    fallbackId = 'web-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(FALLBACK_DEVICE_ID_KEY, fallbackId);
  }
  return fallbackId;
};

// Log the stored token immediately on every page load so it's always visible in the console
const _storedToken = localStorage.getItem(FCM_TOKEN_KEY);
if (_storedToken) {
  // FCM Token exists
} else {
  // No FCM Token stored
}

/**
 * Initializes Firebase Cloud Messaging for web.
 *
 * Flow:
 *  1. Requests browser notification permission.
 *  2. Registers the Firebase service worker.
 *  3. Retrieves the FCM registration token (the "regular" token the backend needs).
 *  4. Persists the token in localStorage under FCM_TOKEN.
 *  5. Listens for foreground messages and shows a toast.
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
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    // Register the service worker that handles background messages
    const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // Get the FCM registration token — this is the token the backend developer needs
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      localStorage.setItem(FCM_TOKEN_KEY, token);
    } else {
      // Handle no token
    }

    // Handle foreground (in-app) messages
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || 'إشعار جديد';
      const body = payload.notification?.body;
      toast.info(title, { description: body, duration: 5000 });
    });

  } catch (err) {
    // Handle FCM initialization failure
  }
};
