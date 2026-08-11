---
name: platform-boundaries
description: Keeps road-80 working on web AND iOS/Android — how to detect platform, where to branch, and how to add native capability without breaking the browser build. Use when adding a native plugin, writing platform-conditional code, or when something works in the browser but fails on device (or vice versa).
---

# Web / Native Boundaries (road-80)

road-80 ships **three** runtimes from one codebase: browser, iOS webview, Android
webview. The recurring failure is adding a native capability that silently breaks
the web build — or shipping web-only code that dies on device.

## Detecting platform

```ts
import { Capacitor } from '@capacitor/core';

Capacitor.isNativePlatform()   // boolean — true on ios & android
Capacitor.getPlatform()        // 'web' | 'ios' | 'android'
```

Use `isNativePlatform()` for the common native/web split. Use `getPlatform()`
only when iOS and Android genuinely differ (permissions dialogs, push
presentation).

**Never** sniff the user agent, and never assume native — the browser build is a
real, shipping target (it's deployed via `vercel.json`).

## Where the branch belongs

Branch **inside a shared utility**, not in components. Components should ask for a
capability and receive a working implementation regardless of platform. The
codebase already does this well:

```
shared/utils/media-permissions.ts   → getPlatform() === 'web' branch
shared/utils/video-compression.ts   → native encoder vs WebCodecs
shared/hooks/useKeyboardOpen.ts     → native keyboard events vs viewport resize
```

Follow that shape:

```ts
// shared/utils/share.ts
export async function share(payload: SharePayload) {
  if (Capacitor.isNativePlatform()) return Share.share(payload);
  if (navigator.share) return navigator.share(payload);
  await navigator.clipboard.writeText(payload.url);   // last-resort fallback
}
```

A component then just calls `share(...)`. If you find `isNativePlatform()` inside
a `.tsx` component, that logic probably wants to move down a layer — the theme
status-bar effect in `routes/__root.tsx` is the deliberate exception.

## Every native capability needs a web answer

Before adding a plugin, decide the web behavior. There are only three acceptable
answers, and "it throws" is not one of them:

1. **Web equivalent** — Camera → `<input type="file" capture>`; Share → Web Share API
2. **Graceful degradation** — Push → in-app notification list only
3. **Hidden** — feature genuinely can't exist on web, so don't render the entry point

Pattern 3 must hide the *entry point*, not fail at the call site. A button that
throws on click is a bug; a button that isn't rendered is a decision.

## Things that differ and will bite you

| Concern | Web | Native |
|---|---|---|
| File paths | URLs / `File` objects | native paths — need `Capacitor.convertFileSrc()` |
| Storage | `localStorage` | `localStorage` works, but `@capacitor/preferences` is the durable/secure store |
| Permissions | browser prompt on use | explicit request + OS settings; can be permanently denied |
| Back button | browser history | Android hardware button needs an explicit listener |
| Keyboard | viewport resize | plugin events; see `useKeyboardOpen` |
| Safe areas | none | notch/status bar — `setOverlaysWebView(true)` is on |
| Deep links | plain URLs | `appUrlOpen` + native registration |

**Permissions are the sharpest edge.** On web a denied permission can be
re-prompted; on iOS/Android a denial is often permanent and only fixable in OS
settings. Handle "denied" as a real, persistent state with a message pointing the
user to settings — not a retry loop.

## Bundle-size asymmetry

Native builds ship the bundle inside the app; web downloads it over the network,
frequently on mobile data. `vite.config.ts` already splits `mediabunny` into a
`video-compression` chunk so the codec engine is not in the initial load. Preserve
that split, and prefer dynamic `import()` for anything heavy and
conditionally-used.

## Testing

`npm run dev` exercises the **web** path only. `Capacitor.isNativePlatform()` is
`false` there, so every native branch is skipped. A change to native code is
unverified until it runs on a device or simulator:

```bash
npm run build && npx cap sync && npx cap open ios   # or android
```

Claiming a native change works based on the dev server is a false completion
claim — see `verification-done`.

## Checklist

- [ ] Branch lives in `shared/utils` or a hook, not a component
- [ ] Web path defined: equivalent, degraded, or entry point hidden
- [ ] No user-agent sniffing
- [ ] Permission denial handled as a persistent state
- [ ] Native file paths converted with `convertFileSrc`
- [ ] Heavy native-only deps dynamically imported
- [ ] Verified on device, not only `npm run dev`
