const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov'];

/**
 * Largest video we'll accept. Chunked upload means there's no server-side body
 * limit to hit, but a 500 MB phone recording is a 20-minute upload on mobile
 * data — better to say so up front than to fail late.
 */
export const MAX_VIDEO_BYTES = 150 * 1024 * 1024;

/**
 * Largest image we'll accept *before* compression. Anything under this is
 * downscaled by shared/utils/media-compression to well within the backend's
 * 6 MB `max:6144` rule, so this only guards against inputs too big to decode.
 */
export const MAX_IMAGE_BYTES = 40 * 1024 * 1024;

const getExtension = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext ? `.${ext}` : '';
};

// The matching error copy lives in the postAd i18n namespace
// (postAd.images.typeError / postAd.video.typeError) and is resolved at the
// call site, so it follows the active language.

export function isAllowedAdImage(file: File): boolean {
  const ext = getExtension(file.name);
  return (
    ALLOWED_IMAGE_MIME_TYPES.includes(file.type) ||
    ALLOWED_IMAGE_EXTENSIONS.includes(ext)
  );
}

export function isAllowedAdVideo(file: File): boolean {
  const ext = getExtension(file.name);
  return (
    ALLOWED_VIDEO_MIME_TYPES.includes(file.type) ||
    ALLOWED_VIDEO_EXTENSIONS.includes(ext)
  );
}

export function isWithinVideoSizeLimit(file: File): boolean {
  return file.size <= MAX_VIDEO_BYTES;
}

export function isWithinImageSizeLimit(file: File): boolean {
  return file.size <= MAX_IMAGE_BYTES;
}
