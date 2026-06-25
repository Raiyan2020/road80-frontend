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

const getNotificationCopy = (notif) => {
  const data = notif?.data || notif || {};
  const type = data.type || notif?.type;
  const adTitle = data.ad_title || data.adTitle || data.listing_title || data.title;

  if (type === 'ad_approved') {
    return {
      title: 'تمت الموافقة على نشر إعلانك',
      body: adTitle
        ? `تمت الموافقة على إعلان "${adTitle}" ويمكن للمستخدمين مشاهدته الآن`
        : 'تمت الموافقة على إعلانك ويمكن للمستخدمين مشاهدته الآن',
    };
  }

  return {
    title:
      data.title ||
      data.subject ||
      notif?.notification?.title ||
      notif?.title ||
      'إشعار جديد',
    body:
      data.message ||
      data.body ||
      data.content ||
      data.description ||
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
messaging.onBackgroundMessage((payload) => {
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
    const title = type === 'block' ? 'تم تعليق الحساب' : 'تم حذف الحساب';
    const body  = type === 'block'
      ? 'تم تعليق حسابك من قبل الإدارة'
      : 'تم حذف حسابك من قبل الإدارة';

    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
    });
    return;
  }

  // ── Normal notification ───────────────────────────────────────────────────
  const copy = getNotificationCopy(payload);
  const notificationTitle = copy.title || payload.notification?.title || 'إشعار جديد';
  const notificationOptions = {
    body: copy.body || payload.notification?.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
