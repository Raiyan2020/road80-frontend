---
name: capacitor-native
description: Native integration for road-80's Capacitor 6 iOS/Android build — config, plugin lifecycle, push notifications and FCM device registration, deep links, status bar/keyboard, and native file paths. Use when touching push, deep links, camera, filesystem, splash/status bar, native permissions, or anything under ios/ or android/.
---

# Capacitor Native Integration (road-80)

This is not a web app with a wrapper bolted on — iOS and Android are first-class
targets. `appId: com.eightyroad.app`, `webDir: dist`.

Read `platform-boundaries` alongside this: every native call must be guarded so
the web build keeps working.

## Build cycle

Native code does **not** hot-reload. After changing web code:

```bash
npm run build && npx cap sync      # copy dist/ + update native deps
npx cap open ios | android         # then build/run from Xcode / Android Studio
```

`npx cap sync` is required after adding any plugin, not just `cap copy`.

## Config is the source of truth

`capacitor.config.ts` configures `PushNotifications`, `SplashScreen`, `StatusBar`,
and `Keyboard`. Change behavior **there**, not with imperative calls at startup,
unless the value is dynamic (theme-driven status bar colors are the legitimate
exception — see below).

⚠️ `android.allowMixedContent: true` permits HTTP subresources inside the HTTPS
webview. It weakens transport security; flag it rather than extending it.

`appId` must stay in sync with `applicationId` in `android/app/build.gradle` and
the iOS bundle identifier.

## Plugin lifecycle — always clean up

Capacitor listeners return a **Promise** of a handle. The naive pattern leaks:

```ts
// ❌ bug present in routes/__root.tsx — cleanup may run before .then() resolves
let listenerHandle: any;
CapApp.addListener('appUrlOpen', handler).then((h) => { listenerHandle = h; });
return () => { listenerHandle?.remove(); };
```

```ts
// ✅ await the handle, and guard against unmount
useEffect(() => {
  let cancelled = false;
  let handle: PluginListenerHandle | undefined;
  CapApp.addListener('appUrlOpen', handler).then((h) => {
    if (cancelled) { void h.remove(); } else { handle = h; }
  });
  return () => { cancelled = true; void handle?.remove(); };
}, []);
```

## Push notifications

Wiring lives in `shared/utils/notifications.ts`, initialized from
`routes/__root.tsx`.

Flow:
1. The native layer obtains an FCM token and exposes it on `window.__FCM_TOKEN__`
   (a native→web bridge, not a Capacitor plugin API).
2. `storeNativePushToken()` caches it in `localStorage` under the FCM token key.
3. `registerCurrentDevice(token, authToken)` POSTs it to the backend as
   `device_id`.
4. Registration happens **after OTP verification**, and the token is sent again on
   logout so the backend can unregister the device.

Consequences:
- If you change the OTP/verification flow, keep the registration call or push
  silently stops working for new sessions.
- Token acquisition is async and may not be ready at startup — the code already
  logs `"Push device registration skipped: FCM token was not available."` Treat a
  missing token as a normal state, not an error.
- `presentationOptions: ['badge','sound','alert']` in config controls **foreground**
  display on iOS. Without it, iOS shows nothing while the app is open.

## Deep links

Handled in `routes/__root.tsx` via `appUrlOpen`. Two entry forms:

- custom scheme `road80://…`
- universal/app links `https://80road.raiyansoft.net/…` (and the `http://` form)

Both are normalized to a common origin, then the `pathname + search` is handed to
the router with `replace: true` so the deep link doesn't add a back-stack entry.

**When adding a route that should be deep-linkable**, verify the path survives that
normalization, and confirm the native side is registered:
- iOS: associated domains entitlement + `apple-app-site-association` on the domain
- Android: intent filters + `assetlinks.json`

A route working in the browser proves nothing about the installed app.

⚠️ The deep-link handler contains an empty catch (`catch (e) { // Handle deep link error }`).
A malformed URL is silently dropped — the app just doesn't navigate, with no
diagnostic. Prefer logging (see `observability`).

## Status bar, keyboard, splash

Status bar colors are driven imperatively by the theme effect in
`routes/__root.tsx` — legitimate, because the value is dynamic:

```ts
if (Capacitor.isNativePlatform()) {
  StatusBar.setBackgroundColor({ color: '#020617' });
  StatusBar.setStyle({ style: Style.Dark });
}
```

`StatusBar.setOverlaysWebView({ overlay: true })` means content renders **under**
the status bar — account for safe-area insets in layout, or content sits beneath
the clock.

Keyboard uses `KeyboardResize.Body`; `shared/hooks/useKeyboardOpen.ts` branches on
native. Use that hook rather than listening to keyboard events yourself.

## Native file paths

A native filesystem path is **not** a usable `src`. Convert it:

```ts
const url = Capacitor.convertFileSrc(nativePath);   // shared/utils/video-compression.ts
```

Forgetting this yields a broken image/video that works in the browser and fails
only on device.

## Checklist

- [ ] Native calls guarded by `Capacitor.isNativePlatform()`
- [ ] Listener handle awaited and removed on unmount
- [ ] `npx cap sync` run after adding a plugin
- [ ] New deep-linkable route verified against normalization + native registration
- [ ] Native file paths passed through `convertFileSrc`
- [ ] Config changes made in `capacitor.config.ts`, not ad-hoc at startup
- [ ] Tested on device, not just `npm run dev`
