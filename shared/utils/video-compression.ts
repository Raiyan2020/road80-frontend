/**
 * Client-side video down-sizing, run before the chunked upload.
 *
 * A modern phone clip (1080p/60fps) is routinely 60–150 MB. Uploading it raw is
 * slow, burns mobile data, and fails often on flaky links. This module shrinks
 * the file first, transparently, behind a single API.
 *
 * There is no one engine that works everywhere, so `compressVideo` is a thin
 * router over interchangeable engines, each chosen at runtime by capability:
 *
 *   1. `native`      — Capacitor native builds (iOS/Android). Hardware transcode
 *                      via @whiteguru/capacitor-plugin-video-editor
 *                      (AVAssetExportSession / MediaCodec). Covers the whole
 *                      mobile app, including iOS where WebCodecs can't encode.
 *   2. `webcodecs`   — capable browsers. Hardware-accelerated MP4 conversion
 *                      through Mediabunny/WebCodecs, preserving the primary
 *                      audio track.
 *   3. `passthrough` — unsupported platforms, codecs, or ANY failure. Hands back
 *                      the original file untouched.
 *
 * Like `media-compression.ts`, this ALWAYS resolves — compression is an
 * optimisation, never a gate. The backend still validates, and the caller still
 * runs `isWithinVideoSizeLimit`, so a passthrough is always safe.
 */

import { Capacitor } from '@capacitor/core';

/**
 * Longest edge of the transcoded video, in px. 960 (≈540p) is a deliberate step
 * down from 720p: for a phone-viewed ad preview it's still clear, and dropping
 * the pixel count is what lets the low bitrate below look clean rather than
 * blocky (a low bitrate spread over 720p smears; over 540p it holds up).
 */
const DEFAULT_MAX_DIMENSION = 960;

/** Target frame rate. Phone captures are often 60fps; 30 halves the frame work. */
const DEFAULT_FPS = 30;

/**
 * Target upload bitrate. Video size ≈ bitrate × duration, so this — not the
 * resolution — is the dominant lever. 1.4 Mbps at 540p is an aggressive-but-
 * watchable setting that roughly halves even an already-lean ~2.5 Mbps clip.
 */
const DEFAULT_VIDEO_BITRATE = 1_400_000;

export type VideoCompressionEngine = 'native' | 'webcodecs' | 'passthrough';

export interface VideoCompressOptions {
  /** Longest edge of the output, in px. Defaults to 1280 (720p). */
  maxDimension?: number;
  /** Output frame rate. Defaults to 30. */
  fps?: number;
  /** Transcode progress, 0–100. Fires only for engines that report it. */
  onProgress?: (percent: number) => void;
}

export interface VideoCompressionResult {
  /** The compressed file, or the original when we passed through. */
  file: File;
  originalBytes: number;
  compressedBytes: number;
  /** False when the original was handed back unchanged. */
  didCompress: boolean;
  engine: VideoCompressionEngine;
}

/**
 * Shrink a video before upload. Never throws — on any failure the original file
 * is returned with `didCompress: false`.
 */
export async function compressVideo(
  file: File,
  options: VideoCompressOptions = {},
): Promise<VideoCompressionResult> {
  const originalBytes = file.size;
  const passthrough = (
    engine: VideoCompressionEngine = 'passthrough',
  ): VideoCompressionResult => ({
    file,
    originalBytes,
    compressedBytes: originalBytes,
    didCompress: false,
    engine,
  });

  try {
    return Capacitor.isNativePlatform()
      ? await compressNative(file, options, passthrough)
      : await compressWeb(file, options, passthrough);
  } catch {
    // Both engines are defensive, but never let an optimisation block upload.
    return passthrough(
      Capacitor.isNativePlatform() ? 'native' : 'webcodecs',
    );
  }
}

// ── Browser engine ──────────────────────────────────────────────────────────

async function compressWeb(
  file: File,
  options: VideoCompressOptions,
  passthrough: (engine?: VideoCompressionEngine) => VideoCompressionResult,
): Promise<VideoCompressionResult> {
  // WebCodecs is not universal (notably older Safari/WebViews). Keep this check
  // ahead of the dynamic import so unsupported browsers do not download the
  // conversion engine just to fall back.
  if (
    typeof window === 'undefined' ||
    typeof window.VideoDecoder === 'undefined' ||
    typeof window.VideoEncoder === 'undefined'
  ) {
    return passthrough('webcodecs');
  }

  let input: import('mediabunny').Input | null = null;
  let conversion: import('mediabunny').Conversion | null = null;

  try {
    const {
      ALL_FORMATS,
      BlobSource,
      BufferTarget,
      Conversion,
      Input,
      Mp4OutputFormat,
      Output,
    } = await import('mediabunny');

    input = new Input({
      formats: ALL_FORMATS,
      source: new BlobSource(file),
    });

    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) return passthrough('webcodecs');

    const audioTrack = await input.getPrimaryAudioTrack();
    const [sourceWidth, sourceHeight] = await Promise.all([
      videoTrack.getDisplayWidth(),
      videoTrack.getDisplayHeight(),
    ]);
    const [width, height] = fitWithin(
      sourceWidth,
      sourceHeight,
      options.maxDimension ?? DEFAULT_MAX_DIMENSION,
    );

    const target = new BufferTarget();
    const output = new Output({
      format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
      target,
    });

    conversion = await Conversion.init({
      input,
      output,
      tracks: 'primary',
      video: {
        width,
        height,
        frameRate: options.fps ?? DEFAULT_FPS,
        codec: 'avc',
        bitrate: DEFAULT_VIDEO_BITRATE,
        forceTranscode: true,
        hardwareAcceleration: 'prefer-hardware',
      },
      // Preserve the primary audio track. Mediabunny copies it directly when
      // MP4-compatible and only transcodes when required.
      audio: {},
      tags: {},
      showWarnings: false,
    });

    const lostRequiredTrack = conversion.discardedTracks.some(
      ({ track }) => track === videoTrack || track === audioTrack,
    );
    if (!conversion.isValid || lostRequiredTrack) {
      await conversion.cancel();
      return passthrough('webcodecs');
    }

    conversion.onProgress = (progress) => {
      const pct = Math.min(100, Math.max(0, Math.round(progress * 100)));
      options.onProgress?.(pct);
    };

    await conversion.execute();
    const buffer = target.buffer;
    if (!buffer?.byteLength || buffer.byteLength >= file.size) {
      return passthrough('webcodecs');
    }

    const compressedFile = new File([buffer], renameToMp4(file.name), {
      type: 'video/mp4',
      lastModified: Date.now(),
    });

    return {
      file: compressedFile,
      originalBytes: file.size,
      compressedBytes: compressedFile.size,
      didCompress: true,
      engine: 'webcodecs',
    };
  } catch {
    try {
      await conversion?.cancel();
    } catch {
      /* ignore */
    }
    return passthrough('webcodecs');
  } finally {
    input?.dispose();
  }
}

// ── Native engine ───────────────────────────────────────────────────────────

async function compressNative(
  file: File,
  options: VideoCompressOptions,
  passthrough: (engine?: VideoCompressionEngine) => VideoCompressionResult,
): Promise<VideoCompressionResult> {
  const originalBytes = file.size;
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const fps = options.fps ?? DEFAULT_FPS;

  // Dynamically imported so Vite code-splits them out of the web bundle — the
  // plugin's native calls are never reachable on web anyway.
  let VideoEditor: typeof import('@whiteguru/capacitor-plugin-video-editor').VideoEditor;
  let Filesystem: typeof import('@capacitor/filesystem').Filesystem;
  let Directory: typeof import('@capacitor/filesystem').Directory;
  try {
    ({ VideoEditor } = await import('@whiteguru/capacitor-plugin-video-editor'));
    ({ Filesystem, Directory } = await import('@capacitor/filesystem'));
  } catch {
    return passthrough('native');
  }

  // A zero-byte pick (some Android providers) has nothing to transcode and the
  // upload hook rejects it anyway — pass through rather than write an empty temp.
  if (originalBytes === 0) return passthrough('native');

  const inputName = `vc-in-${uuid()}.${extensionOf(file.name)}`;
  let listener: { remove: () => Promise<void> } | null = null;
  let inputWritten = false;
  let outputPath: string | null = null;

  try {
    // ── In: File → native path ──
    // Written in slices, not as one base64 string: a 150 MB clip would otherwise
    // materialise a ~200 MB base64 string in JS and OOM-kill the WebView (an
    // uncatchable crash, so passthrough couldn't save us). Each slice is
    // base64-decoded and appended independently, so the bytes concatenate back
    // to the original regardless of slice boundaries.
    const uri = await writeFileInChunks(Filesystem, Directory, inputName, file);
    inputWritten = true;

    // ── Transcode ──
    listener = await VideoEditor.addListener('transcodeProgress', (info) => {
      // Native reports a 0–1 fraction (AVAssetExportSession / LiTr).
      const pct = Math.min(100, Math.max(0, Math.round((info?.progress ?? 0) * 100)));
      options.onProgress?.(pct);
    });

    const result = await VideoEditor.edit({
      path: uri,
      transcode: {
        width: maxDimension,
        height: maxDimension, // with keepAspectRatio the plugin fits within the box
        keepAspectRatio: true,
        fps,
      },
    });
    outputPath = result.file?.path ?? null;
    if (!outputPath) return passthrough('native');

    // ── Out: native path → File ──
    const compressedFile = await nativePathToFile(
      outputPath,
      renameToMp4(file.name),
    );

    // A short or already-optimised clip can transcode LARGER than it went in,
    // and a failed export can yield an empty file — keep the smaller original.
    if (!compressedFile.size || compressedFile.size >= originalBytes) {
      return passthrough('native');
    }

    return {
      file: compressedFile,
      originalBytes,
      compressedBytes: compressedFile.size,
      didCompress: true,
      engine: 'native',
    };
  } catch {
    return passthrough('native');
  } finally {
    // Best-effort cleanup. The input lives in Cache; the plugin's output is a
    // file:// URL in the OS temp dir — both are auto-purged by the OS if a
    // delete is missed. Never let cleanup throw into the caller.
    try {
      await listener?.remove();
    } catch {
      /* ignore */
    }
    if (inputWritten) {
      Filesystem.deleteFile({ path: inputName, directory: Directory.Cache }).catch(
        () => {
          /* ignore */
        },
      );
    }
    if (outputPath) {
      Filesystem.deleteFile({ path: outputPath }).catch(() => {
        /* ignore */
      });
    }
  }
}

/**
 * Turn a native file path into a `File` the chunked-upload hook can consume.
 *
 * `convertFileSrc` + `fetch` streams through the WebView's native http bridge,
 * so we never build a giant base64 string in JS — materially lower peak memory
 * than `Filesystem.readFile` for a multi-tens-of-MB output.
 */
async function nativePathToFile(nativePath: string, name: string): Promise<File> {
  const url = Capacitor.convertFileSrc(nativePath);
  const blob = await (await fetch(url)).blob();
  return new File([blob], name, {
    type: blob.type || 'video/mp4',
    lastModified: Date.now(),
  });
}

// ── helpers ───────────────────────────────────────────────────────────────

/** Slice size for the input bridge — keeps peak memory to ~one slice + its base64. */
const WRITE_CHUNK_SIZE = 6 * 1024 * 1024;

/**
 * Write a File to the Cache directory in base64 slices and return its native
 * URI. `appendFile` decodes each slice's base64 independently and appends the
 * resulting bytes, so any slice boundary reassembles to the original file.
 */
async function writeFileInChunks(
  Filesystem: typeof import('@capacitor/filesystem').Filesystem,
  Directory: typeof import('@capacitor/filesystem').Directory,
  path: string,
  file: File,
): Promise<string> {
  let uri = '';
  let offset = 0;
  while (offset < file.size) {
    const slice = file.slice(offset, offset + WRITE_CHUNK_SIZE);
    const data = await blobToBase64(slice);
    if (offset === 0) {
      // writeFile creates/truncates and gives us the uri to hand to the plugin.
      ({ uri } = await Filesystem.writeFile({ path, data, directory: Directory.Cache }));
    } else {
      await Filesystem.appendFile({ path, data, directory: Directory.Cache });
    }
    offset += WRITE_CHUNK_SIZE;
  }
  return uri;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('read-failed'));
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the `data:<mime>;base64,` prefix — Filesystem wants raw base64.
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

function extensionOf(name: string): string {
  const ext = name.split('.').pop();
  return ext && ext !== name ? ext.toLowerCase() : 'mp4';
}

function renameToMp4(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, '') || 'video';
  return `${base}.mp4`;
}

function fitWithin(
  sourceWidth: number,
  sourceHeight: number,
  maxDimension: number,
): [number, number] {
  if (
    !Number.isFinite(sourceWidth) ||
    !Number.isFinite(sourceHeight) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0
  ) {
    return [maxDimension, maxDimension];
  }

  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  // H.264 encoders require even dimensions on several browser/OS combinations.
  const even = (value: number) => Math.max(2, Math.round(value / 2) * 2);
  return [even(sourceWidth * scale), even(sourceHeight * scale)];
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}
