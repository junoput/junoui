// Unit tests for the OKLCH → sRGB hex conversion.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toHex, oklchToHex } from '../scripts/color.mjs';

test('hex passes through, uppercased', () => {
  assert.equal(toHex('#78a9ff'), '#78A9FF');
  assert.equal(toHex('#FFFFFF'), '#FFFFFF');
});

test('oklch converts to a 6-digit hex', () => {
  const h = oklchToHex('oklch(73% 0.22 148)');
  assert.match(h, /^#[0-9A-F]{6}$/);
});

test('known conversions are stable', () => {
  // standard.dark.nominal — a vivid green
  assert.equal(toHex('oklch(73% 0.22 148)'), '#00CB4C');
  // standard.dark.warning — a red
  assert.equal(toHex('oklch(63% 0.22 28)'), '#F13A32');
});

test('white and black map to gamut corners', () => {
  assert.equal(toHex('oklch(100% 0 0)'), '#FFFFFF');
  assert.equal(toHex('oklch(0% 0 0)'), '#000000');
});

test('non-color input falls back rather than throwing', () => {
  assert.equal(toHex('not-a-color'), '#000000');
  assert.equal(oklchToHex('rgb(1,2,3)'), null);
});
