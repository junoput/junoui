// Viewport orientation gizmo (X3 / 20260829-023) — the parts checkable without
// a layout engine. Keyboard traversal and the derived diameter are measured in
// test/visual/gizmo.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { bearingLabel, normalizeBearing, orientationLabel } from '../tools/gizmo.mjs';

const css = readFileSync('dist/css/juno.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '\n');
const manifest = JSON.parse(readFileSync('dist/classes.json', 'utf8'));
const showcase = readFileSync('showcase/layout.html', 'utf8');

const rule = (selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  assert.ok(m, `no \`${selector}\` rule in the bundle`);
  return m[1];
};

test('the bundle and the showcase are actually read', () => {
  assert.ok(css.length > 1000);
  assert.ok(showcase.includes('juno-gizmo'), 'the showcase has no gizmo to check');
});

// ── the bearing language ─────────────────────────────────────────────────
// The reason the component is upstream: "N" is a letter, not an accessible
// name. This is pure and total, so it is checked exhaustively rather than
// sampled.

test('every angle in a full turn has a bearing word', () => {
  // Total over the whole domain. The naive implementation, round(deg / 22.5),
  // returns index 16 above 348.75 and reads off the end of the table — which
  // is undefined for eleven degrees of every circle, all of them "north".
  for (let d = 0; d < 360; d += 0.25) {
    const label = bearingLabel(d);
    assert.equal(typeof label, 'string', `no label at ${d}°`);
    assert.ok(label.length > 2, `degenerate label at ${d}°: ${label}`);
  }
});

test('the cardinal and intercardinal points say what they should', () => {
  assert.equal(bearingLabel(0), 'north');
  assert.equal(bearingLabel(45), 'north-east');
  assert.equal(bearingLabel(90), 'east');
  assert.equal(bearingLabel(180), 'south');
  assert.equal(bearingLabel(270), 'west');
  assert.equal(bearingLabel(315), 'north-west');
});

test('the wrap at north is handled from both sides', () => {
  // The boundary the naive version gets wrong: a sector is 22.5° wide, so
  // north runs 348.75..360 and 0..11.25.
  assert.equal(bearingLabel(359.9), 'north');
  assert.equal(bearingLabel(349), 'north');
  assert.equal(bearingLabel(11), 'north');
  assert.equal(bearingLabel(12), 'north-north-east');
});

test('angles outside a turn normalise rather than break', () => {
  // A camera yaw accumulates; it arrives as 725° or -45° and neither is an
  // error the widget should show.
  assert.equal(normalizeBearing(-90), 270);
  assert.equal(normalizeBearing(450), 90);
  assert.equal(bearingLabel(-45), 'north-west');
  assert.equal(bearingLabel(725), 'north'); // 725 - 720 = 5°
  assert.equal(bearingLabel(810), 'east'); // 810 - 720 = 90°
});

test('the spoken label gives direction AND degrees, and tilt when there is one', () => {
  // A rotating needle announces nothing, and a bare number is one the listener
  // has to convert. Both halves, in words.
  assert.equal(orientationLabel(45, 35), 'Facing north-east, 45 degrees. Tilted 35 degrees.');
  assert.equal(orientationLabel(0), 'Facing north, 0 degrees.');
  // rounded for speech — a listener does not want 37.4
  assert.match(orientationLabel(37.4), /37 degrees/);
  assert.match(orientationLabel(37.6), /38 degrees/);
});

// ── structure ────────────────────────────────────────────────────────────

test('every gizmo class is in the manifest and documented', () => {
  const g = manifest.all.filter((c) => c.startsWith('juno-gizmo'));
  assert.ok(g.length >= 6, `only ${g.length} gizmo classes`);
  assert.deepEqual(
    g.filter((c) => !manifest.public.includes(c)),
    [],
    'gizmo classes with rules but no documentation',
  );
});

test('the ring diameter is derived from the tap floor, not chosen', () => {
  // The whole point: --juno-size-tap-min moves from 24 to 44 on a coarse
  // pointer, and a hard-coded diameter puts eight overlapping targets on a
  // phone. 8 marks 45° apart => arc between centres is pi*d/8 >= one target.
  const root = rule('.juno-gizmo');
  assert.match(root, /--juno-gizmo-size:\s*max\(/, 'the size is not a floor');
  assert.match(root, /var\(--juno-gizmo-marks\)/);
  assert.match(root, /var\(--juno-size-tap-min\)/);
  // sin(), because the constraint is the CHORD between adjacent centres, not
  // the arc. Sizing off the arc (N * tap / pi) under-sizes the ring: at N=8
  // and a 44px target it gives 112.05px, whose chord is 42.9px — every pair of
  // neighbours overlapping by 1.1px on a coarse pointer. The browser guard
  // measured that; this pins the corrected form so it cannot drift back.
  assert.match(root, /sin\(/, 'the derivation is not using the chord');
  assert.ok(!/3\.14159/.test(root), 'the arc form is back');
});

test('the marks size themselves off the tap floor too', () => {
  for (const sel of ['.juno-gizmo__mark', '.juno-gizmo__center']) {
    const body = rule(sel);
    assert.match(body, /inline-size:\s*var\(--juno-size-tap-min\)/, `${sel} has a fixed width`);
    assert.match(body, /block-size:\s*var\(--juno-size-tap-min\)/, `${sel} has a fixed height`);
  }
});

test('the pitch arc is clamped', () => {
  // A camera that tilts 0..85° must not show a hand that points anywhere, or
  // the widget lies about what the app will accept.
  assert.match(rule('.juno-gizmo__arc'), /--juno-gizmo-pitch-min:/);
  assert.match(rule('.juno-gizmo__arc'), /--juno-gizmo-pitch-max:/);
  assert.match(rule('.juno-gizmo__arc-hand'), /rotate:\s*clamp\(/);
});

test('snap motion runs on the motion scale', () => {
  // So prefers-reduced-motion collapses it through the base layer, without a
  // component-local media query that could disagree with it.
  for (const sel of ['.juno-gizmo__needle', '.juno-gizmo__arc-hand']) {
    assert.match(rule(sel), /var\(--juno-motion-scale\)/, `${sel} ignores the motion scale`);
  }
});

// ── the a11y contract, against the showcase markup ───────────────────────

test('the snap targets are real buttons with real names', () => {
  // A button is focusable, activates on Enter AND Space, is announced as a
  // control, and works in a screen reader's forms mode. A div with a click
  // handler is none of those.
  const marks = [...showcase.matchAll(/<(\w+) class="juno-gizmo__mark"([^>]*)>/g)];
  assert.ok(marks.length >= 8, `only ${marks.length} marks in the showcase`);
  for (const [, tag, attrs] of marks) {
    assert.equal(tag, 'button', 'a snap target is not a button');
    // "N" is a letter, not an accessible name.
    const label = /aria-label="([^"]+)"/.exec(attrs)?.[1];
    assert.ok(label, `mark without an accessible name: ${attrs.trim()}`);
    assert.ok(label.length > 3, `mark named with a compass letter: ${label}`);
  }
});

test('the readout is a live region, and says both angles', () => {
  const m = /<p class="juno-gizmo__readout"([^>]*)>([^<]*)</.exec(showcase);
  assert.ok(m, 'no readout in the showcase');
  assert.match(m[1], /aria-live="polite"/);
  assert.match(m[2], /Facing [a-z-]+, \d+ degrees/);
  assert.match(m[2], /Tilted \d+ degrees/);
});

test('the root is a named group and the decoration is hidden', () => {
  const root = /<div class="juno-gizmo"([^>]*)>/.exec(showcase)?.[1] ?? '';
  assert.match(root, /role="group"/);
  assert.match(root, /aria-label="[^"]+"/);
  // needle and arc hand say nothing and must not be walked into
  for (const [, attrs] of showcase.matchAll(
    /<span class="juno-gizmo__(?:needle|arc-hand)"([^>]*)>/g,
  )) {
    assert.match(attrs, /aria-hidden="true"/);
  }
});

test('the current mark is stated with aria-current, not a class', () => {
  // The app has to say it for the screen reader anyway; a modifier class would
  // be a second copy of the same fact, free to disagree.
  assert.match(showcase, /class="juno-gizmo__mark"[^>]*aria-current="true"/);
  assert.ok(!/juno-gizmo__mark--(?:current|active|on)/.test(css), 'a current-state class exists');
  assert.match(css, /\.juno-gizmo__mark\[aria-current=['"]true['"]\]/);
});
