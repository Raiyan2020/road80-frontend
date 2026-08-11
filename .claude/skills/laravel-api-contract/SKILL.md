---
name: laravel-api-contract
description: The exact request/response contract between the road-80 React frontend and the Laravel 12 backend — the {status, message, data, errors} envelope, the polymorphic `status` field, pagination shape, and why HTTP status codes are NOT trustworthy here. Use when calling the API, adding a service function, typing a response, debugging a request, or interpreting a backend error.
---

# Laravel API Contract (road-80)

Backend: **Laravel 12 / PHP 8.2**, at `../backend/Raod80-backend`.
Every JSON response is built by `app/Traits/ApiResponse.php`. Read that trait before
assuming any Laravel default applies — this API does **not** follow Laravel's
standard `data`/`meta`/`links` conventions.

## The envelope

Every response — success or failure — has the same four keys:

```jsonc
{
  "status":  true,        // see below — NOT always a boolean
  "message": "…",         // human-readable, ALREADY LOCALIZED by the backend
  "data":    {},          // payload, [] when empty
  "errors":  []           // validation details, [] when none
}
```

`paginationResponse()` adds a fifth sibling key:

```jsonc
{
  "status": true, "message": "", "data": [...], "errors": [],
  "pagination": { "current_page": 1, "last_page": 9, "per_page": 15, "total": 130 }
}
```

**Pagination is a top-level `pagination` object — not Laravel's `meta`/`links`.**
There are no `next_page_url` / `prev_page_url` fields. Page through by comparing
`current_page` to `last_page`.

## ⚠️ `status` is polymorphic — the single most important rule

`status` is **not** a boolean. It is one of three things:

| Value | Meaning | Produced by |
|---|---|---|
| `true` | success | `successResponse()` |
| `false` | ordinary failure | `errorResponse()` |
| a **string** | terminal account state | `errorResponse(..., $key: 'block')` |

The string sentinels currently in use:

- `"block"` — the account was blocked by an admin
- `"needLogin"` — the token is missing, invalid, or expired

Never write `if (res.status)` — the string `"block"` is truthy and you will treat a
blocked account as a success. Always compare explicitly:

```ts
if (res.status === true) { /* success */ }
if (typeof res.status === 'string') { /* terminal account state */ }
```

`lib/api-client.ts` already intercepts these globally and calls `forceLogout()`.
Do not re-implement that per-call.

## ⚠️ HTTP status codes are unreliable

`errorResponse()` signature:

```php
public function errorResponse($message, $status = 422, $data = [], $errors = [], $key = false)
```

**The default is 422.** Most call sites omit the status argument, so semantically
different failures — authorization denied, not found, business-rule violation,
blocked account — all arrive as **HTTP 422**. A blocked user does not get 403.

Consequences for frontend code:

- **Do not** branch on `response.status` (HTTP) to tell validation from authorization.
- **Do** read the body: `status`, `message`, and `errors`.
- 401 *is* meaningful and is handled centrally (see `api-error-handling` skill).
- A 422 is **not** proof of a validation error. Check `errors` is non-empty first.

## Calling the API

Always go through `lib/api-client.ts`. Never import `ofetch` or `axios` directly
in a component or feature.

```ts
import api from '@/lib/api-client';

const res = await api.get<ListingResponse>('/v1/listings', { query: { page } });
```

The client already handles, per request:
- `Authorization: Bearer <token>` from `localStorage['road80_user']`
- `Accept-Language` from the live i18n store (`getLang()`)
- stripping `Content-Type` when the body is `FormData`
- force-logout on `401` and on body-level `block` / `needLogin`

`AUTH_PATHS` (`/v1/auth/login`, `/v1/auth/register`, `/v1/auth/verify-otp`,
`/auth/logout`) are exempt from force-logout — a wrong OTP returns
`status: "needLogin"` but the user was never logged in. If you add an
auth-adjacent endpoint, add it to that list.

## Typing responses

`data` is untyped at the transport layer. Define the payload type per service and
pass it as the generic:

```ts
type Envelope<T> = {
  status: boolean | string;
  message: string;
  data: T;
  errors: string[] | Record<string, string[]>;
};
```

Validate at the boundary with Zod when the shape matters (see
`features/*/schemas/*.schema.ts`). Do not trust `data` to be present — it is `[]`,
not `null`, when empty, so `data?.id` on an empty array silently yields `undefined`
rather than throwing.

## Localization

`message` is already translated by the backend according to the `Accept-Language`
header the client sends. **Render `message` directly — do not pass it through
`t()`.** Only frontend-authored strings belong in `i18n/locales`.

## Checklist before you ship an API call

- [ ] Goes through `lib/api-client.ts`, not a raw fetch
- [ ] Reads `status` with an explicit `=== true` / `typeof === 'string'` comparison
- [ ] Does not infer meaning from HTTP 422
- [ ] Handles `data` being `[]` rather than null/absent
- [ ] Renders `message` as-is, not re-translated
- [ ] Pagination read from `pagination`, not `meta`
