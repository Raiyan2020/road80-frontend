/**
 * Client-side image optimisation.
 *
 * Phone cameras hand us 12 MP JPEGs and screenshots come through as PNGs, both
 * routinely 8–20 MB. The backend rejects anything over 6 MB
 * (StoreAdRequest: `attachments.*.file` => `max:6144`), so before this module
 * existed a user could fill in the whole wizard and only discover the problem
 * at the final publish call.
 *
 * We decode, downscale to a sane display size and re-encode — WebP where the
 * browser supports it, JPEG otherwise. Both are accepted by the backend rule.
 * No dependencies: `createImageBitmap` + `canvas.toBlob` are enough, and they
 * keep the ~1 MB a library like browser-image-compression would add out of the
 * bundle of an app that ships over Capacitor.
 */

/** Longest edge of the re-encoded image, in px. Ads render at most ~800px wide. */
const MAX_DIMENSION = 1920;

/** Starting encoder quality. 0.82 is the usual "no visible loss on photos" mark. */
const INITIAL_QUALITY = 0.82;

/** Never drop below this — past it, compression artefacts become obvious. */
const MIN_QUALITY = 0.5;

/**
 * Target output size. Deliberately well under the backend's 6 MB so a
 * multi-image ad doesn't trip PHP's `post_max_size` on the aggregate body.
 */
const TARGET_BYTES = 1.5 * 1024 * 1024;

/** Refuse to even decode beyond this — a 100 MB input would OOM the webview. */
export const MAX_INPUT_IMAGE_BYTES = 40 * 1024 * 1024;

export interface CompressOptions {
  /** Longest edge of the output, in px. Defaults to MAX_DIMENSION. */
  maxDimension?: number;
  /** Size to compress toward, in bytes. Defaults to TARGET_BYTES. */
  targetBytes?: number;
}

/**
 * Avatars and company logos render at ≤ 128px and the backend caps them at
 * 2 MB (`max:2048`), so they get a far tighter budget than ad photos.
 */
export const AVATAR_OPTIONS: CompressOptions = {
  maxDimension: 512,
  targetBytes: 300 * 1024,
};

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  /** False when the original was already smaller than anything we could produce. */
  didCompress: boolean;
}

/** Human-readable size — used in user-facing progress and result copy. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

let webpSupport: boolean | null = null;

/**
 * `toBlob` silently falls back to PNG when a type is unsupported, so we detect
 * by encoding a 1×1 canvas and reading back the type it actually produced.
 */
function supportsWebP(): boolean {
  if (webpSupport !== null) return webpSupport;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    webpSupport = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    webpSupport = false;
  }
  return webpSupport;
}

/**
 * `createImageBitmap` decodes off the main thread and, with
 * `imageOrientation: 'from-image'`, bakes in EXIF rotation so portrait phone
 * shots don't come out sideways once the EXIF header is dropped by re-encoding.
 * Safari < 15 lacks the options bag, hence the `<img>` fallback.
 */
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // fall through
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('decode-failed'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function renameTo(originalName: string, extension: string): string {
  const base = originalName.replace(/\.[^.]+$/, '') || 'photo';
  return `${base}.${extension}`;
}

/**
 * Downscale + re-encode a single image.
 *
 * Always resolves: if anything goes wrong (corrupt file, canvas blocked,
 * out of memory) we hand back the original rather than blocking the upload.
 * The backend still validates, so a pass-through is safe — just not optimised.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<CompressionResult> {
  const maxDimension = options.maxDimension ?? MAX_DIMENSION;
  const targetBytes = options.targetBytes ?? TARGET_BYTES;
  const originalSize = file.size;
  const passthrough: CompressionResult = {
    file,
    originalSize,
    compressedSize: originalSize,
    didCompress: false,
  };

  if (originalSize > MAX_INPUT_IMAGE_BYTES) return passthrough;

  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await decode(file);
  } catch {
    return passthrough;
  }

  try {
    const srcWidth = source.width;
    const srcHeight = source.height;
    if (!srcWidth || !srcHeight) return passthrough;

    // Only ever scale down — upscaling a small image would inflate it.
    const scale = Math.min(1, maxDimension / Math.max(srcWidth, srcHeight));
    const width = Math.round(srcWidth * scale);
    const height = Math.round(srcHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return passthrough;

    // Photos only — no transparency to preserve, and a white matte avoids
    // transparent PNG regions turning black once flattened into JPEG.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, width, height);

    const useWebP = supportsWebP();
    const mimeType = useWebP ? 'image/webp' : 'image/jpeg';
    const extension = useWebP ? 'webp' : 'jpg';

    // Step the quality down until we're under target. Three attempts is enough
    // to get any realistic camera image well under 1.5 MB.
    let blob: Blob | null = null;
    let quality = INITIAL_QUALITY;
    for (let attempt = 0; attempt < 3; attempt++) {
      blob = await toBlob(canvas, mimeType, quality);
      if (!blob || blob.size <= targetBytes) break;
      quality = Math.max(MIN_QUALITY, quality - 0.15);
      if (quality === MIN_QUALITY && attempt > 0) break;
    }

    // An already-optimised small JPEG can come back larger than it went in.
    if (!blob || blob.size >= originalSize) return passthrough;

    return {
      file: new File([blob], renameTo(file.name, extension), {
        type: mimeType,
        lastModified: Date.now(),
      }),
      originalSize,
      compressedSize: blob.size,
      didCompress: true,
    };
  } catch {
    return passthrough;
  } finally {
    if ('close' in source && typeof source.close === 'function') source.close();
  }
}

export interface BatchProgress {
  /** Images finished so far. */
  done: number;
  total: number;
}

/**
 * Compress a batch, reporting progress as each one lands.
 *
 * Sequential on purpose: each decode holds a full-resolution bitmap plus a
 * canvas in memory, and running several at once is what actually OOMs the
 * webview on older Android devices.
 */
export async function compressImages(
  files: File[],
  onProgress?: (progress: BatchProgress) => void,
  options?: CompressOptions,
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];
  onProgress?.({ done: 0, total: files.length });

  for (const file of files) {
    results.push(await compressImage(file, options));
    onProgress?.({ done: results.length, total: files.length });
  }

  return results;
}
