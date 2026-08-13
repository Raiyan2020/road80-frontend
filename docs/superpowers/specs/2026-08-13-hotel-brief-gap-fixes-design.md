# Hotel feature — gap fixes against 2026-08-12 frontend brief

**Date:** 2026-08-13
**Scope:** frontend only (`road-80-latest/frontend`)

## Context

The hotel feature (business use cases 1.1–5.2) was already implemented in this
repo per `docs/planning/HOTEL-FEATURE-AUDIT.md` (2026-08-11): registration,
hotel profile, content CRUD, public browsing, sharing, ratings, and chat are
all built and pass build/typecheck.

A new brief, `FRONTEND-HOTEL-IMPLEMENTATION-BRIEF.md`, was handed off on
2026-08-12 as the source of truth for the live backend contract, superseding
older docs on conflict. Comparing the current implementation against this
brief surfaced two concrete gaps. Everything else checked (hotel content
field names, chunked video upload, deep links, notification routing,
`AUTH_PATHS`, rating eligibility `canRate`) already matches the brief.

Real-time chat via Pusher was explicitly considered and **rejected** for this
pass — the brief says polling is fine, and Pusher would require backend
broadcasting support that doesn't exist in the current API contract. Chat
stays on its existing 15s/30s polling.

## Gap 1 — `star_rating` sent from hotel profile form (violates frozen rule D3)

The brief freezes: *"`star_rating` is admin-controlled. Never send
`star_rating` in `POST /profile`. Display it read-only."*

Today `HotelProfileForm.tsx` renders a `<select>` for `star_rating` and
includes it in the `updateHotelProfile()` payload.

**Change:**
- `features/account/components/HotelProfileForm.tsx` — remove the star
  `<select>` and its field-error handling; render `profile.star_rating`
  read-only (existing singular/dual/plural i18n strings), with a fallback
  string when null (not yet rated by admin).
- `features/account/schemas/hotel-profile.schema.ts` — drop `star_rating`
  from the Zod schema and the form's local `FieldName` type.
- `features/account/hooks/useHotelProfile.ts` /
  `features/account/services/profile.service.ts` — stop accepting/sending
  `star_rating` in the update payload.
- i18n — keep the label/value strings for the read-only display; remove the
  now-unused placeholder/validation-only strings.

## Gap 2 — chat messages can't carry images

The brief (§6.7) requires `POST /conversations/{id}/messages` as
`multipart/form-data`: `body` (optional text) + `images[]` (1–10 files, 8MB
max each, required if no `body`). Today `chatService.send()` only posts JSON
`{ body }` — no image path exists anywhere in the chat UI.

**Change:**
- `features/chat/services/chat.service.ts` — `send()` takes
  `{ body?: string; images?: File[] }`, builds `FormData` (same
  `images[]` append pattern as `hotel-contents.service.ts`'s `buildBody`)
  instead of a JSON body.
- `features/chat/services/chat.service.ts` types — add `images: string[]`
  and `conversation_id: number` to `Message`; add `hotel_id`, `user_id` to
  `Conversation` (present in the brief's payload; harmless if unused
  elsewhere).
- `features/chat/hooks/useChat.ts` — update the send mutation's input type
  to match.
- `routes/conversations/$id.tsx` — add an image-picker button in the
  composer (reuse existing image compression/validation utilities used by
  hotel content, e.g. `shared/utils/media-compression.ts` /
  `media-validation.ts`), show pending-image thumbnails with remove before
  send, render a received message's `images[]` (reuse `MediaGallery` or a
  simple grid for >1 image), enforce 1–10 images / 8MB each client-side, and
  require body-or-images before enabling send (mirrors backend's
  `message_content_required`).

## Out of scope

- Pusher / real-time chat (explicit user decision this pass).
- Any backend/Filament change (owned by a separate developer).
- Anything else in the brief — already implemented and verified against the
  contract during this audit.

## Testing

No test/lint/typecheck script beyond `npx tsc --noEmit` and `npm run build`
(per `CLAUDE.md`). Both must pass. Manual verification: hotel profile save
without `star_rating` in the network payload; send a chat message with only
images, only text, and both; received image messages render.
