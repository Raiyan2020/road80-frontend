// Firebase Cloud Messaging Service Worker
// This file MUST live in /public so it's served from the root of your domain.
// The browser requires the service worker at exactly: https://yourdomain.com/firebase-messaging-sw.js

// ⚠️ Keep these values in sync with lib/firebase.config.ts
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyC6ZAwuIGCrkSZrGn26HTJK3V1Ktllz7Dc',
  authDomain: 'road-d5491.firebaseapp.com',
  projectId: 'road-d5491',
  storageBucket: 'road-d5491.firebasestorage.app',
  messagingSenderId: '188664861433',
  appId: '1:188664861433:web:8592a8c84726e535678828',
  measurementId: 'G-KDMP9FJPRT',
});

const messaging = firebase.messaging();

// ── Language ───────────────────────────────────────────────────────────────
// A service worker cannot read localStorage or the zustand store, so the page
// mirrors the active language into the Cache API (see shared/utils/sw-lang.ts)
// and we read it back here. Kept in a module variable as a fast path, but
// always re-read from the cache because the SW can be terminated at any time.
const LANG_CACHE = 'road80-prefs';
const LANG_KEY = '/__lang';
let cachedLang = 'ar';

async function getLang() {
  try {
    const cache = await caches.open(LANG_CACHE);
    const hit = await cache.match(LANG_KEY);
    if (hit) {
      const value = (await hit.text()).trim();
      if (value === 'ar' || value === 'en') {
        cachedLang = value;
      }
    }
  } catch (e) {
    // Cache unavailable — fall back to the last known value.
  }
  return cachedLang;
}

// Mirrors the keys the app uses for these same notifications. Kept inline
// because a service worker cannot import the app's i18n bundle.
const SW_STRINGS = {
  ar: {
    adApprovedTitle: 'تمت الموافقة على نشر إعلانك',
    adApprovedBodyNamed: 'تمت الموافقة على إعلان "{title}" ويمكن للمستخدمين مشاهدته الآن',
    adApprovedBody: 'تمت الموافقة على إعلانك ويمكن للمستخدمين مشاهدته الآن',
    defaultTitle: 'إشعار جديد',
    blockedTitle: 'تم تعليق الحساب',
    blockedBody: 'تم تعليق حسابك من قبل الإدارة',
    deletedTitle: 'تم حذف الحساب',
    deletedBody: 'تم حذف حسابك من قبل الإدارة',
  },
  en: {
    adApprovedTitle: 'Your ad has been approved',
    adApprovedBodyNamed: 'Your ad "{title}" has been approved and is now visible to users',
    adApprovedBody: 'Your ad has been approved and is now visible to users',
    defaultTitle: 'New notification',
    blockedTitle: 'Account suspended',
    blockedBody: 'Your account has been suspended by the administration',
    deletedTitle: 'Account deleted',
    deletedBody: 'Your account has been deleted by the administration',
  },
};

const swT = (lang, key, params) => {
  let value = (SW_STRINGS[lang] || SW_STRINGS.ar)[key] || SW_STRINGS.ar[key] || key;
  if (params) {
    Object.keys(params).forEach((name) => {
      value = value.replace(`{${name}}`, params[name]);
    });
  }
  return value;
};

// Picks the language-matched side of a payload field when the backend sends
// both (e.g. title_ar / title_en), falling back to the plain key.
const pickField = (data, base, lang) =>
  data[`${base}_${lang}`] || data[`${base}_ar`] || data[`${base}_en`] || data[base];

const getNotificationCopy = (notif, lang) => {
  const data = notif?.data || notif || {};
  const type = data.type || notif?.type;
  const adTitle =
    pickField(data, 'ad_title', lang) ||
    data.adTitle ||
    pickField(data, 'listing_title', lang) ||
    pickField(data, 'title', lang);

  if (type === 'ad_approved') {
    return {
      title: swT(lang, 'adApprovedTitle'),
      body: adTitle
        ? swT(lang, 'adApprovedBodyNamed', { title: adTitle })
        : swT(lang, 'adApprovedBody'),
    };
  }

  return {
    title:
      pickField(data, 'title', lang) ||
      pickField(data, 'subject', lang) ||
      notif?.notification?.title ||
      notif?.title ||
      swT(lang, 'defaultTitle'),
    body:
      pickField(data, 'message', lang) ||
      pickField(data, 'body', lang) ||
      pickField(data, 'content', lang) ||
      pickField(data, 'description', lang) ||
      notif?.notification?.body ||
      notif?.body ||
      '',
  };
};

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification?.data || {};
  const adId = data.ad_id || data.adId;
  const targetUrl = adId ? `/ad/${adId}` : '/notifications';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle background notifications (when the browser tab is hidden or closed)
messaging.onBackgroundMessage(async (payload) => {
  const lang = await getLang();
  const type = payload.data && payload.data.type;

  // ── Block / Delete: notify all open tabs to force-logout ─────────────────
  if (type === 'block' || type === 'delete') {
    // Post a message to every open client (tab/window) so the app can logout
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'FORCE_LOGOUT', reason: type });
      });
    });

    // Also show a system notification so the user knows even if no tab is open
    const title = swT(lang, type === 'block' ? 'blockedTitle' : 'deletedTitle');
    const body  = swT(lang, type === 'block' ? 'blockedBody' : 'deletedBody');

    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
    });
    return;
  }

  // ── Normal notification ───────────────────────────────────────────────────
  const copy = getNotificationCopy(payload, lang);
  const notificationTitle = copy.title || payload.notification?.title || swT(lang, 'defaultTitle');
  const notificationOptions = {
    body: copy.body || payload.notification?.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
