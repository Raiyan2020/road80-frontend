---
name: api-error-handling
description: How road-80 handles API failures — the global TanStack Query toast layer, 401/403/422 semantics against the Laravel backend, meta.hideToast opt-out, validation errors into forms, and required loading/error/empty states. Use when adding a query or mutation, handling a failed request, building a form, or deciding whether to show an error to the user.
---

# API Error Handling (road-80)

Error handling here is **centralized by default**. Before writing a `try/catch` or
an `onError`, check whether the global layer already covers it — duplicated
handling produces double toasts, which is the most common bug in this area.

## The two global layers

**1. `lib/api-client.ts` — transport level**
- HTTP `401` → `forceLogout('session_expired')`, then swallows the error
- body `status: "needLogin"` → `forceLogout('session_expired')`
- body `status: "block"` → `forceLogout('block')`
- Skipped entirely for `AUTH_PATHS` (login/register/verify-otp/logout)

**2. `lib/query-client.ts` — UI level**
- `QueryCache.onError` and `MutationCache.onError` both fire a `sonner` toast
- `401` is explicitly silenced (layer 1 already redirected)
- Message resolution order: `err.data.message` → `err.message` → `t('common.genericError')`
- Mutation toasts use a fixed id (`'mutation-error'`) to collapse duplicates

**So: a failed request already shows a toast.** Adding your own `onError` toast
gives the user two.

## Opting out

Both caches respect a `meta` flag. Use it when the component renders the error
itself — inline form errors, empty states, a retry panel:

```ts
useQuery({
  queryKey: ['listing', id],
  queryFn: () => api.get(`/v1/listings/${id}`),
  meta: { hideToast: true },   // component renders the error inline
});
```

Same key works on `useMutation`. Reach for it whenever a toast would be redundant
with on-screen UI.

## Status semantics against this backend

Read `laravel-api-contract` first — HTTP codes are unreliable here.

| Signal | Real meaning | Who handles it |
|---|---|---|
| HTTP `401` | token rejected by middleware | api-client → force logout. Do not handle locally. |
| body `status: "needLogin"` | token invalid/expired | api-client → force logout |
| body `status: "block"` | account blocked (arrives as **HTTP 422**) | api-client → force logout |
| HTTP `422` + non-empty `errors` | genuine validation failure | **your form** |
| HTTP `422` + empty `errors` | a generic business-rule failure | show `message` |
| HTTP `403` | rare — most authz failures come back as 422 | show `message` |
| HTTP `5xx` | server fault | global toast; offer retry |
| network error | offline/timeout | see `offline-connectivity` |

**Never assume 422 means validation.** Check `errors` is non-empty before mapping
it to fields.

## Validation errors into a form

Laravel's `errors` is keyed by field with an array of messages:

```jsonc
{ "status": false, "message": "…", "data": [], "errors": { "phone": ["…"], "price": ["…"] } }
```

Map it to field state rather than toasting it — the user needs to see which input
failed:

```ts
const mutation = useMutation({
  mutationFn: (body) => api.post('/v1/listings', body),
  meta: { hideToast: true },            // errors render on the fields
  onError: (err) => {
    const fieldErrors = (err as any)?.data?.errors;
    if (fieldErrors && Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);            // inline, per field
    } else {
      toast.error((err as any)?.data?.message ?? t('common.actionFailed'));
    }
  },
});
```

Validate client-side with the feature's Zod schema **before** sending, so the
common cases never reach the server. Server errors are the backstop, not the
primary path.

## Every async surface needs four states

A query has four outcomes and the UI must handle all of them. Rendering only
success + spinner is the default failure mode of AI-generated code here.

- **loading** — skeleton matching final layout (see the `animate-pulse` skeletons in `features/home`)
- **error** — a message plus a retry affordance, not a dead end
- **empty** — `data: []` is a normal, common response from this API
- **success** — the content

Because the backend returns `data: []` rather than `null`, an empty result looks
structurally identical to a populated one. Check `length` explicitly.

## Do not swallow errors

`lib/api-client.ts:66-68` contains an empty catch:

```ts
} catch (error) {
  // Handle error
}
```

This silently drops failures while building the request — a malformed
`road80_user` in localStorage means the `Authorization` header is never attached
and the user mysteriously appears logged out, with no diagnostic. **Do not copy
this pattern.** A catch block must log, report, or rethrow. Fixing this one is a
worthwhile cleanup.

## Checklist

- [ ] Not adding a toast the global layer already fires
- [ ] `meta: { hideToast: true }` set when rendering the error inline
- [ ] `422` checked for non-empty `errors` before treating it as validation
- [ ] Field errors mapped to inputs, not toasted
- [ ] Loading, error, **empty**, and success all rendered
- [ ] No empty catch blocks
