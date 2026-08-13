'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
// Use built-in crypto.randomUUID — available in modern browsers and Node 14.17+
import { postAdService } from '../services/post-ad.service';
import { t } from '../../../i18n';
import {
  MAX_VIDEO_BYTES,
  isWithinVideoSizeLimit,
} from '../../../shared/utils/media-validation';
import { formatBytes } from '../../../shared/utils/media-compression';
import { createIdleVideoUploadState } from '../utils/video-upload-state';

/** Size of each chunk in bytes (2 MB) */
const CHUNK_SIZE = 2 * 1024 * 1024;

/**
 * Chunks in flight at once.
 *
 * Uploads used to run strictly sequentially, which left the connection idle for
 * a full round-trip between every 2 MB — the single biggest reason uploads felt
 * slow on mobile. Four keeps the pipe saturated without burying the PHP worker
 * pool; each request still writes its own `.part` file so order doesn't matter.
 */
const CHUNK_CONCURRENCY = 4;

/** Retries per chunk. Mobile connections drop individual requests routinely. */
const CHUNK_RETRIES = 2;

export type ChunkedUploadStatus =
  | 'idle'
  | 'uploading'
  | 'merging'
  | 'done'
  | 'error';

export interface VideoUploadState {
  /** The local File selected by the user */
  file: File | null;
  /** Progress: 0-100 */
  progress: number;
  status: ChunkedUploadStatus;
  /** Server-side path returned after merging — use this in createAd */
  serverPath: string | null;
  error: string | null;
  /** Bytes confirmed received by the server so far. */
  uploadedBytes: number;
  /** Total bytes to send — equal to `file.size`. */
  totalBytes: number;
  /** Average throughput so far, in bytes/second. Null until measurable. */
  bytesPerSecond: number | null;
  /** Rough seconds remaining, derived from average throughput. */
  etaSeconds: number | null;
}

/** Errors we raise ourselves — their `message` is already localized. */
class VideoUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VideoUploadError';
  }
}

export class VideoUploadCancelledError extends Error {
  constructor() {
    super('Video upload cancelled');
    this.name = 'VideoUploadCancelledError';
  }
}

export const isVideoUploadCancelled = (
  error: unknown,
): error is VideoUploadCancelledError =>
  error instanceof VideoUploadCancelledError;

const NETWORK_ERROR_RE =
  /failed to fetch|networkerror|network request failed|load failed|timed? ?out/i;

/**
 * `uploadState.error` is rendered verbatim in the post-ad video preview
 * overlay, so it must always be a localized, user-readable sentence.
 *
 * Only two sources qualify:
 *  - `VideoUploadError`, which we throw with an already-localized message;
 *  - the API body's `message`, which the backend localizes from the
 *    `Accept-Language` header set in lib/api-client.
 *
 * Anything else is developer-facing English — ofetch's
 * `[POST] "…": 500 Internal Server Error`, or raw browser strings such as
 * "Failed to fetch" / "NetworkError when attempting to fetch resource" — and
 * collapses to a localized generic (network-specific where we can tell).
 */
const toUploadErrorMessage = (err: unknown): string => {
  if (err instanceof VideoUploadError) return err.message;

  const serverMessage = (err as { data?: { message?: unknown } } | null)?.data?.message;
  if (typeof serverMessage === 'string' && serverMessage.trim()) {
    return serverMessage.trim();
  }

  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (offline || (err instanceof Error && NETWORK_ERROR_RE.test(err.message))) {
    return t('common.networkError');
  }

  return t('postAd.video.uploadError');
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useChunkedVideoUpload() {
  const [uploadState, setUploadState] = useState<VideoUploadState>(
    createIdleVideoUploadState,
  );
  /** Bumped on reset so a superseded upload stops writing state. */
  const runIdRef = useRef(0);
  /** Aborts active chunk/merge requests rather than only hiding their state. */
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    runIdRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setUploadState(createIdleVideoUploadState());
  }, []);

  useEffect(
    () => () => {
      runIdRef.current += 1;
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    },
    [],
  );

  /**
   * Start chunked upload for a video file.
   * Returns the merged server path on success, or throws on failure.
   */
  const uploadVideo = useCallback(async (file: File): Promise<string> => {
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const { signal } = abortController;

    const runId = ++runIdRef.current;
    const isStale = () => runIdRef.current !== runId;

    const fileId = crypto.randomUUID();
    const extension = '.' + (file.name.split('.').pop() ?? 'mp4');
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const startedAt = performance.now();

    setUploadState({
      file,
      progress: 0,
      status: 'uploading',
      serverPath: null,
      error: null,
      uploadedBytes: 0,
      totalBytes: file.size,
      bytesPerSecond: null,
      etaSeconds: null,
    });

    try {
      // A zero-byte pick (some Android file providers hand one back when the
      // real file can't be read) would divide by zero in the progress maths.
      if (file.size === 0) {
        throw new VideoUploadError(t('postAd.video.uploadError'));
      }

      if (!isWithinVideoSizeLimit(file)) {
        throw new VideoUploadError(
          t('postAd.video.tooLarge', {
            size: formatBytes(file.size),
            max: formatBytes(MAX_VIDEO_BYTES),
          }),
        );
      }

      let uploadedBytes = 0;
      let nextChunk = 0;
      let aborted = false;

      const publishProgress = () => {
        if (isStale()) return;
        const elapsedSeconds = (performance.now() - startedAt) / 1000;
        // Ignore the first moments — dividing by a near-zero elapsed time
        // produces a wildly optimistic speed that then visibly collapses.
        const bytesPerSecond =
          elapsedSeconds > 0.5 ? uploadedBytes / elapsedSeconds : null;
        const remaining = file.size - uploadedBytes;

        setUploadState((prev) =>
          prev
            ? {
                ...prev,
                // 0–90% covers transfer; merging owns the rest.
                progress: Math.round((uploadedBytes / file.size) * 90),
                uploadedBytes,
                bytesPerSecond,
                etaSeconds:
                  bytesPerSecond && bytesPerSecond > 0
                    ? Math.ceil(remaining / bytesPerSecond)
                    : null,
              }
            : prev,
        );
      };

      const sendChunk = async (index: number) => {
        const start = index * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        for (let attempt = 0; ; attempt++) {
          try {
            await postAdService.uploadChunk({
              fileId,
              chunkIndex: index,
              chunk,
              signal,
            });
            return end - start;
          } catch (err) {
            if (signal.aborted || isStale()) {
              throw new VideoUploadCancelledError();
            }
            if (attempt >= CHUNK_RETRIES || aborted || isStale()) throw err;
            // Back off a little before retrying — an immediate retry on a
            // flaky mobile link usually fails the same way.
            await delay(500 * (attempt + 1));
          }
        }
      };

      // Pull-based pool: each worker takes the next unclaimed chunk, so a slow
      // chunk doesn't stall the others the way a fixed partition would.
      const worker = async () => {
        while (!aborted && !isStale()) {
          const index = nextChunk++;
          if (index >= totalChunks) return;

          try {
            uploadedBytes += await sendChunk(index);
          } catch (err) {
            aborted = true; // stop siblings claiming more work
            throw err;
          }
          publishProgress();
        }
      };

      const workers = Array.from(
        { length: Math.min(CHUNK_CONCURRENCY, totalChunks) },
        () => worker(),
      );
      // allSettled, not all: `all` rejects on the first failure while the other
      // workers are still in flight, and we want them wound down before we
      // surface the error.
      const outcomes = await Promise.allSettled(workers);
      const failure = outcomes.find((o) => o.status === 'rejected');
      if (failure) throw (failure as PromiseRejectedResult).reason;

      if (signal.aborted || isStale()) {
        throw new VideoUploadCancelledError();
      }

      // Merge all chunks → get server path
      setUploadState((prev) =>
        prev
          ? {
              ...prev,
              status: 'merging',
              progress: 95,
              uploadedBytes: file.size,
              etaSeconds: null,
            }
          : prev,
      );

      const mergeRes = await postAdService.mergeChunks({
        fileId,
        totalChunks,
        originalExtension: extension,
        signal,
      });

      if (!mergeRes.status) {
        throw new VideoUploadError(
          mergeRes.message || t('postAd.video.mergeFailed'),
        );
      }

      const serverPath = mergeRes.data.path;

      if (!isStale()) {
        setUploadState((prev) =>
          prev
            ? {
                ...prev,
                status: 'done',
                progress: 100,
                serverPath,
                etaSeconds: null,
                bytesPerSecond: null,
              }
            : prev,
        );
      }

      return serverPath;
    } catch (err: unknown) {
      if (signal.aborted || isStale() || isVideoUploadCancelled(err)) {
        throw new VideoUploadCancelledError();
      }

      const message = toUploadErrorMessage(err);
      setUploadState((prev) =>
        prev ? { ...prev, status: 'error', error: message } : prev,
      );
      throw err;
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, []);

  return { uploadState, uploadVideo, reset };
}
