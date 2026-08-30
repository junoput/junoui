// Canvas ink (X4 / 20260829-024) — the halo pair, checked as a CONTRAST
// PROPERTY rather than as a token declaration.
//
// The ticket's argument is that over arbitrary imagery no contrast ratio can
// be asserted about a single ink colour, because a black shadow and a snowfield
// are adjacent pixels in the same orthophoto. So asserting "the token is
// #FFFFFF" would prove nothing at all — it would restate the value and call it
// a check. What has to hold is a property of the PAIR:
//
//   for ANY backing luminance, at least one of {ink, halo} reaches a legible
//   ratio against it, and the two are separable from each other
//
// which is what this file measures, by sweeping the backing rather than
// sampling two endpoints. The endpoints are the easy cases; the interesting
// failure is a mid-grey backing where a badly-chosen pair loses both halves at
// once.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { toHex } from '../scripts/color.mjs';

const tokens = JSON.parse(readFileSync('dist/json/tokens.json', 'utf8'));
const css = readFileSync('dist/css/juno.css', 'utf8');

const ink = tokens.ink.canvas;
const vivid = tokens.ink.vivid;

// ── WCAG 2.2 relative luminance and contrast, from the spec ──────────────
// Written out rather than imported: this is the definition the claim rests
// on, and a wrapper around junoui's own colour code would be checking the
// build with the build.
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const INK = toHex(ink.ink.$value);
const HALO = toHex(ink.halo.$value);

// WCAG 2.2: 4.5:1 is AA for body text, 3:1 is AA for large text and for
// non-text contrast (1.4.11), which is what a measurement line is.
const AA_TEXT = 4.5;
const AA_NONTEXT = 3;

test('the contrast maths agrees with known values', () => {
  // The instrument before the reading. Black on white is 21:1 exactly, and a
  // colour against itself is 1:1 — if these are wrong every number below is
  // decoration.
  assert.equal(Math.round(contrast('#000000', '#FFFFFF')), 21);
  assert.equal(Math.round(contrast('#FFFFFF', '#FFFFFF')), 1);
  // #767676 on white is the canonical 4.54:1 boundary case from the WCAG
  // materials — it passes AA, and 1px darker would too, so this pins the
  // curve and not just the endpoints.
  assert.ok(Math.abs(contrast('#767676', '#FFFFFF') - 4.54) < 0.05);
});

test('the ink and the halo are separable from each other', () => {
  // The glyph has to read against its own outline, or the halo swallows it.
  // AAA (7:1) rather than AA here: this pair is doing the whole job at small
  // sizes over a moving background.
  assert.ok(
    contrast(INK, HALO) >= 7,
    `ink vs halo is ${contrast(INK, HALO).toFixed(2)}:1, want >= 7`,
  );
});

test('one half of the pair survives EVERY backing, not just the extremes', () => {
  // The sweep. A pair can pass "over black" and "over white" and still fail
  // over a mid grey, which is most of a satellite image.
  const failures = [];
  for (let v = 0; v <= 255; v++) {
    const backing = '#' + v.toString(16).padStart(2, '0').repeat(3).toUpperCase();
    const best = Math.max(contrast(INK, backing), contrast(HALO, backing));
    if (best < AA_TEXT) failures.push(`${backing}: best ${best.toFixed(2)}:1`);
  }
  assert.deepEqual(
    failures,
    [],
    `${failures.length} of 256 grey backings leave both halves below ${AA_TEXT}:1`,
  );
});

test('the extremes are carried by the half that should carry them', () => {
  // Named because it is the claim the design makes: near-black backing is the
  // ink's job, near-white is the halo's. A pair that passed the sweep with the
  // roles reversed would be a different design and worth noticing.
  assert.ok(contrast(INK, '#000000') >= AA_TEXT, 'ink fails over black');
  assert.ok(contrast(INK, '#0A0A0A') >= AA_TEXT, 'ink fails over near-black');
  assert.ok(contrast(HALO, '#FFFFFF') >= AA_TEXT, 'halo fails over white');
  assert.ok(contrast(HALO, '#F2F2F2') >= AA_TEXT, 'halo fails over near-white');
});

test('the pair spans enough of the luminance range to be a pair', () => {
  // The structural reason the sweep passes: the two are near the ends. Stated
  // separately so a future edit that narrows them fails HERE, with a readable
  // reason, rather than as an opaque failure of the sweep.
  assert.ok(luminance(INK) > 0.8, `ink luminance ${luminance(INK).toFixed(3)} is not near-white`);
  assert.ok(
    luminance(HALO) < 0.05,
    `halo luminance ${luminance(HALO).toFixed(3)} is not near-black`,
  );
});

test('the vivid role hues stay legible over canvas with the halo', () => {
  // These replace the ink colour, so they inherit the halo but not the ink's
  // luminance. Each must clear non-text AA against the halo it sits on — a
  // status colour that disappears into its own outline is worse than no
  // status colour.
  const weak = [];
  for (const [role, t] of Object.entries(vivid)) {
    if (!t || typeof t !== 'object' || t.$value === undefined) continue;
    const hex = toHex(t.$value);
    const c = contrast(hex, HALO);
    if (c < AA_NONTEXT) weak.push(`${role} (${hex}) vs halo: ${c.toFixed(2)}:1`);
  }
  assert.deepEqual(weak, [], `vivid roles below ${AA_NONTEXT}:1 against the halo`);
});

test('the vivid hues are actually more chromatic than the themed ones', () => {
  // Otherwise the group is a second name for the same colours, and the
  // "washes out over a saturated backdrop" problem is unaddressed.
  const chroma = (v) => parseFloat(/oklch\(\s*[\d.]+%?\s+([\d.]+)/.exec(v)?.[1] ?? '0');
  const themed = tokens.color.standard.dark;
  const flat = [];
  for (const role of Object.keys(vivid)) {
    if (!themed[role]?.$value) continue;
    flat.push([role, chroma(vivid[role].$value), chroma(themed[role].$value)]);
  }
  assert.ok(flat.length >= 4, `only ${flat.length} comparable roles`);
  for (const [role, v, t] of flat) {
    assert.ok(v > t, `ink.vivid.${role} chroma ${v} is not above the themed ${t}`);
  }
});

test('the scrim is distinct from the modal scrim, and lighter', () => {
  // The ticket's third ask. 0.62 suppresses a modal's background; over live
  // content the background is the thing being annotated.
  const modal = tokens.opacity.scrim.$value;
  assert.ok(
    ink.scrim.$value < modal,
    `canvas scrim ${ink.scrim.$value} is not lighter than ${modal}`,
  );
  assert.notEqual(ink.scrim.$value, modal);
});

test('the pair ships as CSS a consumer can apply, not just as tokens', () => {
  // A token nobody can spend is a token that gets reimplemented. The class has
  // to carry BOTH halves or it is the single-colour approach again.
  const rule = /\.juno-canvas-ink\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
  assert.ok(rule, 'no .juno-canvas-ink rule in the bundle');
  assert.match(rule, /color:\s*var\(--juno-ink-canvas-ink\)/);

  // ALL FOUR offsets, not "the halo appears somewhere in the rule". A
  // mutation that painted one of the four `transparent` survived that weaker
  // check: the glyph then loses its outline on one side, which over imagery
  // is where the contrast was coming from. Four offsets rather than one
  // blurred shadow because a blur fades at the glyph's corners, exactly where
  // a thin stroke needs the most help.
  const shadow = /text-shadow:([^;]*);/.exec(rule)?.[1] ?? '';
  assert.ok(shadow, 'no text-shadow on .juno-canvas-ink');
  assert.equal(
    [...shadow.matchAll(/var\(--juno-ink-canvas-halo\)/g)].length,
    4,
    'the halo does not cover all four offsets',
  );
  assert.ok(!/transparent|none/.test(shadow), 'part of the halo is painted with no colour');
  // and the vector half, which is a different mechanism for the same pair
  assert.match(css, /\.juno-canvas-ink__halo\s*\{[^}]*var\(--juno-ink-canvas-halo\)/);
  assert.match(css, /\.juno-canvas-ink__stroke\s*\{[^}]*var\(--juno-ink-canvas-ink\)/);
});

test('the ink pair is not themed', () => {
  // A satellite image does not get lighter because the user chose light mode.
  // If these ever appear under a [data-juno-mode] or palette selector, the
  // pair has started tracking the app's surface — which is precisely the
  // background it is not over.
  // Comments stripped first: the bundle's banner explains the theming
  // attributes in prose, and a scan that reads `[data-juno-palette] +
  // [data-juno-mode]` in a sentence as a selector then swallows everything up
  // to the next `}` — which is :root, where these tokens correctly live. That
  // false positive is what this line prevents.
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, ' ');
  for (const m of rules.matchAll(/\[data-juno-(?:mode|palette)[^{]*\{([^}]*)\}/g)) {
    assert.ok(
      !/--juno-ink-canvas-(?:ink|halo)\s*:/.test(m[1]),
      'the canvas ink pair is being redefined per theme',
    );
  }
});
