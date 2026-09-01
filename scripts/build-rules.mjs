#!/usr/bin/env node
// Emit dist/rust/juno_rules.rs from scripts/rules.mjs.
//
// The rules a painted consumer cannot call, as pure Rust functions — AND their
// tests, generated from the same CASES table the JS tests run. That is the
// whole design: two implementations checked against one set of numbers, so
// there is no way to cover one target and miss the other. A second copy that
// agrees today is exactly what this file exists to prevent.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { CASES } from './rules.mjs';

const OUT = 'dist/rust/juno_rules.rs';

// Token values are not restated here: they are read out of the emitted token
// target, so a token change reaches this file through the same build. A test
// asserts they still agree, because reading a file is not the same as staying
// in step with it.
const tokens = readFileSync('dist/rust/juno_tokens.rs', 'utf8');
const tok = (name) => {
  const m = new RegExp(`pub const ${name}: f32 = ([0-9.]+);`).exec(tokens);
  if (!m) throw new Error(`build-rules: juno_tokens.rs has no ${name}`);
  return m[1];
};

const f = (n) => (Number.isInteger(n) ? `${n}.0` : `${n}`);
const b = (v) => (v ? 'true' : 'false');

const testsFor = (name, render) =>
  CASES[name].map((c, i) => `        // ${c.why ?? ''}\n        ${render(c)}`).join('\n');

// What the generated tests will assert, counted from the table itself.
const assertionCount = Object.values(CASES)
  .flat()
  .reduce((n, c) => n + (Array.isArray(c.out) ? c.out.length * 2 : 1), 0);

const src = `// junoui rules — Rust. Generated; do not edit.
//
// Regenerate with \`npm run build\` in the junoui repo.
//
// WHY THIS FILE EXISTS. junoui is CSS and DOM. A consumer that DRAWS its UI —
// canvas, egui, wgpu — gets the token values from juno_tokens.rs and nothing
// else: a media query is not available to a render loop, \`text-shadow\` has no
// painter equivalent, and \`min-block-size\` is not something you set on a
// circle you are about to draw. So it re-derives, and on 2026-09-01 one
// consumer re-derived three rules this library already knew, in one day
// (20260901-051).
//
// These are those rules, as functions. Each has a JS twin in
// scripts/rules.mjs, and the tests at the bottom are GENERATED FROM THE SAME
// CASE TABLE the JS tests run — two implementations checked against one set of
// numbers rather than against each other.
//
// WHAT IS NOT HERE: anything needing a DOM, a cascade or a layout box. If it
// cannot be computed from numbers, you cannot call it either.
#![allow(dead_code)]

// ── rule 1: three questions, three predicates ───────────────────────────
// Conflating them is the defect. A reduced field list keyed on "portrait AND
// coarse" leaves a narrow desktop window overflowing, because WIDTH is what
// decides whether text fits and it was never consulted.

/// A viewport this short is a phone on its side, whatever its width.
pub const SHORT_MAX_PX: f32 = 500.0;

/// \`md - 0.02\` — the same boundary the width scale uses.
pub const NARROW_MAX_PX: f32 = 767.98;

/// Navigation SHAPE: rail or dock. Coarse **and** (narrow **or** short).
///
/// The \`or short\` is the whole point. A landscape phone is 844 wide — above
/// \`md\` — and still a phone; a width-only test hides the rail and shows
/// nothing in its place.
pub fn wants_compact_nav(width: f32, height: f32, coarse: bool) -> bool {
    coarse && (width <= NARROW_MAX_PX || height <= SHORT_MAX_PX)
}

/// Tap ERGONOMICS: how big a target must be. A different question, answered by
/// the pointer alone — a desktop window narrowed to 400px is still a mouse.
pub fn tap_min(coarse: bool) -> f32 {
    if coarse {
        ${tok('SIZE_TAP_COMFORTABLE')}
    } else {
        ${tok('SIZE_TAP_MIN')}
    }
}

// ── rule 2: a fixed quantity against a projected axis is degenerate ─────
// A ring under camera tilt is an ellipse whose vertical semi-axis is
// sin(pitch) times its horizontal one; it collapses toward a LINE. Anything
// constant against that is right at one tilt and wrong at another.

/// Smallest ring diameter at which \`marks\` evenly-spaced targets each clear
/// the tap floor.
///
/// Adjacent centres on a circle of diameter d are \`d * sin(pi / marks)\`
/// apart, so \`d >= tap / sin(pi / marks)\`; the extra \`tap\` is the target's
/// own width, half overhanging at each end.
pub fn ring_diameter_for_marks(marks: u32, tap_px: f32) -> f32 {
    tap_px * (1.0 / (std::f32::consts::PI / marks as f32).sin() + 1.0)
}

/// How many of \`marks\` labels still clear each other once the ring is squashed
/// to \`ratio\` (1 = face-on, 0 = edge-on).
///
/// Returns \`marks\`, or the largest power-of-two division of it that still
/// clears — 8 falls back to 4 (the cardinals), never to 6. Labels are closest
/// near the horizontal extremes, where one step moves a label \`(1-cos t)\`
/// across and \`sin t * ratio\` up.
pub fn labels_that_clear(marks: u32, ratio: f32, radius_px: f32, glyph_px: f32) -> u32 {
    let mut n = marks;
    while n > 2 {
        let t = std::f32::consts::TAU / n as f32;
        let dx = (1.0 - t.cos()) * radius_px;
        let dy = t.sin() * radius_px * ratio;
        if dx.hypot(dy) >= glyph_px {
            return n;
        }
        n /= 2;
    }
    n
}

// ── rule 3: ink over unknown backing needs its own ground ──────────────
// No colour survives both a glacier and dark aerial imagery. Tuning the grey
// chooses which extreme to fail on.

/// The four halo offsets, in the order the CSS declares them.
///
/// HARD OFFSETS, NOT A BLUR: a blurred shadow spreads the same ink thinner and
/// barely moves the contrast floor. The width scales with the glyph — 2pt of
/// outline around a 10pt label closes the counters and the label reads as a
/// smudge. \`reference_px\` is the size the token width was chosen at.
pub fn halo_offsets(font_px: f32, halo_width_px: f32, reference_px: f32) -> [(f32, f32); 4] {
    let w = halo_width_px * font_px / reference_px;
    [(w, 0.0), (-w, 0.0), (0.0, w), (0.0, -w)]
}

/// The shipped halo width, at the size it was chosen for.
pub const INK_CANVAS_HALO_WIDTH: f32 = ${tok('INK_CANVAS_HALO_WIDTH')};
pub const INK_CANVAS_HALO_REFERENCE_PX: f32 = 16.0;

// ════════════════════════════════════════════════════════════════════════
//  Generated from scripts/rules.mjs CASES — the same table the JS tests run.
//  Do not add a case here; add it there and both targets get it.
//
//  generated-assertions: ${assertionCount}
//  Stated by the generator rather than counted by a regex on the far side: the
//  first version of that count matched the helper's own \`fn close(\` and was
//  off by one, which is a guard reporting on its own parser.
// ════════════════════════════════════════════════════════════════════════
#[cfg(test)]
mod tests {
    use super::*;

    fn close(a: f32, b: f32) {
        assert!((a - b).abs() < 0.01, "{a} != {b}");
    }

    #[test]
    fn wants_compact_nav_cases() {
${testsFor('wantsCompactNav', (c) => `assert_eq!(wants_compact_nav(${f(c.in.width)}, ${f(c.in.height)}, ${b(c.in.coarse)}), ${b(c.out)});`)}
    }

    #[test]
    fn tap_min_cases() {
${testsFor('tapMin', (c) => `close(tap_min(${b(c.in.coarse)}), ${f(c.out)});`)}
    }

    #[test]
    fn ring_diameter_cases() {
${testsFor('ringDiameterForMarks', (c) => `close(ring_diameter_for_marks(${c.in.marks}, ${f(c.in.tapPx)}), ${f(c.out)});`)}
    }

    #[test]
    fn labels_that_clear_cases() {
${testsFor('labelsThatClear', (c) => `assert_eq!(labels_that_clear(${c.in.marks}, ${f(c.in.ratio)}, ${f(c.in.radiusPx)}, ${f(c.in.glyphPx)}), ${c.out});`)}
    }

    #[test]
    fn halo_offsets_cases() {
${testsFor('haloOffsets', (c) => `{ let o = halo_offsets(${f(c.in.fontPx)}, ${f(c.in.haloWidthPx)}, ${f(c.in.referencePx)}); ${c.out.map((pair, i) => `close(o[${i}].0, ${f(pair[0])}); close(o[${i}].1, ${f(pair[1])});`).join(' ')} }`)}
    }
}
`;

mkdirSync('dist/rust', { recursive: true });
writeFileSync(OUT, src);
console.log(`rules: ${OUT} (${Object.values(CASES).flat().length} generated cases)`);
