// junoui/scrubber — the pure half (X6, 20260829-026).
//
// The arithmetic and the announcement, tested without a DOM. The geometry that
// needs an engine is in test/visual/scrubber.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  formatTime,
  keyDelta,
  nextValue,
  percentOf,
  valueAtPointer,
  valueText,
} from '../tools/scrubber.mjs';

// ── the announcement, which is the ticket's headline ─────────────────────

test('a playhead announces a TIME, not a number', () => {
  // The whole reason aria-valuetext is mandatory here: role="slider" announces
  // valuenow, so a screen reader says "87" or "41 percent" for a position in a
  // three-minute clip. Neither is usable.
  assert.equal(valueText(87, 212), '1:27 of 3:32');
});

test('the clock drops the hour below an hour, and keeps it above', () => {
  // "0:04:07" is a duration nobody wrote; "4:07" is what a transport shows.
  assert.equal(formatTime(247), '4:07');
  assert.equal(formatTime(3607), '1:00:07');
  assert.equal(formatTime(59), '0:59');
  assert.equal(formatTime(60), '1:00');
});

test('a nonsense time clamps instead of announcing nonsense', () => {
  // A screen reader will happily say "-1:-5". Worse than briefly wrong.
  for (const bad of [-1, NaN, Infinity, -Infinity, undefined]) {
    assert.equal(formatTime(bad), '0:00', `formatTime(${bad})`);
  }
});

// ── the keyboard model ───────────────────────────────────────────────────

test('arrows step small, PageUp/PageDown step large', () => {
  const ctx = { step: 5, pageStep: 30, now: 100, min: 0, max: 200 };
  assert.equal(keyDelta('ArrowRight', ctx), 5);
  assert.equal(keyDelta('ArrowLeft', ctx), -5);
  assert.equal(keyDelta('PageUp', ctx), 30);
  assert.equal(keyDelta('PageDown', ctx), -30);
});

test('Home and End reach the ends exactly, from anywhere', () => {
  // As a DELTA from the current position, so the caller needs no special case
  // and cannot land one step short of the end.
  const ctx = { step: 5, pageStep: 30, now: 137, min: 0, max: 212 };
  assert.equal(nextValue({ ...ctx, delta: keyDelta('Home', ctx) }), 0);
  assert.equal(nextValue({ ...ctx, delta: keyDelta('End', ctx) }), 212);
});

test('a key this component does not own returns null, not zero', () => {
  // "no movement" and "not mine" are different: collapsing them is how a
  // scrubber ends up calling preventDefault on Tab and trapping focus.
  const ctx = { step: 5, pageStep: 30, now: 10, min: 0, max: 100 };
  assert.equal(keyDelta('Tab', ctx), null);
  assert.equal(keyDelta('Enter', ctx), null);
  assert.equal(keyDelta(' ', ctx), null);
});

test('the value never leaves its declared range', () => {
  assert.equal(nextValue({ now: 210, min: 0, max: 212, delta: 30 }), 212);
  assert.equal(nextValue({ now: 2, min: 0, max: 212, delta: -30 }), 0);
  assert.equal(nextValue({ now: 50, min: 0, max: 212, delta: NaN }), 50);
});

// ── pointer mapping ──────────────────────────────────────────────────────

test('a pointer maps to a value along the track', () => {
  const rect = { left: 100, width: 400 };
  assert.equal(valueAtPointer({ clientX: 100, rect, min: 0, max: 200 }), 0);
  assert.equal(valueAtPointer({ clientX: 300, rect, min: 0, max: 200 }), 100);
  assert.equal(valueAtPointer({ clientX: 500, rect, min: 0, max: 200 }), 200);
});

test('a pointer outside the track clamps rather than seeking past the end', () => {
  const rect = { left: 100, width: 400 };
  assert.equal(valueAtPointer({ clientX: -50, rect, min: 0, max: 200 }), 0);
  assert.equal(valueAtPointer({ clientX: 9999, rect, min: 0, max: 200 }), 200);
});

test('in a right-to-left document the track starts at its right edge', () => {
  // A scrubber that ignores direction seeks BACKWARDS for half the world, and
  // it is invisible in every test written in English.
  const rect = { left: 100, width: 400 };
  assert.equal(valueAtPointer({ clientX: 100, rect, min: 0, max: 200, rtl: true }), 200);
  assert.equal(valueAtPointer({ clientX: 500, rect, min: 0, max: 200, rtl: true }), 0);
});

test('a zero-width track does not divide by zero', () => {
  assert.equal(valueAtPointer({ clientX: 10, rect: { left: 0, width: 0 }, min: 3, max: 9 }), 3);
});

test('percentOf survives a degenerate range', () => {
  assert.equal(percentOf(50, 0, 100), '50.000%');
  assert.equal(percentOf(5, 10, 10), '0%');
  assert.equal(percentOf(999, 0, 100), '100.000%');
});

// ── the package surface ──────────────────────────────────────────────────

test('the scrubber is exported and packaged', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.exports['./scrubber'], './tools/scrubber.mjs');
});

test('both scrubber surfaces are registered as touch surfaces', () => {
  // The generated touch layer is the single list; a component that sets its own
  // tap-highlight suppression is a second copy of a rule that layer owns.
  const src = readFileSync('src/css/touch-surfaces.mjs', 'utf8');
  for (const c of ['juno-scrubber', 'juno-scrubber__mark']) {
    assert.match(src, new RegExp(`'${c}'`), `${c} is not a registered touch surface`);
  }
});

test('the scrubber overrides the layer to touch-action: none', () => {
  // The layer gives `manipulation`, which leaves the browser free to claim a
  // horizontal pan — so a scrub on a phone scrolls the page instead of seeking.
  // `:where()` is zero-specificity, so the component rule wins.
  const css = readFileSync('dist/css/juno.css', 'utf8');
  for (const sel of ['.juno-scrubber {', '.juno-scrubber__mark {']) {
    const body = css.slice(css.indexOf(sel), css.indexOf('}', css.indexOf(sel)));
    assert.match(body, /touch-action:\s*none/, `${sel} does not claim the drag axis`);
  }
});
