// Pointer-first responsiveness (conformance kit slice 3, 20260826-036 item C).
//
// THE DEFECT. `.juno-rail--responsive` keyed on `width <= 767.98px`. A
// landscape iPhone is 844x390 — WIDER than md — so it was served the desktop
// rail on a device held in two hands. Width has never been the question.
//
// THE DECISION, which open question C left to whoever built this: the
// condition needs a size term, and the term is HEIGHT, because that is what
// separates a landscape phone from a tablet or a coarse-pointer kiosk. The
// device table below is the evidence, and it is a test rather than a comment
// so a future retune has to argue with real dimensions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  COARSE_POINTER,
  COMPACT_NAV,
  NARROW_MAX_PX,
  SHORT_MAX_PX,
  wantsCompactNav,
} from '../tools/pointer.mjs';

const css = readFileSync('dist/css/juno.css', 'utf8');
const customMedia = readFileSync('dist/css/juno-custom-media.css', 'utf8');

// Real devices, not round numbers. The whole decision rests on where these
// actually fall.
const DEVICES = [
  ['portrait phone', { width: 390, height: 844, coarse: true }, true],
  ['small portrait phone', { width: 320, height: 568, coarse: true }, true],
  ['landscape phone', { width: 844, height: 390, coarse: true }, true],
  ['small landscape phone', { width: 568, height: 320, coarse: true }, true],
  ['tablet portrait', { width: 834, height: 1112, coarse: true }, false],
  ['tablet landscape', { width: 1112, height: 834, coarse: true }, false],
  ['coarse kiosk', { width: 2560, height: 1440, coarse: true }, false],
  ['laptop', { width: 1440, height: 900, coarse: false }, false],
  ['narrow desktop window', { width: 600, height: 900, coarse: false }, false],
];

test('every device lands on the side the design intends', () => {
  const wrong = [];
  for (const [name, dims, want] of DEVICES) {
    if (wantsCompactNav(dims) !== want) {
      wrong.push(`${name} (${dims.width}x${dims.height}, coarse=${dims.coarse}) → ${!want}`);
    }
  }
  assert.deepEqual(wrong, []);
});

test('a landscape phone is the case width alone gets wrong', () => {
  // Stated on its own because it is the entire reason this exists: 844 is
  // wider than md, so the old width-only rule served it a desktop rail.
  const landscape = { width: 844, height: 390, coarse: true };
  assert.equal(wantsCompactNav(landscape), true);
  assert.ok(landscape.width > NARROW_MAX_PX, 'the premise changed — 844 is no longer above md');
});

test('a coarse pointer alone is not enough', () => {
  // The mirror of the bug: a 27" touchscreen has room for a rail and a person
  // standing at arm's length. Phone navigation there would be the same error
  // pointing the other way.
  assert.equal(wantsCompactNav({ width: 2560, height: 1440, coarse: true }), false);
});

test('a narrow window on a mouse is not a phone', () => {
  // Width alone is not sufficient EITHER. A half-screen desktop window is
  // 600px wide and still wants the rail; the pointer is what says otherwise.
  assert.equal(wantsCompactNav({ width: 600, height: 900, coarse: false }), false);
});

test('the short threshold sits in a real gap, not on an edge', () => {
  // 500 is not tuned: landscape phones top out around 430 and tablets start
  // at 768, so anything in that range picks the same set. If a future device
  // narrows the gap, this fails and the choice has to be made again.
  const tallestPhoneLandscape = 430;
  const shortestTablet = 768;
  assert.ok(
    SHORT_MAX_PX > tallestPhoneLandscape,
    'the threshold has fallen below a landscape phone',
  );
  assert.ok(SHORT_MAX_PX < shortestTablet, 'the threshold has risen into tablet territory');
});

// ── one source ───────────────────────────────────────────────────────────

test('the CSS literal, the custom media and the JS string are one condition', () => {
  // Three places state this: rail.css authors the literal (@custom-media needs
  // a build step junoui does not require of consumers), the token build emits
  // the named version, and junoui/pointer exports it for an app choosing a
  // COMPONENT rather than a rule. Two implementations of one condition drift,
  // and the drift is invisible — the CSS hides the rail while the app still
  // renders it, or the reverse.
  assert.ok(css.includes(`@media ${COMPACT_NAV}`), 'the bundle does not author the condition');
  assert.ok(
    customMedia.includes(`@custom-media --juno-compact-nav ${COMPACT_NAV};`),
    'the emitted custom media does not match',
  );
  assert.ok(customMedia.includes(`@custom-media --juno-coarse ${COARSE_POINTER};`));
});

test('the two conditions are kept apart', () => {
  // Touch ergonomics and navigation shape answer different questions.
  // Conflating them puts a phone dock on a kiosk or a 24px tap target on a
  // landscape phone; both have shipped in this org.
  assert.ok(!COARSE_POINTER.includes('width'), 'the ergonomics condition grew a size term');
  assert.ok(!COARSE_POINTER.includes('height'));
  assert.ok(COMPACT_NAV.includes('pointer: coarse'), 'the nav condition lost its pointer term');
  assert.ok(COMPACT_NAV.includes('height'), 'the nav condition lost its height term');
});

test('the rail switch is pointer-first, not width-first', () => {
  // The fix itself. A width-only @media wrapping the responsive rail is the
  // defect returning.
  const rule = /@media ([^{]*)\{\s*\.juno-rail--responsive/.exec(css);
  assert.ok(rule, 'the responsive rail rule is gone');
  assert.match(rule[1], /pointer: coarse/);
  assert.match(rule[1], /height/);
});

test('the generic viewport helpers stay width-only, deliberately', () => {
  // .juno-hide-below-md and friends mean "hide at this width" and are the
  // consumer's own escape hatch; making them pointer-aware would silently
  // change what a consumer asked for by name.
  const helper = /@media \(width <= 767\.98px\) \{ \.juno-hide-below-md/.exec(css);
  assert.ok(helper, 'the width helpers changed shape — they are meant to stay literal');
});
