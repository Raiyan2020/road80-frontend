import assert from 'node:assert/strict';
import test from 'node:test';
import { mapRowsSafely } from './map-rows-safely.ts';

test('maps every row when none of them fail', () => {
  const result = mapRowsSafely([1, 2, 3], (n) => n * 10);

  assert.deepEqual(result.items, [10, 20, 30]);
  assert.deepEqual(result.skipped, []);
});

test('keeps the good rows when one row throws', () => {
  const result = mapRowsSafely([1, 2, 3], (n) => {
    if (n === 2) throw new Error('bad row');
    return n * 10;
  });

  assert.deepEqual(result.items, [10, 30]);
});

test('reports the index and reason of each skipped row', () => {
  const result = mapRowsSafely([1, 2, 3], (n) => {
    if (n === 2) throw new Error('title: expected string, received null');
    return n * 10;
  });

  assert.equal(result.skipped.length, 1);
  assert.equal(result.skipped[0].index, 1);
  assert.match(result.skipped[0].reason, /expected string/);
});

test('returns no items rather than throwing when every row fails', () => {
  const result = mapRowsSafely([1, 2], () => {
    throw new Error('all bad');
  });

  assert.deepEqual(result.items, []);
  assert.equal(result.skipped.length, 2);
});

test('handles an empty list', () => {
  const result = mapRowsSafely([], (n) => n);

  assert.deepEqual(result.items, []);
  assert.deepEqual(result.skipped, []);
});

test('treats a non-array input as empty instead of throwing', () => {
  const result = mapRowsSafely(undefined, (n) => n);

  assert.deepEqual(result.items, []);
  assert.deepEqual(result.skipped, []);
});

test('reports a reason even when the thrown value is not an Error', () => {
  const result = mapRowsSafely([1], () => {
    throw 'plain string failure';
  });

  assert.equal(result.skipped.length, 1);
  assert.match(result.skipped[0].reason, /plain string failure/);
});
