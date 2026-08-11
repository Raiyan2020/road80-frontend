---
name: observability
description: Production debugging for road-80 — what diagnostics exist today (very little), how to log without leaking data, and how to debug an issue on a real device. Use when adding logging, investigating a production bug, handling an error you can't reproduce locally, or deciding what to report.
---

# Observability & Production Debugging (road-80)

## Current state — near zero

Say this plainly, because it shapes every decision here:

- **No error tracking.** No Sentry, Bugsnag, Datadog, LogRocket, or Crashlytics.
- **Firebase is used only for messaging** (FCM push tokens) — not Analytics, not
  Crashlytics.
- **7 `console` statements in the entire app** (1 `error`, 1 `log`, 5 `warn`).
- `capacitor.config.ts` sets `loggingBehavior: 'none'` in production for both
  platforms — native logs are off.

**Consequence: when this app fails on a user's phone, you learn nothing.** There
is no report, no stack trace, no breadcrumb. The only signal is a user complaint.

Adding an error reporter is the highest-leverage improvement available. Treat it
as a proposal to raise, not a silent dependency addition.

## Why silent failures are the real problem

This codebase has **10 empty catch blocks** that discard the exact information
you'd need. Verified locations:

| Location | What it hides |
|---|---|
| `lib/api-client.ts:66` | token read/parse failure → user silently unauthenticated |
| `shared/utils/auth-storage.ts:18`, `:45` | **auth storage read/write failures → phantom logouts** |
| `routes/__root.tsx:211` | malformed deep link → app just doesn't navigate |
| `shared/utils/notifications.ts:357` | push registration failure → silently no notifications |
| `utils/api-client.ts:37`, `utils/db.ts:581` | (both in dead/legacy code) |
| `components/QuickWizard.tsx:132`, `HomePage.tsx:55`, `ListingDetailsPage.tsx:130` | UI-level faults |

The `auth-storage.ts` pair is the highest-priority fix: a user reporting "it logs
me out randomly" produces **zero** diagnostic today.

Each turns a diagnosable fault into "the app is broken sometimes". **Never write
`catch (e) {}`.** A catch block must log, report, or rethrow — pick one.

To re-audit after fixing, count them:

```bash
grep -rEn 'catch\s*\([^)]*\)\s*\{\s*(//[^\n]*)?\s*\}' --include='*.ts' --include='*.tsx' \
  . --exclude-dir=node_modules --exclude-dir=dist
```

```ts
// ❌
try { ... } catch (e) { /* Handle error */ }

// ✅
try { ... } catch (e) {
  console.error('[api-client] failed to read auth token', e);
  // and/or: report(e, { scope: 'auth' });
}
```

## Logging rules

Until a reporter exists, `console` is what you have. Use it deliberately.

- `console.error` — a genuine fault someone must act on
- `console.warn` — a recoverable/expected-but-notable condition (the existing
  `"Push device registration skipped: FCM token was not available."` is a good example)
- `console.log` — **development only.** Remove before committing.

Prefix with the subsystem so logs are greppable: `[api-client]`, `[push]`,
`[deeplink]`, `[upload]`.

### Never log

- tokens, `Authorization` headers, the contents of `road80_user`
- FCM device tokens
- phone numbers, OTP codes, addresses, or any PII
- full request/response bodies from auth endpoints

On native, logs can persist in device logs and crash reports. A logged token is a
leaked token.

## Debugging on device

The dev server cannot reproduce native-only bugs. Real inspection:

- **iOS** — Safari → Develop → \<device\> → inspect the webview. Xcode console for native.
- **Android** — `chrome://inspect` → inspect the webview. `adb logcat` for native.

To get native logs at all, temporarily flip `loggingBehavior` to `'debug'` in
`capacitor.config.ts`, then `npx cap sync` and rebuild. **Revert it before
shipping.**

Note the build must be rebuilt and synced — a web-only change won't appear on
device without `npm run build && npx cap sync`.

## Making failures diagnosable

Since there is no remote reporting, the UI *is* the error channel. Make it carry
enough to act on:

- Show the backend's `message` — it's already localized and often specific.
- Keep a stable identifier for the failing action so a user's description maps to
  code ("posting an ad failed at the upload step").
- Distinguish *offline* from *server error* from *validation* — see
  `api-error-handling`. "Something went wrong" for all three wastes the report.

## What to include when reporting a bug

- platform and build: web / iOS / Android, and app version
- language and direction (ar/RTL vs en/LTR) — several bugs here are RTL-only
- authenticated or not; blocked account?
- network conditions (wifi / mobile data / offline)
- exact steps, and whether it reproduces on web

## Checklist

- [ ] No empty catch blocks introduced
- [ ] Errors logged with a subsystem prefix
- [ ] No tokens, OTPs, or PII in any log
- [ ] `console.log` removed before commit
- [ ] `loggingBehavior` reverted if flipped to debug
- [ ] User-facing error distinguishes offline / server / validation
