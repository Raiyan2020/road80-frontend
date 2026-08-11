---
name: auth-authorization
description: How authentication works in road-80 — token storage and the two legacy formats, the forceLogout path, OTP flow, route guards, and the security tradeoffs of localStorage tokens in a Capacitor app. Use when touching login, logout, protected routes, token handling, session expiry, or blocked accounts.
---

# Authentication & Authorization (road-80)

## Where the token lives

`localStorage['road80_user']`, written by the Zustand persist middleware.

**Two formats are supported** — `lib/api-client.ts` reads both:

```ts
parsed?.state?.user?.token   // Zustand persist: { state: { user: { token } }, version: 0 }
  || parsed?.token           // legacy flat:     { token: "..." }
```

Any new code reading the token must handle both, or must go through the existing
helper rather than re-parsing. Do not re-implement this inline — that is how
`utils/api-client.ts` became a broken fork (it reads only the flat format and
would silently fail to authenticate).

## How the token is attached

Automatically, in `lib/api-client.ts`'s `onRequest`. **Never set an
`Authorization` header yourself** and never pass the token as a function
argument through your service layer.

## Terminal session states

The backend signals these in the **body**, not the HTTP status (see
`laravel-api-contract`):

| Body | Meaning | Handler |
|---|---|---|
| `status: "needLogin"` | token missing/invalid/expired | `forceLogout('session_expired')` |
| `status: "block"` | account blocked by an admin | `forceLogout('block')` |
| HTTP `401` | rejected by middleware | `forceLogout('session_expired')` |

A blocked account arrives as **HTTP 422**, not 403 — `errorResponse()` defaults
to 422. `lib/api-client.ts` checks the body in *both* `onResponse` (2xx) and
`onResponseError` (non-2xx) precisely because of this.

`forceLogout` lives in `shared/utils/notifications.ts`. Route all logout through
it — it also clears the push-notification device registration.

## Auth endpoints are exempt

```ts
const AUTH_PATHS = ['/v1/auth/login', '/v1/auth/register', '/v1/auth/verify-otp', '/auth/logout'];
```

These skip force-logout entirely: a wrong OTP legitimately returns
`status: "needLogin"` while the user was never logged in. **If you add an
auth-adjacent endpoint, add it to this list**, or a failed attempt will eject the
user mid-flow.

## OTP flow

Login/registration is phone + OTP (`/v1/auth/verify-otp`). On successful
verification the app also registers the device's FCM token with the backend
(`registerCurrentDevice`) — see `capacitor-native`. If you change the
verification flow, keep that registration call or push notifications silently
stop working for new sessions.

## Route guards

`routes/__root.tsx` gates authenticated areas. Read auth state from
`stores/user.store.ts`, not by parsing localStorage in a component.

Note the pattern in the codebase: auth is read via a **lazy `useState`
initializer** rather than an effect, deliberately — an effect-based read races
with route guards and flashes the login screen. Preserve that.

## ⚠️ Security posture — known tradeoffs

Flag these when touching auth; do not silently "fix" them without a decision:

1. **Token in `localStorage` is XSS-reachable.** Any injected script can read it.
   This app already depends on `@capacitor/preferences`, which maps to native
   secure storage on iOS/Android — the stronger option for native builds.
2. **`allowMixedContent: true`** is set for Android in `capacitor.config.ts`.
   That permits HTTP subresources inside the HTTPS webview, which weakens
   transport security and makes token interception more plausible.
3. **The empty catch in `lib/api-client.ts:66-68`** swallows token-read failures.
   A corrupted `road80_user` silently produces unauthenticated requests with no
   diagnostic — it looks like a backend bug.

## Authorization ≠ authentication

Being logged in does not mean being permitted. The backend is the authority —
never rely on hiding a button as the control. Ownership checks (can this user
edit this listing?) must be enforced server-side; the frontend only reflects the
result. Most authz denials arrive as **422 with a message**, not 403.

## Checklist

- [ ] Token read via the client/store, never re-parsed inline
- [ ] No manual `Authorization` header
- [ ] New auth-adjacent endpoint added to `AUTH_PATHS`
- [ ] Logout routed through `forceLogout`
- [ ] Guard reads the store, not `localStorage`
- [ ] No client-side-only authorization assumption
