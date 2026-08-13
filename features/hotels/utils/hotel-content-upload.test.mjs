import assert from 'node:assert/strict';
import test from 'node:test';
import { isHotelContentUploadActive } from './hotel-content-upload.ts';

test('an untouched hotel content form has no active video upload', () => {
  assert.equal(isHotelContentUploadActive(null), false);
  assert.equal(isHotelContentUploadActive(undefined), false);
});

test('uploading and merging keep the hotel content form busy', () => {
  assert.equal(isHotelContentUploadActive({ status: 'uploading' }), true);
  assert.equal(isHotelContentUploadActive({ status: 'merging' }), true);
  assert.equal(isHotelContentUploadActive({ status: 'done' }), false);
});
