import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const isDev = process.env.NODE_ENV === 'development';

const config: CapacitorConfig = {
  // ── Store Identity ─────────────────────────────────────────────────────────
  // This MUST match the applicationId in android/app/build.gradle and
  // the Bundle Identifier in the iOS App Store Connect entry.
  appId: 'com.eightyroad.app',
  appName: '80road',
  webDir: 'dist',
  
  // ── Development Server (Live Reload) ───────────────────────────────────────
  ...(isDev && {
    server: {
      cleartext: true,
    },
  }),

  plugins: {
    PushNotifications: {
      // Controls how notifications are presented when the app is in the foreground (iOS).
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#020617',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },

    StatusBar: {
      style: 'DARK',
      backgroundColor: '#020617',
    },

    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
  },

  android: {
    allowMixedContent: true,
    backgroundColor: '#FFFFFF',
    loggingBehavior: isDev ? 'debug' : 'none',
  },

  ios: {
    backgroundColor: '#FFFFFF',
    loggingBehavior: isDev ? 'debug' : 'none',
    scheme: 'App',
  },
};

export default config;
