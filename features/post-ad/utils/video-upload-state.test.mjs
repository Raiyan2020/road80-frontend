import assert from 'node:assert/strict';
import test from 'node:test';
import { createIdleVideoUploadState } from './video-upload-state.ts';

test('the video uploader exposes a safe idle state before any file is selected', () => {
  assert.deepEqual(createIdleVideoUploadState(), {
    file: null,
    progress: 0,
    status: 'idle',
    serverPath: null,
    error: null,
    uploadedBytes: 0,
    totalBytes: 0,
    bytesPerSecond: null,
    etaSeconds: null,
  });
});

test('each reset receives a fresh idle-state object', () => {
  assert.notEqual(createIdleVideoUploadState(), createIdleVideoUploadState());
});
