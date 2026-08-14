// Sprite subsetter — the build-tooling half of the icon story. A consumer
// that inlines the sprite (which Safari's flaky external-<use> rendering
// forces) ships every icon unless it subsets, so these assert the contract
// that makes the subset safe to ship: nothing silently dropped, nothing
// silently added, and the MIT notice survives the trim.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { subsetSprite, spriteSymbolNames } from '../tools/subset-sprite.mjs';

const SPRITE = readFileSync('dist/icons/juno-icons.svg', 'utf8');

test('the sprite names every symbol it defines', () => {
  const names = spriteSymbolNames(SPRITE);
  assert.ok(names.length > 20, `expected a real sprite, got ${names.length} symbols`);
  assert.ok(names.includes('gear'));
  assert.equal(new Set(names).size, names.length, 'symbol ids must be unique');
});

test('a subset keeps exactly the requested icons', () => {
  const out = subsetSprite(SPRITE, ['gear', 'x', 'squares-four']);
  assert.deepEqual(spriteSymbolNames(out).sort(), ['gear', 'squares-four', 'x']);
});

test('a subset is smaller than the sprite it came from', () => {
  const out = subsetSprite(SPRITE, ['gear']);
  assert.ok(out.length < SPRITE.length / 2, `subset ${out.length} vs sprite ${SPRITE.length}`);
});

test('the license banner and wrapper survive the subset', () => {
  const out = subsetSprite(SPRITE, ['gear']);
  // The icons are MIT Phosphor; carrying the notice is a redistribution
  // condition, so a subset that drops it is a licensing bug, not a nit.
  assert.match(out, /Phosphor Icons/);
  assert.match(out, /<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(out, /fill="currentColor"/);
  assert.match(out.trimEnd(), /<\/svg>$/);
});

test('an unknown icon name fails the build instead of vanishing', () => {
  // A dropped symbol renders as an empty <svg> in the app — invisible until a
  // user reports a blank space. It has to be loud at build time.
  assert.throws(
    () => subsetSprite(SPRITE, ['gear', 'no-such-icon']),
    /no icon named 'no-such-icon'/,
  );
});

test('the subset order follows the sprite, not the request', () => {
  const a = subsetSprite(SPRITE, ['x', 'gear']);
  const b = subsetSprite(SPRITE, ['gear', 'x']);
  assert.equal(a, b, 'a reordered request must not change the output');
});

test('requesting every icon reproduces every symbol', () => {
  const all = spriteSymbolNames(SPRITE);
  assert.deepEqual(spriteSymbolNames(subsetSprite(SPRITE, all)), all);
});

test('an empty request yields a sprite with no symbols, not a broken file', () => {
  const out = subsetSprite(SPRITE, []);
  assert.deepEqual(spriteSymbolNames(out), []);
  assert.match(out, /Phosphor Icons/);
  assert.match(out.trimEnd(), /<\/svg>$/);
});
