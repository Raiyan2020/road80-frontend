// Firebase Cloud Messaging Service Worker
// This file MUST live in /public so it's served from the root of your domain.
// The browser requires the service worker at exactly: https://yourdomain.com/firebase-messaging-sw.js

// ⚠️ Keep these values in sync with lib/firebase.config.ts
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyC-Acd0GoIo3SG27JE_JKIG-Hdb3_SG35c',
  authDomain: 'road-d5491.firebaseapp.com',
  projectId: 'road-d5491',
  storageBucket: 'road-d5491.firebasestorage.app',
  messagingSenderId: '188664861433',
  appId: 'REPLACE_WITH_WEB_APP_ID', // ← Must match firebase.config.ts
});

const messaging = firebase.messaging();

// Handle background notifications (when the browser tab is hidden or closed)
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background notification received:', payload);

  const notificationTitle = payload.notification?.title || 'إشعار جديد';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
