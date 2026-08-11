---
name: verification-done
description: What "done" means in road-80 and the verification gate that must pass before claiming it — the honest state of tooling, what typecheck does and does not prove, and per-change-type requirements. Use before saying a task is complete, fixed, or working, before committing, and before opening a PR.
---

# Verification & Definition of Done (road-80)

**Evidence before assertions.** Never say "done", "fixed", or "working" without
having run something and read the output. "It should work" is not a completion
claim; it's a guess.

## The honest state of the tooling

Be blunt about this — the gate here is weak, and pretending otherwise is how
broken code ships:

| Gate | Status |
|---|---|
| `npm run build` | ✅ works |
| `npx tsc --noEmit` | ⚠️ passes, but proves far less than it appears to (below) |
| lint | ❌ no ESLint installed |
| unit / component tests | ❌ no Vitest, no Testing Library |
| E2E | ❌ no Playwright |

There are only three scripts: `dev`, `build`, `preview`.

## ⚠️ Typecheck is close to meaningless right now

`@types/react` and `@types/react-dom` are **not installed**. React ships no
bundled types, so **every JSX element, hook, and prop is typed `any`.**

`npx tsc --noEmit` exits clean — but only because `noImplicitAny` is off,
silently suppressing ~1,700 "no `JSX.IntrinsicElements`" errors. TypeScript is
catching almost nothing on React code.

**So: a passing typecheck is not evidence that a component change is correct.**
Until `@types/react` is installed, weight manual verification much more heavily.
Installing it is the highest-value fix available in this repo.

## The gate

Run what applies, in order, and **read the output**:

```bash
npx tsc --noEmit      # must be clean (weak signal — see above)
npm run build         # must succeed; catches import + bundling errors
npm run dev           # exercise the actual changed screen in a browser
```

For anything touching native code (`capacitor-native`, `platform-boundaries`):

```bash
npm run build && npx cap sync && npx cap open ios   # or android
```

**`npm run dev` exercises the web path only.** Every `isNativePlatform()` branch
is skipped there. A native change verified only in the dev server is unverified.

## Requirements by change type

| Change | Minimum evidence |
|---|---|
| UI / component | build passes + screen exercised in browser; check **ar and en**, RTL and LTR |
| API / service | request observed in Network tab; success **and** failure path |
| Query / mutation | cache invalidation actually refreshes the UI |
| Auth | login, logout, expired token, blocked account |
| Native (push, deep link, camera) | **run on device or simulator** — no exceptions |
| Upload | real file, on a throttled connection |
| Routing | direct URL load, in-app nav, **and** deep link |
| i18n | both languages; layout in RTL |

## Definition of Done

A task is done when **all** hold:

- [ ] Acceptance criteria met — all of them, not the easy ones
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run build` succeeds
- [ ] Changed surface manually exercised in the relevant runtime(s)
- [ ] Loading, error, **empty**, and success states all handled
- [ ] Both languages checked if any user-facing string changed
- [ ] Native path tested on device if native code changed
- [ ] No new empty catch blocks, no leftover `console.log`
- [ ] No unrelated files changed
- [ ] Anything that could not be verified is **stated explicitly**

## Reporting honestly

If something is unverified, say so plainly and say why:

> Built and typechecked clean. Verified the listing page on web in both
> languages. **Did not verify on device** — the push registration path needs a
> real iOS build, which I couldn't run here.

That is a complete, useful report. A confident "done" covering the same work is a
false claim.

If a step fails, report the failure with its output. Do not describe partial work
as complete, and do not quietly narrow scope — if part of the task is blocked,
finish everything else and say exactly what was left and why.

## Blocked, not silently redesigned

If a task can't be completed as specified — the API doesn't expose what's needed,
a requirement contradicts existing behavior — **record it as blocked** with the
reason and the decision required. Do not invent an alternative design and build
that instead. See `feature-catalog` for the status vocabulary.
