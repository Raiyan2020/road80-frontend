---
name: state-ownership
description: Decides what belongs in TanStack Query vs Zustand vs local useState vs the URL in road-80, and the query-key/invalidation conventions. Use when adding state, creating a store, caching server data, sharing state between components, or debugging stale or duplicated state.
---

# State Ownership (road-80)

Most state bugs here are placement bugs. Decide ownership **before** writing the
state, using one question: *where does the truth live?*

## The decision table

| Truth lives… | Use | Example |
|---|---|---|
| On the server | **TanStack Query** | listings, profile, notifications, favorites |
| In the URL | **route search params** | filters, page number, active tab, search text |
| Across the app, client-only | **Zustand** (`stores/`) | auth user, language, theme, wizard progress |
| Inside one component | **`useState`** | dropdown open, hover, input draft |

**The cardinal rule: server data never goes in Zustand.** Copying a query result
into a store gives you two sources of truth that drift, and you lose refetching,
staleness, and invalidation. If you catch yourself writing
`setUser(data.user)` after a query, stop.

## Existing stores — do not duplicate these

```
stores/user.store.ts       auth user + token (persisted as `road80_user`)
stores/ui.store.ts         UI-level global flags
stores/favorites.store.ts  favorites
stores/unlock.store.ts     unlock state
stores/wizard.store.ts     multi-step post-ad wizard progress
```

Before creating a store, check whether one of these already owns the concept.
`favorites.store.ts` is the one to watch — favorites are also server state, so
confirm which direction is authoritative before adding to either side.

## When Zustand is right

Client state that outlives a component and isn't on the server:

- **auth session** — `user.store.ts`, persisted; `lib/api-client.ts` reads the
  token straight out of `localStorage['road80_user']`
- **language / direction** — owned by `i18n/store.ts`
- **wizard progress** — multi-step form state that must survive navigation

Keep stores small and flat. Select narrowly so components don't re-render on
unrelated changes:

```ts
const token = useUserStore((s) => s.user?.token);   // ✅ narrow selector
const store = useUserStore();                        // ❌ re-renders on any change
```

## URL state

Filters, pagination, and tabs belong in the URL — they should survive refresh,
back/forward, and sharing. TanStack Router gives typed search params; use them
rather than a store:

```ts
const { page, category } = Route.useSearch();
```

This matters more here than on a typical web app: deep links open the installed
mobile app, so URL-encoded state is what makes a shared link land correctly.

## Query keys and invalidation

Keys are hierarchical, most general first, so a prefix invalidates a subtree:

```ts
['listings']                    // all listings
['listings', { category, page }]// one filtered page
['listing', id]                 // one listing
```

After a mutation, invalidate the narrowest key that covers what changed:

```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['listing', id] });
  queryClient.invalidateQueries({ queryKey: ['listings'] });
}
```

Prefer invalidation over manually writing into the cache. Reach for
`setQueryData` only for optimistic updates, and always pair it with a rollback in
`onError`.

## Defaults already set

`lib/query-client.ts` configures: `staleTime` 60s, `retry: 1` with a 2s delay,
`refetchOnWindowFocus: true`. Override per query only with a reason — the
defaults are deliberately tuned for mobile.

⚠️ Two known problems in that file:
- `refetchOnReconnect: 'always'` directly contradicts the comment above it
  ("Do NOT refetch on reconnect by default — too aggressive for mobile").
  Confirm intent before copying the pattern.
- `typeof window === 'undefined'` SSR branches exist throughout, but this is a
  Vite SPA in a Capacitor shell — **there is no server**. That code is dead.

## Checklist

- [ ] Server data is in Query, not mirrored into Zustand
- [ ] Filters/pagination/tabs are in the URL, not a store
- [ ] Checked existing `stores/` before adding a new one
- [ ] Zustand read with a narrow selector
- [ ] Query key hierarchical; mutation invalidates the right prefix
- [ ] Local-only UI state left in `useState`
