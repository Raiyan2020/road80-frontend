# Hotel Feature — Existing-System Audit & Plan

**Sources:** `bussiness.md` (use cases 1.1–5.2), `flutter-hotel-feature-api.md` (API contract)
**Target:** road-80 React frontend (`road-80/`) — **not** the Flutter app, **not** the admin panel
**Date:** 2026-08-11

---

## Current full-business status

The original audit below was scoped to the React application. A follow-up implementation pass
covered the related Laravel API and Filament requirements as well. All use cases in
`bussiness.md` are now implemented in the local frontend/backend workspaces.

| Use case | Local status | Implementation summary |
|---|---|---|
| 1.1–1.6 | Implemented | Hotel registration, profile/content management, public pages, sharing and conversations |
| 2.1 | Implemented | Hotel creation, editing and visibility/status management in Filament |
| 2.2 | Implemented | Read-only media review, hide-with-reason notification and permanent deletion |
| 3.1 | Implemented | Company creation/profile/status management, including website/contact fields |
| 3.2 | Implemented | Company content description review, hide/delete moderation without admin editing |
| 4.1 | Implemented | Company publishing and business contact/chat surfaces no longer require payment; hotel surfaces remain free |
| 5.1 | Implemented | Country/state/city management, default filter participation, protected fixed categories and hotel star/rating filters |
| 5.2 | Implemented | Create/update ratings, averages/counts, public filtering and admin hide/delete moderation |

**Verification:** frontend type-check and production build pass; backend test suite passes with
17 tests / 42 assertions; changed files pass whitespace and PHP syntax checks.

**Operational checks still required:** deploy both applications, run the Laravel migrations, and
verify Universal Links/App Links plus native sharing on real Android/iOS devices. These are release
steps, not missing repository implementation.

---

## 0. Scope — what is NOT frontend work

The business document mixes app and admin-panel use cases. These are **Laravel/Filament
dashboard** work and are out of scope for this repo:

| UC | Title | Where it belongs |
|---|---|---|
| 2.1 | إدارة الفنادق من لوحة التحكم | Filament admin |
| 2.2 | مراجعة محتوى الفنادق من لوحة التحكم | Filament admin |
| 3.1 | إنشاء وإدارة بروفايلات الشركات من لوحة التحكم | Filament admin |
| 3.2 | مراجعة محتوى الشركات من لوحة التحكم | Filament admin |
| 5.1 | إدارة التصنيفات والفلاتر من لوحة التحكم | Filament admin |

**In scope for React:** 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.1, 5.2.

The API doc is written **for Flutter** (`share_plus`, `youtube_player`, WebView). Those map to
different primitives here — see §4.

---

## 1. Feature catalog

Status vocabulary per the `feature-catalog` skill. Every status cites evidence.

### F-001 — Account type at registration (UC 1.1)
**Status:** `IMPLEMENTED` (2026-08-11) — pending device + real-backend verification
**Delivered:**
- `routes/auth.register-company.tsx` — account-type radiogroup, hotel label variants,
  department hidden + conditionally validated for hotels, `account_type` in the payload
- `routes/auth.pending-approval.tsx` — new screen, `pending` / `reject` variants
- `shared/types/auth.ts` — `AccountType`, `UserType`, `UserStatus`; `company_department_id` optional
- `i18n/locales/{ar,en}/auth.ts` — new keys in both languages
- `lib/api-client.ts` — **B-01 fixed** (see §2)
**Verified:** build ✅, `tsc --noEmit` ✅, browser ar/RTL + en/LTR ✅, conditional-validation A/B ✅
(hotel submits with no department error; company still requires it).
**Not verified:** real backend submission, device build.

**Original assessment below.**
**Status (before):** `PARTIAL`
**Evidence:**
- `routes/auth.register-company.tsx` (761 lines) — full company registration form, Zod-validated
- `shared/types/auth.ts:46` — `company_department_id` typed
- Endpoint `/auth/register-company` already called
**Gaps:** no `account_type` field anywhere in the repo; `company_department_id` is currently
unconditionally required but must become optional when `account_type=hotel`; no account-type
selector screen; no pending-approval screen.
**Reuse:** the entire existing form, validation, and submit path. Do **not** build a second
registration flow.

### F-002 — Hotel profile management (UC 1.2)
**Status:** `IMPLEMENTED` (2026-08-11) — pending real-backend + device verification
**Delivered:**
- `features/account/components/HotelProfileForm.tsx` — cover image, logo, name, caption,
  star rating, website, country/state, email, WhatsApp
- `features/account/schemas/hotel-profile.schema.ts` — Zod, incl. bare-domain website
  normalisation and 1–5 star range
- `features/account/hooks/useHotelProfile.ts` — `useIsHotel()` (server truth, not the
  persisted store) and `useUpdateHotelProfile()`
- `features/account/services/profile.service.ts` — `updateHotelProfile()` + hotel fields on
  `ProfileData`; only supplied keys are sent so optional fields stay untouched
- `routes/profile/hotel.tsx` — guarded route; `isLoading` handled separately from `!isHotel`
- `components/ProfilePage.tsx` — entry point, shown only for `isMe && isHotel`
- `shared/utils/media-compression.ts` — `COVER_OPTIONS` (1600px / 700 KB)
**Verified:** build ✅, `tsc` ✅, form hydrates from a stubbed hotel profile ✅, validation
blocks bad input and accepts a bare domain ✅, ar/RTL ✅ (website input forced LTR so URLs
don't reverse), Arabic star grammar fixed to نجمة واحدة / نجمتان / N نجوم ✅.
**Not verified:** real backend round-trip, device build.

**Original assessment below.**
**Status (before):** `PARTIAL`
**Evidence:**
- `features/account/hooks/useProfile.ts`, `features/account/services/profile.service.ts`
- `updateSocials()` already posts `socials[slug]=link` — **exactly** the shape §6.2 expects
- `shared/services/social-platforms.service.ts` — platform list already wired
**Gaps:** `cover_image`, `website`, `star_rating` are hotel-only fields not present in the
profile form or types.
**Reuse:** profile service, socials editor, image upload — all of it.

### F-003 — Hotel content CRUD (UC 1.3)
**Status:** `IMPLEMENTED` (2026-08-11) — pending real-backend + device verification
**Delivered:** `HotelContentForm` (multi-image, chunked video via the existing `/upload-chunk` +
`/merge-chunks`, YouTube URLs with id validation), `routes/profile/hotel-contents.tsx` (owner list,
create/edit/delete, hidden-item badge + reason), `hotel-contents.service.ts`, `useMyHotelContents`.
The attachment-replacement caveat from §8.3 is surfaced in the UI before saving.

**Original assessment below.**
**Status (before):** `NOT_STARTED`
**Evidence:** no `hotel-contents` usage anywhere.
**Reuse:** `features/post-ad/hooks/useChunkedVideoUpload.ts` + `/upload-chunk` + `/merge-chunks`
are the **same** mechanism §9 specifies. `shared/utils/video-compression.ts` applies unchanged.
**New:** YouTube URL input + validation; multi-image picker; attachment replacement semantics.

### F-004 — Hotel list + profile view (UC 1.4)
**Status:** `IMPLEMENTED` (2026-08-11) — pending real-backend + device verification
**Delivered:** `routes/hotels/index.tsx` (search + country/state/stars/rating filters in the URL,
pagination, loading/error/empty states), `routes/hotels/$id/index.tsx` (cover, logo, stars, rating
summary, contact actions, socials, Contents/Ratings tabs),
`routes/hotels/$id/contents/$contentId.tsx`, plus `HotelCard`, `StarRating`, `MediaGallery`.
Optional fields are omitted rather than rendered empty.

**Original assessment below.**
**Status (before):** `NOT_STARTED`
**Evidence:** `features/` has no `hotels`; grep for "hotel" returns 1 incidental file.
**Reuse:** `features/companies/` is the closest analog for list+filter+detail structure.

### F-005 — Sharing (UC 1.5)
**Status:** `IMPLEMENTED` (2026-08-11) — pending deployed-domain + device verification
**Delivered:** share buttons on the hotel profile and content detail, wired to the backend's
`share_url` (not reconstructed locally). Reuses the existing `shared/utils/share.ts`, which already
falls back native sheet → Web Share API → clipboard, so no new Capacitor dependency was needed.
Backend commit `24c05b9` resolved B-02 by making hotel reads public and building `share_url` from
`PUBLIC_WEB_URL`. The frontend skips its protected `/profile` query for signed-out hotel visitors
and registers `road-80.com` for Android App Links and iOS Universal Links.

**Original assessment below.**
**Status (before):** `NOT_STARTED` — ⚠️ **BLOCKED**, see §2.
**Evidence:** `share_url` is server-provided; no share affordance exists in the app.

### F-006 — Chat / conversations (UC 1.6)
**Status:** `IMPLEMENTED` (2026-08-11) — pending real-backend + device verification
**Delivered:** `chat.service.ts`, `useChat` (30s/15s polling stands in for realtime — there is no
socket), `routes/conversations/index.tsx`, `routes/conversations/$id.tsx` (day separators, own/other
bubble alignment, Enter-to-send). Starting a chat is idempotent per §10.1. Sends are **not** retried
(non-idempotent), the composer restores the text on failure, and `navigator.onLine === false` is
used only as a negative check.

**Original assessment below.**
**Status (before):** `NOT_STARTED`
**Evidence:** grep for `conversation` → **0 files**. This is the largest net-new surface.
**New:** conversation list, chat screen, message send, unread state, `new_message` push handling.

### F-007 — Hotel ratings (UC 5.2)
**Status:** `IMPLEMENTED` (2026-08-11) — B-03 assumption below
**Delivered:** `RatingSheet` (accessible star radiogroup, 1000-char comment), ratings tab on the
hotel profile, `useRateHotel` invalidating both the hotel record and the list so `rate` /
`ratings_count` refresh. Re-submitting updates the existing rating rather than creating a second.
**Assumption (B-03 unresolved):** any authenticated non-hotel account may rate any hotel it does not
own. If eligibility should be narrower, that is a one-line change in `canRate`.

**Original assessment below.**
**Status (before):** `NOT_STARTED`
**Evidence:** grep for `rating` → 1 incidental file.

### F-008 — Free access, no payments (UC 4.1)
**Status:** `IMPLEMENTED` — it is a **constraint**, not a separate screen
F-002…F-007 are now implemented and were checked for payment gating. Hotel profile, content,
ratings, chat, WhatsApp, call, website, socials and sharing contain no payment or subscription gate.
**Note:** `payments/*` endpoints exist for ads. Keep them out of every hotel surface.

---

## 2. 🔴 Blockers — decisions required before building

### B-01 — `AUTH_PATHS` prefix bug breaks hotel login/registration
`lib/api-client.ts` exempts `/v1/auth/login`, `/v1/auth/register`, `/v1/auth/verify-otp` from
force-logout, but **every real call omits `/v1`** (`/auth/login`, `/auth/verify-otp`). So
`isAuthPath()` is `false` for all three and the exemption never applies.

**Impact on this feature:** a `pending` hotel logging in receives `hotel_pending_approval`, and a
wrong OTP returns `status: "needLogin"` — both now trigger `forceLogout` and eject the user
instead of showing the waiting/error message UC 1.1 requires.

**Fix:** drop the `/v1` prefix from those three entries. Small, and required before F-001.

### B-02 — Shared hotel links require auth, contradicting UC 1.5 — RESOLVED
Backend commit `24c05b9` moved the five read-only hotel endpoints outside `auth:user` and added
`PUBLIC_WEB_URL` for canonical share links. Rating, chat, content management and conversations
remain authenticated. The client treats `/hotels/*` as public and does not issue protected profile
requests for signed-out visitors.

### B-03 — Rating eligibility undefined
UC 5.2 says *«المستخدم المؤهل للتقييم»* (the *eligible* user) but never defines eligibility. The
API only excludes `hotel` accounts and self-rating.

**Decision required:** can any authenticated `user` rate any hotel, or is prior interaction
(a conversation, a visit) required? Building the permissive version is easy to ship and hard to
walk back.

### B-04 — Hotel self-declares its own `star_rating`
§6.2 lets a hotel set `star_rating` (1–5) on its own profile, and 5.1 makes it a filter facet.
Self-declared stars driving a public filter is a trust problem.

**Decision required:** confirm this is intentional, or should stars be admin-set only?

---

## 3. Dependency order

```
B-01 fix (AUTH_PATHS)
   │
   ▼
F-001 account type ──► F-002 hotel profile ──► F-003 content CRUD
                                │
                                ▼
                          F-004 list + profile view ──► F-007 ratings
                                │                  └──► F-005 sharing (needs B-02)
                                ▼
                          F-006 chat
```

**Phase 1** — B-01 fix, F-001 (registration + pending screen)
**Phase 2** — F-002 (hotel profile edit)
**Phase 3** — F-004 (public list + profile view) — unlocks everything user-facing
**Phase 4** — F-003 (content CRUD, reuses chunked upload)
**Phase 5** — F-007 ratings, F-005 sharing
**Phase 6** — F-006 chat (largest, fully independent)

F-004 before F-003 deliberately: there is no point authoring content before there is a screen
that renders it.

---

## 4. Flutter → React/Capacitor mapping

The API doc's UI notes assume Flutter. Equivalents in this app:

| Doc says | Here |
|---|---|
| `Share.share()` / `share_plus` | `@capacitor/share` — **not currently a dependency**; web fallback via `navigator.share` → clipboard. See `platform-boundaries`. |
| `youtube_player` / WebView | `<iframe>` embed on web; verify it renders inside the native webview |
| Video player | native `<video>`; native file paths need `Capacitor.convertFileSrc()` |
| Deep link `/hotels/{id}` | `appUrlOpen` handler in `routes/__root.tsx` already normalizes — new routes must be added there and registered natively |
| Image slider | existing pattern in `features/home` (`touch-pan-y`, transform-based carousel) |

---

## 5. Contract notes (verified against the running app)

- Base URL matches: `lib/api-base-url.ts` → `https://portal.road-80.com/api` ✅
- Endpoints carry **no `/v1` prefix** — the doc is correct, `AUTH_PATHS` is wrong
- `socials` FormData shape already matches (`socials[instagram]=url`) ✅
- `/upload-chunk` + `/merge-chunks` already implemented for ads ✅
- Response envelope matches the `laravel-api-contract` skill exactly, including
  `status: "needLogin"` and the `pagination` sibling key ✅
- New error keys to handle: `hotel_pending_approval`, `hotel_rejected`, `hotel_only_action`,
  `hotel_not_available`, `hotel_cannot_start_chat`, `cannot_rate_own_hotel`
- New notification types: `hotel_content_hidden` (`reason`, `content_id`), `new_message`
  (`conversation_id`, `subject`)

---

## 6. Open business questions (do not invent answers)

1. B-03 — what makes a user "eligible" to rate?
2. B-04 — should hotels set their own star rating?
3. UC 1.3 — "technical limits only" on video: what are the actual max size/formats?
4. UC 1.4 — a hidden/suspended hotel returns 404. What should the app show — a generic
   not-found, or a specific "no longer available"?
5. Does the hotel account get the ads/post-ad experience too, or hotel surfaces only?
