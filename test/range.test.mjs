// junoui/range — the two decisions (X7, 20260829-027).
//
// A dual-thumb slider has exactly two hard problems: which thumb a tap grabs
// when both are under it, and what happens when you drag one past the other.
// Everything else is a slider twice. These pin both, including the inputs where
// the obvious rules give the wrong answer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { isValidRange, moveThumb, percentOf, pickThumb, thumbBounds } from '../tools/range.mjs';

const R = { lo: 30, hi: 70, min: 0, max: 100 };

// ── DECISION 1: which thumb does a tap grab ──────────────────────────────

test('between the thumbs, the nearer one wins', () => {
  assert.equal(pickThumb({ ...R, value: 40 }), 'lo');
  assert.equal(pickThumb({ ...R, value: 60 }), 'hi');
});

test('outside the pair, the thumb on that side wins', () => {
  // Stated as what it is rather than as a win over nearest-centre: OUTSIDE the
  // pair the two rules always agree, because the nearer thumb IS the one on
  // that side. I went looking for an input where they disagree and there isn't
  // one — which is the point. The direction rule earns its place not here but
  // on coincident thumbs, where nearest-centre has no answer at all (below).
  assert.equal(pickThumb({ lo: 80, hi: 90, min: 0, max: 100, value: 10 }), 'lo');
  assert.equal(pickThumb({ lo: 10, hi: 20, min: 0, max: 100, value: 95 }), 'hi');
});

test('COINCIDENT thumbs resolve by the direction of the tap', () => {
  // The case pure nearest-centre cannot answer at all: both distances are equal
  // for every tap, because the thumbs are the same point.
  const both = { lo: 50, hi: 50, min: 0, max: 100 };
  assert.equal(pickThumb({ ...both, value: 20 }), 'lo', 'a tap to the LEFT must grab the lower');
  assert.equal(pickThumb({ ...both, value: 80 }), 'hi', 'a tap to the RIGHT must grab the upper');
});

test('a tap exactly on two coincident thumbs uses last-moved', () => {
  // The only genuine tie. Sticky beats arbitrary: the thumb you just moved is
  // the one you are still working with.
  const both = { lo: 50, hi: 50, min: 0, max: 100, value: 50 };
  assert.equal(pickThumb({ ...both, last: 'hi' }), 'hi');
  assert.equal(pickThumb({ ...both, last: 'lo' }), 'lo');
});

test('with no last-moved, the tie goes to the thumb that is NOT pinned', () => {
  // Where pure last-moved fails: both thumbs at the maximum, last moved was the
  // upper, and the upper cannot go anywhere. Grabbing it means a tap that does
  // nothing — the control reads as broken.
  assert.equal(
    pickThumb({ lo: 100, hi: 100, min: 0, max: 100, value: 100 }),
    'lo',
    'at the top only the lower can move',
  );
  assert.equal(
    pickThumb({ lo: 0, hi: 0, min: 0, max: 100, value: 0 }),
    'hi',
    'at the bottom only the upper can move',
  );
});

test('every tap resolves to a thumb that can actually move toward it', () => {
  // The property the rule exists for, swept rather than spot-checked: for any
  // arrangement and any tap, the grabbed thumb ends up nearer the tap than it
  // started, or was already there.
  for (const lo of [0, 10, 50, 99, 100]) {
    for (const hi of [lo, lo + 1, 50, 100].filter((h) => h >= lo && h <= 100)) {
      for (const value of [0, 5, 25, 50, 75, 95, 100]) {
        const thumb = pickThumb({ lo, hi, min: 0, max: 100, value });
        const before = thumb === 'lo' ? lo : hi;
        const next = moveThumb({ thumb, value, lo, hi, min: 0, max: 100 });
        const after = thumb === 'lo' ? next.lo : next.hi;
        const closer = Math.abs(after - value) <= Math.abs(before - value);
        assert.ok(closer, `lo=${lo} hi=${hi} tap=${value} grabbed ${thumb}: ${before} -> ${after}`);
        assert.ok(isValidRange({ ...next, min: 0, max: 100 }), `invalid pair from tap ${value}`);
      }
    }
  }
});

// ── DECISION 2: dragging one thumb past the other ────────────────────────

test('a thumb dragged past the other CLAMPS — it does not cross', () => {
  assert.deepEqual(moveThumb({ thumb: 'lo', value: 90, ...R }), { lo: 70, hi: 70 });
  assert.deepEqual(moveThumb({ thumb: 'hi', value: 10, ...R }), { lo: 30, hi: 30 });
});

test('clamping does not SWAP the thumbs', () => {
  // Swapping would change which bound the finger is dragging mid-gesture:
  // aria-valuenow on the grabbed thumb silently starts meaning the other end,
  // and a screen-reader user who grabbed "Minimum" is told nothing.
  const out = moveThumb({ thumb: 'lo', value: 200, ...R });
  assert.equal(out.hi, 70, 'the untouched thumb moved — that is a push or a swap');
  assert.ok(out.lo <= out.hi);
});

test('clamping does not PUSH the other thumb', () => {
  // Pushing edits a value the user did not touch. On a price filter that is a
  // silent change to the other bound.
  const out = moveThumb({ thumb: 'hi', value: -50, ...R });
  assert.equal(out.lo, 30);
});

test('minGap stops them early, and still never crosses', () => {
  const g = { ...R, minGap: 10 };
  assert.deepEqual(moveThumb({ thumb: 'lo', value: 90, ...g }), { lo: 60, hi: 70 });
  assert.deepEqual(moveThumb({ thumb: 'hi', value: 10, ...g }), { lo: 30, hi: 40 });
});

test('a thumb never leaves the track', () => {
  assert.deepEqual(moveThumb({ thumb: 'lo', value: -999, ...R }), { lo: 0, hi: 70 });
  assert.deepEqual(moveThumb({ thumb: 'hi', value: 999, ...R }), { lo: 30, hi: 100 });
});

// ── the announced constraint ─────────────────────────────────────────────

test('each thumb announces the OTHER thumb as its limit', () => {
  // The ticket's own ask. Without it the constraint is enforced but silent: a
  // screen-reader user pushes against an invisible wall with no announcement.
  assert.deepEqual(thumbBounds({ thumb: 'lo', ...R }), { min: 0, max: 70 });
  assert.deepEqual(thumbBounds({ thumb: 'hi', ...R }), { min: 30, max: 100 });
});

test('the announced limit respects minGap too', () => {
  assert.deepEqual(thumbBounds({ thumb: 'lo', ...R, minGap: 10 }), { min: 0, max: 60 });
  assert.deepEqual(thumbBounds({ thumb: 'hi', ...R, minGap: 10 }), { min: 40, max: 100 });
});

// ── misc ─────────────────────────────────────────────────────────────────

test('percentOf survives a degenerate range', () => {
  assert.equal(percentOf(30, 0, 100), '30.000%');
  assert.equal(percentOf(5, 10, 10), '0%');
});

test('the range is exported and packaged', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.exports['./range'], './tools/range.mjs');
});
