---
name: offline-connectivity
description: How road-80 should behave on poor or absent connectivity — detection, retry policy, cache behavior, and mutation safety on mobile networks. Use when handling network failures, adding retry logic, building anything a user might trigger on a bad connection, or debugging behavior in a tunnel/elevator.
---

# Connectivity & Offline (road-80)

This app runs on phones on mobile data. Intermittent connectivity is the normal
case, not the exception. "It worked on wifi" is not evidence.

## Current state — be honest about it

Offline handling today is **minimal**:

- `@capacitor/network` is **not installed**. There is no native connectivity signal.
- The only check in the codebase is one `navigator.onLine` read in
  `features/post-ad/hooks/useChunkedVideoUpload.ts`.
- TanStack Query provides the only real resilience: `retry: 1`, `retryDelay: 2000`,
  `refetchOnWindowFocus: true`.

So: do not assume an offline layer exists. If a feature needs real offline
behavior, it has to be built, and adding `@capacitor/network` is a dependency
change worth raising rather than making silently.

## Detection

`navigator.onLine` is the only tool currently available. Know its limit: it
reports whether a network *interface* exists, **not** whether the internet is
reachable. Captive portals, dead cell data, and DNS failures all report `true`.

Treat it as a cheap negative check only:

```ts
if (navigator.onLine === false) { /* definitely offline — skip the attempt */ }
// `true` proves nothing. The request may still fail.
```

The authoritative signal is a **failed request**, not a flag. Design around
request outcomes.

If richer state is needed (connection type, metered, native events), that's
`@capacitor/network` — propose it explicitly.

## Retry policy

Defaults in `lib/query-client.ts` are deliberately conservative for mobile:
`retry: 1`, `retryDelay: 2000`. More retries means longer spinners and a user
who thinks the app hung.

- **Queries** — safe to retry. Raise the count only for genuinely critical reads.
- **Mutations** — **do not blanket-retry.** They aren't idempotent by default;
  retrying "create listing" can produce duplicates. Retry a mutation only when the
  endpoint is idempotent or the backend deduplicates.

For a long upload, exponential backoff beats a fixed 2s delay.

## Mutations on a flaky connection

The dangerous case: the request **reached the server and succeeded**, but the
response never came back. The client sees failure; the server sees success.

Rules:
1. **Disable the submit control while in flight.** Prevents the user's own retry
   from double-creating.
2. **Prefer idempotency.** Toggle endpoints (favorite on/off) should send the
   desired state, not "flip it".
3. **Optimistic updates need rollback.** If you `setQueryData` optimistically,
   restore the snapshot in `onError` — otherwise the UI shows a change that never
   persisted.
4. **Invalidate after reconnect** rather than trusting local state.

## Cache as the offline story

TanStack Query's cache is the app's de-facto offline read layer: with
`staleTime: 60_000`, recently-viewed data still renders while a refetch fails in
the background. Lean on it:

- Show **cached data plus a staleness indicator**, not a blank error screen.
- Only show a hard error when there is nothing cached to display.
- The cache is **in-memory** — it does not survive an app restart. Surviving
  restart requires a persister, which is not currently installed.

## What the user should see

| Situation | UI |
|---|---|
| Offline, cached data exists | render cached + a subtle "offline / not current" marker |
| Offline, nothing cached | empty state explaining offline + retry button |
| Request failed mid-action | keep the user's input, allow retry — **never discard a filled form** |
| Reconnected | refetch and clear the indicator |

Losing a half-filled post-ad form to a dropped connection is the worst outcome in
this app. Preserve form state locally (the wizard already uses
`stores/wizard.store.ts`) before it depends on a network call.

## ⚠️ Conflicting configuration

`lib/query-client.ts` sets `refetchOnReconnect: 'always'` under a comment saying
*"Do NOT refetch on reconnect by default — too aggressive for mobile."* Code and
intent disagree. Resolve this deliberately before relying on reconnect behavior.

## Checklist

- [ ] `navigator.onLine === true` not treated as proof of connectivity
- [ ] Mutations not blanket-retried
- [ ] Submit disabled while in flight
- [ ] Optimistic updates have rollback
- [ ] Cached data preferred over a blank error
- [ ] User input preserved across failure
- [ ] New connectivity dependency raised, not silently added
