---
name: uploads-media
description: Image and video upload in road-80 — FormData against Laravel, camera/gallery on web vs native, mediabunny video compression, chunked upload, previews, and validation. Use when adding file/image/video upload, handling attachments, working with the camera, or debugging multipart requests.
---

# Uploads & Media (road-80)

Uploads are the heaviest path in this app: a user posts an ad with photos and
video, on mobile data, from a device where the file is a native path rather than
a browser `File`.

## FormData and the Content-Type trap

`lib/api-client.ts` **deletes** the `Content-Type` header when the body is
`FormData`, so the browser can set `multipart/form-data` with the correct
boundary:

```ts
if (options.body instanceof FormData) {
  headers.delete('Content-Type');
}
```

**Never set `Content-Type: multipart/form-data` yourself.** Without the
auto-generated boundary, Laravel parses nothing and you get a confusing empty-
request validation error. This is the single most common upload bug.

Send `FormData` directly:

```ts
const fd = new FormData();
fd.append('title', title);
fd.append('images[]', file);          // Laravel array syntax
await api.post('/v1/listings', fd);
```

Laravel expects `field[]` for arrays. Existing upload services:
`features/post-ad/services/post-ad.service.ts`,
`features/account/services/profile.service.ts`,
`features/listing-detail/services/listing-detail.service.ts`.

## Method override

Laravel does not parse `multipart/form-data` on `PUT`/`PATCH`. To update with
files, POST and spoof the method:

```ts
fd.append('_method', 'PUT');
await api.post('/v1/profile', fd);
```

## Picking a file — web vs native

Handled by `shared/utils/media-permissions.ts`, which branches on
`getPlatform() === 'web'`.

- **Native**: `@capacitor/camera` returns a **native path**, not a `File`. To
  preview it you must convert: `Capacitor.convertFileSrc(path)`. To upload it you
  must read it into a blob first.
- **Web**: `<input type="file">` gives a real `File` usable directly.

Never assume a `File`. Route acquisition through the shared helper rather than
calling the Camera plugin from a component.

## Permissions

Camera and photo-library access can be **permanently denied** on iOS/Android —
unlike the browser, you cannot re-prompt. Handle denial as a terminal state with a
message pointing at OS settings. A silent no-op when the user taps "add photo" is
a bug.

## Video compression

`shared/utils/video-compression.ts` chooses per platform:

- native → the native encoder path
- web → **WebCodecs** via `mediabunny`

`mediabunny` is deliberately split into its own `video-compression` chunk in
`vite.config.ts` so the codec engine stays out of the initial bundle — it is only
needed once a web user picks a video. **Keep it dynamically imported.** A static
import at module top-level re-inflates the initial load for every user.

Compression is CPU-heavy and slow on low-end phones. Always show determinate
progress, and never block the UI thread waiting on it.

## Chunked upload

`features/post-ad/hooks/useChunkedVideoUpload.ts` uploads large video in chunks
and checks `navigator.onLine`. When touching it:

- keep chunk-level retry, not whole-file retry — re-sending a 50 MB video because
  chunk 9 failed is unacceptable on mobile data
- surface real progress; a fake spinner on a 3-minute upload reads as a hang
- make cancellation actually abort in-flight requests

## Validate before uploading

Check **client-side first** — type, size, and dimensions — so a user on mobile data
doesn't spend two minutes uploading a file the server will reject. The server
remains the authority; the client check is a courtesy, not the control.

Mirror the backend's limits. If they drift, users hit 422s after a long wait.

## Displaying stored files

Laravel returns storage URLs in `data`. They may be relative — resolve against the
API origin rather than the app origin (`lib/api-base-url.ts`). A relative path
that renders in the browser will 404 inside the native webview, where the app
origin is `capacitor://` or `https://localhost`.

## Checklist

- [ ] `Content-Type` never set manually for `FormData`
- [ ] Arrays sent as `field[]`
- [ ] `_method: 'PUT'` used for file updates
- [ ] Native paths converted with `convertFileSrc` before preview
- [ ] Permission denial handled as terminal, with a settings hint
- [ ] `mediabunny` still dynamically imported
- [ ] Determinate progress + working cancel
- [ ] Client-side type/size validation mirrors the backend
- [ ] Media URLs resolved against the API origin
