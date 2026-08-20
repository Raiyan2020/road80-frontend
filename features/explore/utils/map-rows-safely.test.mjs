import assert from 'node:assert/strict';
import test from 'node:test';
import { mapRowsSafely } from './map-rows-safely.ts';

test('keeps valid rows when one row fails to map', () => {
  const result = mapRowsSafely([1, 2, 3], (value) => {
    if (value === 2) throw new Error('invalid listing title');
    return value * 10;
  });

  assert.deepEqual(result.items, [10, 30]);
  assert.deepEqual(result.skipped, [{ index: 1, reason: 'invalid listing title' }]);
});

test('handles empty and missing response data', () => {
  assert.deepEqual(mapRowsSafely([], (value) => value), { items: [], skipped: [] });
  assert.deepEqual(mapRowsSafely(undefined, (value) => value), { items: [], skipped: [] });
});
