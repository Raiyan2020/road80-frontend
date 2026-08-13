/**
 * Keep the uploader state object present even before a file is selected.
 * Consumers can safely read `status` during their initial render and after a
 * reset without repeating nullable guards throughout the UI.
 */
export function createIdleVideoUploadState() {
  return {
    file: null,
    progress: 0,
    status: 'idle' as const,
    serverPath: null,
    error: null,
    uploadedBytes: 0,
    totalBytes: 0,
    bytesPerSecond: null,
    etaSeconds: null,
  };
}
