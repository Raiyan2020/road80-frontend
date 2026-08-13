# Hotel Brief Gap Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the already-implemented hotel feature into compliance with the 2026-08-12 `FRONTEND-HOTEL-IMPLEMENTATION-BRIEF.md`: stop sending `star_rating` from the hotel profile form, and add image attachment support to chat messages.

**Architecture:** Two independent, surgical patches to existing code — no new files, no new dependencies, no backend/Pusher changes. Task 1 touches the hotel profile edit form + its schema/service/i18n. Task 2 touches the chat service/hook/i18n and the conversation screen's composer + message bubbles.

**Tech Stack:** React 19, TanStack Router/Query, Zod, `ofetch` (via `lib/api-client.ts`), Tailwind. No test runner exists in this repo (`CLAUDE.md`: "no test, lint, or typecheck script" beyond `npx tsc --noEmit`).

## Global Constraints

- Never send `star_rating` in `POST /profile` — it is admin-only (brief D3). Display it read-only.
- Chat `POST /conversations/{id}/messages` is `multipart/form-data`: `body` optional text, `images[]` 1–10 files, 8MB max each, at least one of `body`/`images[]` required.
- Do not rename existing response keys (`share_url`, `attachments`, `images`, `min_stars`, `account_type`, etc.) — brief §10.
- No automated test suite. Verification per task is: `npx tsc --noEmit` (must show zero new errors), `npm run build` (must succeed), and a manual check described in the task.
- Follow existing code conventions in the touched files (i18n via `useTranslation()`/`t()`, Tailwind class patterns already present, `sonner` toasts, FormData `field[]` array syntax for Laravel).
- Bilingual: every new/changed user-facing string needs both `i18n/locales/en/*.ts` and `i18n/locales/ar/*.ts` entries.

---

### Task 1: Hotel profile — make `star_rating` read-only, stop sending it

**Files:**
- Modify: `features/account/components/HotelProfileForm.tsx`
- Modify: `features/account/schemas/hotel-profile.schema.ts`
- Modify: `features/account/services/profile.service.ts`
- Modify: `features/hotels/types.ts:39` (stale comment only)
- Modify: `i18n/locales/en/profile.ts`
- Modify: `i18n/locales/ar/profile.ts`

**Interfaces:**
- Consumes: `useProfile()` → `profile.star_rating: number | null | undefined` (unchanged, already exists in `ProfileData`).
- Produces: `HotelProfileInput` (in `profile.service.ts`) no longer has a `star_rating` key. `hotelProfileSchema` no longer validates `star_rating`. Task 2 does not depend on this.

- [ ] **Step 1: Remove `star_rating` from the Zod schema**

In `features/account/schemas/hotel-profile.schema.ts`, delete this block (currently lines 75–86):

```ts
  // Hotel-only. 1–5, or empty for "not declared".
  star_rating: z
    .union([z.string(), z.number()])
    .refine(
      (v) => {
        if (v === '' || v === undefined || v === null) return true;
        const n = Number(v);
        return Number.isInteger(n) && n >= 1 && n <= 5;
      },
      { error: () => t('profile.hotel.validation.starRatingRange') },
    )
    .optional(),
```

Leave the rest of the schema (`name`, `caption`, `email`, `country_id`, `state_id`, `whatsapp_phone`, `website`) untouched. The trailing comma on the `website` field's closing `.optional().or(z.literal(''))` block right before it stays as-is since it's a separate field.

- [ ] **Step 2: Remove `star_rating` from `HotelProfileInput`**

In `features/account/services/profile.service.ts`, in the `HotelProfileInput` interface (around line 51), delete:

```ts
  star_rating?: number | string;
```

Update the interface's doc comment (lines 44–50) to:

```ts
/**
 * Fields a hotel may edit on its own profile.
 *
 * `cover_image` and `website` are rejected by the backend for `user` and
 * `company` accounts — see the frontend hotel brief §6.2. `star_rating` is
 * admin-only and must never be sent from the app (frozen rule D3); `rate`
 * and `ratings_count` are computed and are never sent either.
 */
```

- [ ] **Step 3: Fix the stale comment on the read model**

In the same file, `ProfileData` interface (around line 34–35), change:

```ts
  /** Self-declared hotel classification, 1-5. Hotel accounts only. */
  star_rating?: number | null;
```

to:

```ts
  /** Admin-set hotel classification, 1-5. Read-only from the app. Hotel accounts only. */
  star_rating?: number | null;
```

- [ ] **Step 4: Same comment fix in the public `Hotel` type**

In `features/hotels/types.ts:38`, change:

```ts
  /** Self-declared hotel classification, 1-5. */
  star_rating: number | null;
```

to:

```ts
  /** Admin-set hotel classification, 1-5. Read-only. */
  star_rating: number | null;
```

- [ ] **Step 5: Update i18n — English**

In `i18n/locales/en/profile.ts`, inside the `hotel` block, replace:

```ts
    starRatingLabel: 'Star rating',
    starRatingPlaceholder: 'Not specified',
    starRatingHint: 'Optional — your hotel classification, 1 to 5 stars',
    starsOne: '1 star',
    starsTwo: '2 stars',
    starsMany: '{count} stars',
```

with:

```ts
    starRatingLabel: 'Star rating',
    starRatingNotSet: 'Not yet rated by the platform',
    starRatingHint: 'Set by the platform administrators',
    starsOne: '1 star',
    starsTwo: '2 stars',
    starsMany: '{count} stars',
```

Then in the same file's `validation` block under `hotel`, remove the now-unused key:

```ts
    validation: {
      websiteInvalid: 'Enter a valid website address',
      starRatingRange: 'Star rating must be between 1 and 5',
    },
```

becomes:

```ts
    validation: {
      websiteInvalid: 'Enter a valid website address',
    },
```

- [ ] **Step 6: Update i18n — Arabic**

In `i18n/locales/ar/profile.ts`, inside the `hotel` block, replace:

```ts
    starRatingLabel: 'تصنيف النجوم',
    starRatingPlaceholder: 'غير محدد',
    starRatingHint: 'اختياري — تصنيف الفندق من 1 إلى 5 نجوم',
    // Arabic marks singular / dual / plural separately — a single
    // '{count} نجوم' template renders "1 نجوم", which is wrong.
    starsOne: 'نجمة واحدة',
    starsTwo: 'نجمتان',
    starsMany: '{count} نجوم',
```

with:

```ts
    starRatingLabel: 'تصنيف النجوم',
    starRatingNotSet: 'لم يتم تصنيفه من الإدارة بعد',
    starRatingHint: 'يتم تحديده من قبل إدارة المنصة',
    // Arabic marks singular / dual / plural separately — a single
    // '{count} نجوم' template renders "1 نجوم", which is wrong.
    starsOne: 'نجمة واحدة',
    starsTwo: 'نجمتان',
    starsMany: '{count} نجوم',
```

Then remove the matching validation line:

```ts
    validation: {
      websiteInvalid: 'أدخل عنوان موقع إلكتروني صحيح',
      starRatingRange: 'تصنيف النجوم يجب أن يكون بين 1 و 5',
    },
```

becomes:

```ts
    validation: {
      websiteInvalid: 'أدخل عنوان موقع إلكتروني صحيح',
    },
```

- [ ] **Step 7: Rewrite `HotelProfileForm.tsx`**

In `features/account/components/HotelProfileForm.tsx`:

1. Delete the `STAR_CHOICES` constant (line 31):
```ts
const STAR_CHOICES = [1, 2, 3, 4, 5] as const;
```

2. In the `FieldName` union type (lines 19–27), delete the `| "star_rating"` line.

3. In the `form` state initializer (lines 55–64), delete:
```ts
    star_rating: "" as string | number,
```

4. In the hydration `useEffect` (lines 68–83), delete:
```ts
      star_rating: profile.star_rating ?? "",
```

5. In `handleSubmit`'s `updateHotelProfile(...)` call (lines 161–174), delete:
```ts
        star_rating: form.star_rating,
```

6. Replace the entire "Star rating — hotel only" block (currently lines 309–338, the `<select id="hotel-stars">` section) with a read-only display:

```tsx
      {/* Star rating — admin-set (frozen rule D3), read-only in the app */}
      <div className="flex flex-col gap-2">
        <label className="px-1 text-sm font-bold text-navy dark:text-slate-200">
          {tr("profile.hotel.starRatingLabel")}
        </label>
        <div className={`${inputClass} flex items-center`}>
          <span>
            {profile?.star_rating === 1
              ? tr("profile.hotel.starsOne")
              : profile?.star_rating === 2
                ? tr("profile.hotel.starsTwo")
                : profile?.star_rating
                  ? tr("profile.hotel.starsMany", { count: profile.star_rating })
                  : tr("profile.hotel.starRatingNotSet")}
          </span>
        </div>
        <p className="px-1 text-[11px] font-medium text-gray-400 dark:text-slate-500">
          {tr("profile.hotel.starRatingHint")}
        </p>
      </div>
```

Note `inputClass` already includes `font-bold text-navy dark:text-slate-200` styling — the `<span>` needs no extra color classes.

- [ ] **Step 8: Typecheck and build**

Run: `npx tsc --noEmit`
Expected: no errors referencing `star_rating`, `STAR_CHOICES`, or `starRatingPlaceholder`/`starRatingRange`.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 9: Manual verification**

Run: `npm run dev`, sign in as a hotel account (or stub `useProfile` if no hotel account is available), open the hotel profile edit screen (`/profile/hotel`).
Expected: the star rating section shows a read-only value (or "not yet rated" text) with no dropdown. Open browser devtools → Network tab, edit and save the form, inspect the `POST /profile` request payload — confirm `star_rating` is absent from the form data. Check both `ar` and `en` language toggles render the read-only label correctly.

- [ ] **Step 10: Commit**

```bash
git add features/account/components/HotelProfileForm.tsx features/account/schemas/hotel-profile.schema.ts features/account/services/profile.service.ts features/hotels/types.ts i18n/locales/en/profile.ts i18n/locales/ar/profile.ts
git commit -m "fix(hotel): stop sending star_rating from profile form (frozen rule D3)"
```

---

### Task 2: Chat — support image attachments in messages

**Files:**
- Modify: `features/chat/services/chat.service.ts`
- Modify: `features/chat/hooks/useChat.ts`
- Modify: `routes/conversations/$id.tsx`
- Modify: `i18n/locales/en/hotels.ts`
- Modify: `i18n/locales/ar/hotels.ts`

**Interfaces:**
- Consumes: `compressImage` and `isWithinImageSizeLimit` from `shared/utils/media-validation.ts` / `shared/utils/media-compression.ts` (same functions `HotelContentForm.tsx` already uses); `tr("validation.imageTooLarge")` (existing shared key).
- Produces: `chatService.send(conversationId, input: { body?: string; images?: File[] })` replaces the old `send(conversationId, body: string)` signature. `Message` gains `images: string[]` and `conversation_id: number`. `Conversation` gains optional `hotel_id`/`user_id`. `useSendMessage()`'s mutate function now takes `{ body?: string; images?: File[] }` instead of a bare string.

- [ ] **Step 1: Update `chat.service.ts` types and `send()`**

In `features/chat/services/chat.service.ts`, replace the `Message` interface (lines 13–19):

```ts
/** frontend hotel brief §6.7 */
export interface Message {
  id: number;
  conversation_id: number;
  body: string;
  /** Attachment URLs. Empty array when the message is text-only. */
  images: string[];
  read_at: string | null;
  sender: ChatParticipant;
  created_at: string | null;
}
```

Replace the `Conversation` interface (lines 22–28):

```ts
/** frontend hotel brief §6.7 */
export interface Conversation {
  id: number;
  hotel_id?: number;
  user_id?: number;
  /** The *other* party: the hotel for a user, the user for a hotel. */
  participant: ChatParticipant;
  latest_message: Message | null;
  updated_at: string | null;
}
```

Replace the `send` method (lines 64–68):

```ts
  /**
   * Send a message: text only, images only, or both — at least one is
   * required (`message_content_required` if neither is present).
   * `multipart/form-data` per §6.7; `images[]` is 1–10 files, 8MB max each.
   * Triggers a `new_message` push to the other party.
   */
  send: (
    conversationId: number | string,
    input: { body?: string; images?: File[] },
  ) => {
    const formData = new FormData();
    if (input.body) formData.append('body', input.body);
    input.images?.forEach((file) => formData.append('images[]', file));
    return api.post<ApiEnvelope<Message>>(
      `/conversations/${conversationId}/messages`,
      formData,
    );
  },
```

- [ ] **Step 2: Update `useSendMessage` in `useChat.ts`**

In `features/chat/hooks/useChat.ts`, replace the `useSendMessage` function (lines 33–51):

```ts
export function useSendMessage(conversationId: number | string | undefined) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: { body?: string; images?: File[] }) =>
      chatService.send(conversationId!, input),
    // Not retried: sending is NOT idempotent, and a retry after a timeout that
    // actually succeeded would post the message twice. See `offline-connectivity`.
    retry: false,
    meta: { hideToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['conversation', String(conversationId), 'messages'],
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return { sendMessage: mutation.mutateAsync, isSending: mutation.isPending };
}
```

- [ ] **Step 3: Add i18n keys — English**

In `i18n/locales/en/hotels.ts`, inside the `chat` block, after `messagePlaceholder: 'Write a message...',` add:

```ts
    attachImage: 'Attach image',
    removeImage: 'Remove image',
    imagesTooMany: 'You can attach up to 10 images',
    messageOrImageRequired: 'Write a message or attach at least one image',
```

- [ ] **Step 4: Add i18n keys — Arabic**

In `i18n/locales/ar/hotels.ts`, inside the `chat` block, after `messagePlaceholder: 'اكتب رسالتك...',` add:

```ts
    attachImage: 'إرفاق صورة',
    removeImage: 'إزالة الصورة',
    imagesTooMany: 'يمكنك إرفاق حتى 10 صور',
    messageOrImageRequired: 'اكتب رسالة أو أرفق صورة واحدة على الأقل',
```

- [ ] **Step 5: Add image picking + preview state to `routes/conversations/$id.tsx`**

Add imports at the top (after the existing imports, before the `Route` export):

```tsx
import { compressImage } from "@/shared/utils/media-compression";
import { isWithinImageSizeLimit } from "@/shared/utils/media-validation";
```

Add a module-level constant near the top of the file, after the imports:

```tsx
/** Server rule: images.* => max:8192 (kilobytes), 1-10 files. */
const MAX_SERVER_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES = 10;
```

Inside `ChatPage()`, after the existing `const [draft, setDraft] = useState("");` line, add:

```tsx
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
```

- [ ] **Step 6: Add the `addImages` handler**

Right after the `handleSend` function's closing brace in `routes/conversations/$id.tsx`, add:

```tsx
  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(tr("hotels.chat.imagesTooMany"));
      return;
    }
    setIsOptimizing(true);
    try {
      const accepted: { file: File; preview: string }[] = [];
      for (const file of Array.from(files)) {
        if (!isWithinImageSizeLimit(file)) {
          toast.error(tr("validation.imageTooLarge"));
          continue;
        }
        const { file: compressed } = await compressImage(file);
        if (compressed.size > MAX_SERVER_IMAGE_BYTES) {
          toast.error(tr("validation.imageTooLarge"));
          continue;
        }
        accepted.push({ file: compressed, preview: URL.createObjectURL(compressed) });
      }
      setImages((prev) => [...prev, ...accepted]);
    } catch (err) {
      console.error("[chat] image processing failed", err);
      toast.error(tr("hotels.chat.sendError"));
    } finally {
      setIsOptimizing(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };
```

- [ ] **Step 7: Rewrite `handleSend` to send body and/or images**

Replace the existing `handleSend` function:

```tsx
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if ((!body && images.length === 0) || isSending) return;

    // `navigator.onLine === false` is a reliable negative; `true` proves nothing
    // (see the `offline-connectivity` skill), so we still handle the failure.
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      toast.error(tr("hotels.chat.offline"));
      return;
    }

    // Clear optimistically so typing feels immediate, but keep the text/images so
    // they can be restored — losing a typed message on a flaky link is unacceptable.
    setDraft("");
    const pendingImages = images;
    setImages([]);
    try {
      await sendMessage({
        body: body || undefined,
        images: pendingImages.length ? pendingImages.map((i) => i.file) : undefined,
      });
    } catch (err) {
      setDraft(body);
      setImages(pendingImages);
      toast.error((err as any)?.data?.message ?? tr("hotels.chat.sendError"));
    }
  };
```

- [ ] **Step 8: Render image thumbnails and receive-side images**

Inside the message bubble render (the block starting `{group.items.map((m) => {`), replace the bubble's inner content:

```tsx
                  <div
                    className={`flex max-w-[75%] flex-col gap-1.5 rounded-2xl px-3.5 py-2.5 text-sm font-medium leading-relaxed ${
                      isMine
                        ? "bg-blue text-white"
                        : "bg-white text-navy dark:bg-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {m.images && m.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5">
                        {m.images.map((src, i) => (
                          <a
                            key={i}
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block h-28 w-full overflow-hidden rounded-xl"
                          >
                            <AppImage src={src} alt="" className="h-full w-full" />
                          </a>
                        ))}
                      </div>
                    )}
                    {m.body && <span>{m.body}</span>}
                  </div>
```

(This replaces the previous single-line `<div className="max-w-[75%] rounded-2xl px-3.5 py-2.5 ...">{m.body}</div>`.)

Right before the closing `</div>` of the "Transcript" section's `groups.map(...)` block ends (i.e., just before `<div ref={bottomRef} />`), no change needed — thumbnails for *pending* (not-yet-sent) images go in the composer, not the transcript. Add them in the composer form instead, per the next step.

- [ ] **Step 9: Add the attach button and pending-image preview to the composer**

Replace the `<form onSubmit={handleSend} ...>` block's contents. The new composer form:

```tsx
      <form
        onSubmit={handleSend}
        className="flex shrink-0 flex-col gap-2 border-t border-pale bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-900"
      >
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div key={img.preview} className="relative h-16 w-16 overflow-hidden rounded-xl">
                <AppImage src={img.preview} alt="" className="h-full w-full" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  aria-label={tr("hotels.chat.removeImage")}
                  className="absolute top-1 rtl:left-1 ltr:right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs font-black text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={isOptimizing || images.length >= MAX_IMAGES}
            aria-label={tr("hotels.chat.attachImage")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-pale text-lg font-bold text-navy disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
          >
            +
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addImages(e.target.files);
              e.target.value = "";
            }}
          />
          <textarea
            rows={1}
            value={draft}
            // Server rule: `body => ['required','string','min:1','max:5000']` when present.
            maxLength={5000}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends; Shift+Enter inserts a newline.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as unknown as React.FormEvent);
              }
            }}
            placeholder={tr("hotels.chat.messagePlaceholder")}
            aria-label={tr("hotels.chat.messagePlaceholder")}
            className="max-h-28 flex-1 resize-none rounded-2xl border border-pale bg-gray-50 px-4 py-3 text-sm font-medium text-navy outline-none focus:border-blue dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
          />
          <button
            type="submit"
            disabled={(!draft.trim() && images.length === 0) || isSending || isOptimizing}
            className="h-12 shrink-0 rounded-2xl bg-blue px-5 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
          >
            {isSending ? tr("hotels.chat.sending") : tr("hotels.chat.send")}
          </button>
        </div>
      </form>
```

- [ ] **Step 10: Typecheck and build**

Run: `npx tsc --noEmit`
Expected: no errors in `features/chat/*` or `routes/conversations/$id.tsx`.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 11: Manual verification**

Run: `npm run dev`, open an existing conversation (or start one from a hotel profile).
Expected:
- Tapping "+" opens the file picker; selecting images shows thumbnails above the composer with a working remove (×) button.
- Selecting more than 10 images total shows the `imagesTooMany` toast and rejects the excess.
- Sending with only images (no text) succeeds; sending with only text succeeds; sending with both succeeds.
- Send button is disabled when both the textarea is empty and no images are attached.
- After sending, thumbnails clear and the new message appears in the transcript; if it included images, they render in a 2-column grid and open full-size in a new tab on click.
- Force a network error (e.g. devtools offline) mid-send: draft text and attached images are restored, not lost.
- Toggle `ar`/`en`: attach/remove labels and toasts localize correctly, RTL layout for the remove button (×) badge is on the correct corner.

- [ ] **Step 12: Commit**

```bash
git add features/chat/services/chat.service.ts features/chat/hooks/useChat.ts routes/conversations/\$id.tsx i18n/locales/en/hotels.ts i18n/locales/ar/hotels.ts
git commit -m "feat(chat): support image attachments in messages per frontend brief §6.7"
```
