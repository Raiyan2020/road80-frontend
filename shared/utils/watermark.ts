import { WATERMARK_LOGO_URL } from '../constants/images';

// Logo width as a fraction of the image width, so the mark scales with the photo.
const LOGO_WIDTH_RATIO = 0.18;
// Inset from the top/right edges, relative to the image's shorter side.
const MARGIN_RATIO = 0.03;
const OPACITY = 0.3;
const JPEG_QUALITY = 0.9;
// Camera originals are uploaded raw today; cap them so the canvas pass doesn't
// blow past WKWebView's memory ceiling on older phones.
const MAX_EDGE = 2400;

let logoPromise: Promise<HTMLImageElement> | null = null;

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

// Decode the logo once and share it across every selection.
const getLogo = () => {
  if (!logoPromise) {
    logoPromise = loadImage(WATERMARK_LOGO_URL).catch((err) => {
      logoPromise = null; // let the next selection retry
      throw err;
    });
  }
  return logoPromise;
};

const renameForType = (fileName: string, isPng: boolean) => {
  const base = fileName.replace(/\.[^./\\]+$/, '') || 'image';
  return `${base}.${isPng ? 'png' : 'jpg'}`;
};

/**
 * Draws the app logo into the top-right corner of `file` at 50% opacity and
 * returns a new File ready for upload.
 *
 * Orientation note: `naturalWidth`/`naturalHeight` on an HTMLImageElement
 * already account for EXIF orientation (CSS `image-orientation: from-image` is
 * the default), and `drawImage` honours it — so portrait phone photos stay
 * upright. Do not swap this for a raw ImageBitmap decode without passing
 * `{ imageOrientation: 'from-image' }`.
 */
export async function watermarkImage(file: File): Promise<File> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const [source, logo] = await Promise.all([loadImage(objectUrl), getLogo()]);

    const scale = Math.min(
      1,
      MAX_EDGE / Math.max(source.naturalWidth, source.naturalHeight)
    );
    const width = Math.max(1, Math.round(source.naturalWidth * scale));
    const height = Math.max(1, Math.round(source.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    ctx.drawImage(source, 0, 0, width, height);

    const logoWidth = Math.round(width * LOGO_WIDTH_RATIO);
    const logoHeight = Math.round(
      logoWidth * (logo.naturalHeight / logo.naturalWidth)
    );
    const margin = Math.round(Math.min(width, height) * MARGIN_RATIO);

    ctx.globalAlpha = OPACITY;
    ctx.drawImage(
      logo,
      width - logoWidth - margin,
      margin,
      logoWidth,
      logoHeight
    );
    ctx.globalAlpha = 1;

    const isPng =
      file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
    const mime = isPng ? 'image/png' : 'image/jpeg';

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mime, isPng ? undefined : JPEG_QUALITY)
    );
    if (!blob) throw new Error('canvas.toBlob returned null');

    return new File([blob], renameForType(file.name, isPng), {
      type: mime,
      lastModified: file.lastModified,
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Watermarks files one at a time (not in parallel — several full-size canvases
 * at once is what OOM-crashes the WebView). A file that fails to process falls
 * back to the original so the user never silently loses a photo.
 */
export async function watermarkImages(
  files: File[]
): Promise<{ files: File[]; failed: number }> {
  const results: File[] = [];
  let failed = 0;
  for (const file of files) {
    try {
      results.push(await watermarkImage(file));
    } catch (err) {
      failed += 1;
      console.error('[watermark] failed, using original:', file.name, err);
      results.push(file);
    }
  }
  return { files: results, failed };
}
