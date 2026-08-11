---
name: feature-catalog
description: Adds stable feature IDs and an implementation-status vocabulary on top of GSD's planning output, so requested features are audited against what already exists before any code is written. Use when analyzing a business document, auditing what is already built, tracking feature status, or deciding what to build next.
---

# Feature Catalog & Status (road-80)

This skill is a **thin adapter over GSD**, not a replacement for it. GSD (67
skills, installed globally) already owns the pipeline:

| Stage | Use |
|---|---|
| Ingest a business doc / PRD | `gsd-ingest-docs` |
| Audit the existing codebase | `gsd-map-codebase` → `.planning/codebase/` |
| Specify a feature (ambiguity-scored) | `gsd-spec-phase` → `SPEC.md` |
| Interrogate unknowns | `gsd-discuss-phase` |
| Roadmap + dependencies | `gsd-roadmapper` → `.planning/ROADMAP.md` |
| Technical plan + task breakdown | `gsd-plan-phase` → `PLAN.md` |
| Execute with atomic commits | `gsd-execute-phase` |
| Verify (UAT) | `gsd-verify-work`, `gsd-validate-phase` |

**Do not rebuild those.** What GSD lacks is per-feature identity and status — it
thinks in phases. This skill supplies exactly that.

## The rule that matters most

**Never go from a business document straight to code.**

A line like *"customers should be able to use coupons"* is not a requirement. It
is a prompt for questions: who creates coupons? percentage or fixed? expiry?
minimum order? usage limits? per-customer limits? can they stack with loyalty
points? what happens on order cancellation?

**Do not invent answers to business questions.** Record them as open decisions and
ask. A guessed business rule is far more expensive than a delayed one, because it
ships and becomes the de-facto spec.

## Feature IDs

Every requested feature gets a stable ID, assigned once and never reused:

```
F-001  Authentication
F-014  Wishlist
```

Tasks hang off the feature ID:

```
F-014-T01  Verify backend wishlist contract
F-014-T02  Create wishlist API service
F-014-T03  Add query keys + useWishlist
```

IDs survive renames and re-prioritization, which is what makes cross-document
references (roadmap → spec → task → commit) stable.

## Status vocabulary

Audit **every** requested feature against the actual repo before planning. Use
exactly these values:

| Status | Meaning | Action |
|---|---|---|
| `NOT_STARTED` | no code exists | plan and build |
| `PARTIAL` | some pieces exist, incomplete | audit what's there **first**; extend, don't restart |
| `IMPLEMENTED` | working and complete | **do not rebuild** — verify, then move on |
| `BROKEN` | exists but does not work | debug before adding anything on top |
| `NEEDS_REFACTOR` | works, but blocks the requested change | refactor as its own task |
| `BLOCKED` | cannot proceed | record the reason + the decision required |

The purpose of the audit is to stop agents rebuilding what exists. In this repo
that risk is concrete: `favorites` already has both a store and services, and
push notifications are substantially built. An agent told "add favorites" without
an audit will produce a second, competing implementation.

## Evidence, not assertion

A status claim must cite where you looked:

```md
### F-004 — Push Notifications
**Status:** PARTIAL
**Evidence:**
- `shared/utils/notifications.ts` — FCM token capture + `registerCurrentDevice`
- `routes/__root.tsx` — `initializePushNotifications()` on mount
- `capacitor.config.ts` — `presentationOptions` configured
**Gaps:** no in-app notification centre; no deep-link routing from a tapped notification
**Open questions:** should a tapped notification deep-link to the listing?
```

`gsd-map-codebase` does the exploration; this format records the verdict.

## BLOCKED beats improvising

If implementation reveals the plan can't work — the API doesn't expose a needed
field, two requirements contradict — record it:

```md
**Status:** BLOCKED
**Reason:** `/v1/wishlist` does not return product availability; the spec requires
hiding unavailable items.
**Decision required:** extend the backend response, or fetch availability separately?
```

**Do not silently redesign the feature.** An implementation agent changing scope
on its own invalidates the roadmap everything else was planned against.

## Handing off to implementation

Once a feature is specified and unblocked, the road-80 implementation skills take
over: `react-architecture`, `laravel-api-contract`, `state-ownership`,
`api-error-handling`, `auth-authorization`, `capacitor-native`,
`platform-boundaries`, `uploads-media`, `offline-connectivity`,
`observability`, then `verification-done` and `git-safe-changes` to close.

## Checklist

- [ ] Business doc turned into questions, not assumptions
- [ ] `gsd-map-codebase` run before any status is assigned
- [ ] Every requested feature has an ID and a status
- [ ] Every status cites file-level evidence
- [ ] `PARTIAL` / `IMPLEMENTED` features audited, not rebuilt
- [ ] Open business questions recorded and asked, never invented
- [ ] Blockers recorded rather than designed around
