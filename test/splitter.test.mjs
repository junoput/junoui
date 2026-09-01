// Splitter (X9 / 20260829-029) — the arithmetic and the structure.
//
// The hit area and the keyboard are measured in test/visual/splitter.spec.mjs.
// What is checkable here is the part that is pure: the clamp, the orientation
// axis, and that the CSS keeps the hit area and the painted line as two
// different numbers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { arrowDelta, nextValue } from '../tools/splitter.mjs';

const css = readFileSync('dist/css/juno.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '\n');
const manifest = JSON.parse(readFileSync('dist/classes.json', 'utf8'));

const rule = (selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  assert.ok(m, `no \`${selector}\` rule in the bundle`);
  return m[1];
};

// ── the axis ─────────────────────────────────────────────────────────────

test('a VERTICAL separator moves on the horizontal arrows', () => {
  // The classic implementation bug: the axis names the SEPARATOR, not the
  // motion. A vertical separator divides panes side by side, so Left/Right
  // move it. Getting this backwards makes the component feel broken in a way
  // that is hard to name.
  assert.equal(arrowDelta('ArrowLeft', 'vertical', 16), -16);
  assert.equal(arrowDelta('ArrowRight', 'vertical', 16), 16);
  assert.equal(arrowDelta('ArrowUp', 'vertical', 16), 0);
  assert.equal(arrowDelta('ArrowDown', 'vertical', 16), 0);
});

test('a HORIZONTAL separator moves on the vertical arrows', () => {
  assert.equal(arrowDelta('ArrowUp', 'horizontal', 16), -16);
  assert.equal(arrowDelta('ArrowDown', 'horizontal', 16), 16);
  assert.equal(arrowDelta('ArrowLeft', 'horizontal', 16), 0);
  assert.equal(arrowDelta('ArrowRight', 'horizontal', 16), 0);
});

test('vertical is the default when nothing says otherwise', () => {
  // aria-orientation is optional in the markup; the CSS defaults to vertical,
  // so the keyboard must agree or the two disagree about the same element.
  assert.equal(arrowDelta('ArrowRight', undefined, 16), 16);
  assert.equal(arrowDelta('ArrowRight', null, 16), 16);
});

test('an arrow that does not apply is left alone', () => {
  // 0, not "clamp to current": the enhancer only calls preventDefault when the
  // delta is non-zero, so a Down arrow on a vertical splitter scrolls the page
  // as it should instead of being silently swallowed.
  assert.equal(arrowDelta('ArrowDown', 'vertical', 16), 0);
  assert.equal(arrowDelta('Tab', 'vertical', 16), 0);
});

// ── the clamp ────────────────────────────────────────────────────────────

test('a move stays inside the declared range', () => {
  // A separator that can leave [min, max] ANNOUNCES a position the app will
  // refuse — the screen reader says 700 while the pane sits at 640, which is
  // worse than not moving.
  assert.equal(nextValue({ now: 320, min: 180, max: 640, delta: 16 }), 336);
  assert.equal(nextValue({ now: 630, min: 180, max: 640, delta: 16 }), 640);
  assert.equal(nextValue({ now: 190, min: 180, max: 640, delta: -16 }), 180);
});

test('already at an end, a further move is a no-op rather than an error', () => {
  assert.equal(nextValue({ now: 640, min: 180, max: 640, delta: 16 }), 640);
  assert.equal(nextValue({ now: 180, min: 180, max: 640, delta: -16 }), 180);
});

test('a non-finite request returns the current value', () => {
  // aria-valuenow is author-supplied and arrives as a string; a missing or
  // malformed one must not move the pane to NaN.
  // ANY non-finite target is refused, not clamped. Clamping Infinity to max
  // would move the pane on malformed input, which is a strange thing for a
  // parse failure to do; refusing leaves the pane where the user last put it.
  assert.equal(nextValue({ now: 320, min: 180, max: 640, delta: NaN }), 320);
  assert.equal(nextValue({ now: 320, min: 180, max: 640, delta: Infinity }), 320);
  assert.equal(nextValue({ now: 320, min: 180, max: 640, delta: -Infinity }), 320);
});

// ── structure ────────────────────────────────────────────────────────────

test('the class is in the manifest and documented', () => {
  assert.ok(manifest.all.includes('juno-splitter'));
  assert.ok(manifest.public.includes('juno-splitter'), 'shipped undocumented');
});

test('the hit area and the painted line are two different numbers', () => {
  // The component's reason to exist alongside the ARIA: a 1px separator is a
  // 1px target. If these ever collapse into one value, either the handle is
  // untappable or the app has a 44px line down the middle of its layout.
  const body = rule('.juno-splitter');
  assert.match(body, /--juno-splitter-line:\s*var\(--juno-border-width-1\)/);
  assert.match(body, /--juno-splitter-hit:\s*var\(--juno-size-tap-min\)/);
  assert.notEqual(
    /--juno-splitter-line:\s*([^;]+);/.exec(body)[1],
    /--juno-splitter-hit:\s*([^;]+);/.exec(body)[1],
  );
});

test('the hit area tracks the tap floor rather than a literal', () => {
  // --juno-size-tap-min promotes to 44px on a coarse pointer through the base
  // layer, so a literal here would ship a 24px drag target to a phone.
  assert.match(rule('.juno-splitter'), /--juno-splitter-hit:\s*var\(--juno-size-tap-min\)/);
});

test('the hit area overlaps its neighbours instead of displacing them', () => {
  // Centred with a translate, and the FLEX BASIS is the line, not the hit
  // area. Sizing the box to the hit area would put a 44px gap between the
  // panes on every pointer type.
  assert.match(rule('.juno-splitter'), /flex:\s*0 0 var\(--juno-splitter-line\)/);
  assert.match(rule('.juno-splitter::after'), /inline-size:\s*var\(--juno-splitter-hit\)/);
  assert.match(rule('.juno-splitter::after'), /translate:\s*-50% 0/);
});

test('orientation is read from aria, not from a modifier class', () => {
  // The app must set aria-orientation for the screen reader anyway; a class
  // would be a second copy of the same fact, free to disagree with it.
  assert.match(css, /\.juno-splitter\[aria-orientation=['"]horizontal['"]\]/);
  assert.ok(!/juno-splitter--horizontal|juno-splitter--vertical/.test(css));
});

test('the splitter opts out of touch scrolling', () => {
  // A drag on the handle must not scroll the page; the app attaches the
  // pointer handlers, but the CSS half of that is junoui's.
  assert.match(rule('.juno-splitter'), /touch-action:\s*none/);
});

test('junoui ships no resize state machine', () => {
  // The boundary, asserted rather than promised. If a width calculation or a
  // pointer handler ever appears in this module, the line in layout.md has
  // moved and should move deliberately.
  const js = readFileSync('tools/splitter.mjs', 'utf8');
  for (const forbidden of [
    'pointerdown',
    'pointermove',
    'setPointerCapture',
    'getBoundingClientRect',
    'style.width',
  ]) {
    assert.ok(!js.includes(forbidden), `the enhancer reaches for ${forbidden}`);
  }
  // ...and it never writes the position it is asked about
  assert.ok(!/setAttribute\(\s*['"]aria-valuenow/.test(js), 'the enhancer writes aria-valuenow');
});
