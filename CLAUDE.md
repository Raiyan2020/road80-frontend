# 80road (road-80)

Arabic/English real-estate & contracting marketplace. React 19 SPA built with Vite, wrapped
with Capacitor 6 for iOS/Android.

## Tooling for agents

### Project skills — read these first

`.claude/skills/` contains 13 project-specific skills. They encode this repo's real
conventions and its known traps, and take precedence over generic React advice.

**Planning (before any code):**
- `feature-catalog` — feature IDs + status audit; sits on top of the installed GSD
  skills (`gsd-map-codebase`, `gsd-spec-phase`, `gsd-plan-phase`, `gsd-execute-phase`).
  **Never go from a business document straight to code.**

**Implementation:**
| Skill | Use when |
|---|---|
| `react-architecture` | creating components/features, deciding where a file goes |
| `laravel-api-contract` | any API call — the envelope and its traps |
| `api-error-handling` | queries, mutations, failures, forms |
| `auth-authorization` | login, logout, tokens, guards, session expiry |
| `state-ownership` | Query vs Zustand vs local vs URL state |
| `capacitor-native` | push, deep links, camera, status bar, native plugins |
| `platform-boundaries` | anything that must work on web *and* iOS/Android |
| `uploads-media` | file/image/video upload, FormData, compression |
| `offline-connectivity` | network failures, retry, poor connectivity |
| `observability` | logging, production debugging, error reporting |

**Closing out:** `verification-done` (before claiming done) and `git-safe-changes`
(before committing).

### General React guidance

**Use the `vercel-react-best-practices` skill** whenever writing, reviewing, or refactoring
components, hooks, data fetching, or bundle config in this repo. Prefer it over ad-hoc
judgement on re-render, memoization, and code-splitting questions.
⚠️ Roughly a third of its rules are Next.js-specific and do not apply — this is a Vite SPA.

Related skills, when the task matches:
- `vercel-composition-patterns` — refactoring boolean-prop pileups, compound components,
  context providers, reusable component APIs.
- `vercel-react-view-transitions` — route/page transitions and shared-element animation.

**Use Context7 (`resolve-library-id` → `query-docs`) before answering from memory** about any
dependency's API. This project pins recent majors — React 19, TanStack Router v1 / Query v5,
Zustand v5, Zod v4, Firebase v12 — where training-data recall is frequently stale. This is
cheaper than a wrong API call and a build failure.

## Commands

```bash
npm run dev      # vite dev server, port 3000, host 0.0.0.0
npm run build    # vite build -> dist/
npm run preview  # serve the built output
```

There is **no test, lint, or typecheck script**. To typecheck, run `npx tsc --noEmit`.

Native builds go through the Capacitor CLI (`npx cap sync`, `npx cap open ios|android`)
after `npm run build`. CI is configured in `codemagic.yaml`; web deploy in `vercel.json`.

## Architecture

Entry is `index.tsx` → mounts `<RouterProvider>` with the generated `routeTree.gen.ts`.

```
routes/       file-based routes; TanStackRouterVite generates routeTree.gen.ts from these
features/     per-feature UI + logic (home, explore, post-ad, auth, listing-detail, …)
components/   shared/legacy presentational components
shared/       cross-feature hooks, services, types, utils, constants
lib/          api-client.ts, api-base-url.ts, query-client.ts, firebase.config.ts, bridge.ts
stores/       zustand stores: user, ui, favorites, unlock, wizard
i18n/         translation layer, `useTranslation()` + TranslationKey
```

### Gotchas

- **`App.tsx` is dead code.** Nothing imports it. It is an older hash-based routing shell
  (`window.location.hash` + a `Tab` enum) left over from before the TanStack Router
  migration. Editing it changes nothing that ships — edit `routes/` and `routes/__root.tsx`
  instead. Delete it rather than extend it.
- **Never hand-edit `routeTree.gen.ts`.** It is regenerated from `routes/` by the Vite plugin.
- **`README.md` is a stale AI Studio template** and does not describe this app.
- Two HTTP clients are present (`axios` and `ofetch`). Route new code through `lib/api-client.ts`
  rather than importing either directly.

## Conventions

- Path alias `@/` maps to the project root (set in both `tsconfig.json` and `vite.config.ts`).
- TypeScript is **not fully strict** — only `strictNullChecks` is on. Do not assume `strict`
  behavior; new code should still be explicitly typed.
- Zustand stores are named `*.store.ts` in `stores/`.
- Zod schemas live beside their feature as `features/<feature>/schemas/*.schema.ts`.
- Toasts use `sonner` (see `shared/hooks/useLogout.ts` for the established pattern).
- UI is bilingual ar/en. User-facing strings belong in `i18n/locales`, not inline. Arabic is
  RTL — `i18n/index.ts` exposes `isRTL` and `i18n/store.ts` holds the `Dir` mapping, so read
  direction from there rather than hardcoding `dir`.

## Bundle

`vite.config.ts` defines manual chunks: everything in `node_modules` goes to `vendor`, except
`mediabunny` (video codec/muxing) which is split into `video-compression` so it stays out of
the initial load. Preserve that split — it is only needed after a web user picks a video.
