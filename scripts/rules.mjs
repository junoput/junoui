// ════════════════════════════════════════════════════════════════════════
//  The rules a PAINTED consumer cannot call — defined once, emitted twice
// ════════════════════════════════════════════════════════════════════════
//
//  junoui is CSS and DOM. A consumer that draws its UI into a canvas or a GPU
//  frame gets the token VALUES (juno_tokens.rs) and nothing else: a media query
//  is not available to a render loop, `text-shadow` has no painter equivalent,
//  and `min-block-size` is not something you set on a circle you are about to
//  draw.
//
//  So it re-derives. On 2026-09-01 one consumer independently re-derived three
//  rules this library already knew — the coarse-pointer separation, the
//  tilt-degeneracy of a fixed quantity against a projected axis, and that ink
//  over unknown backing needs its own ground (20260901-051, docs/painted-ui.md).
//
//  Each of those has a PURE-FUNCTION core. This file is that core, and it is
//  the only place it exists. `tools/pointer-first.mjs` re-exports from here,
//  and `dist/rust/juno_rules.rs` is generated from here — including its tests,
//  which are generated from the same CASES table the JS tests run. Two
//  implementations that agree today and drift tomorrow is the failure this
//  file is shaped to prevent, so agreement is not asserted in prose.
//
//  WHAT DOES NOT BELONG HERE: anything that needs a DOM, a cascade, or a
//  layout box. If it cannot be computed from numbers, a painted consumer
//  cannot call it either.

// ── rule 1: three questions, three predicates ───────────────────────────
// Conflating them is the defect: a reduced field list keyed on "portrait AND
// coarse" leaves a narrow desktop window overflowing, because WIDTH is what
// decides whether text fits and it was never consulted.

/** A viewport this short is a phone on its side, whatever its width. */
export const SHORT_MAX_PX = 500;

/** `md - 0.02` — the same boundary the width scale uses. */
export const NARROW_MAX_PX = 767.98;

/** Navigation SHAPE: rail or dock. Coarse **and** (narrow **or** short).
 *
 *  The `or short` is the whole point. A landscape phone is 844 wide — above
 *  `md` — and still a phone; a width-only test hides the rail and shows
 *  nothing in its place. */
export function wantsCompactNav({ width, height, coarse }) {
  return Boolean(coarse) && (width <= NARROW_MAX_PX || height <= SHORT_MAX_PX);
}

/** Tap ERGONOMICS: how big a target must be. A different question from the
 *  one above, and answered by the pointer alone — a desktop window narrowed to
 *  400px is still driven by a mouse. */
export function tapMin({ coarse, tapMinPx, tapComfortablePx }) {
  return coarse ? tapComfortablePx : tapMinPx;
}

// ── rule 2: a fixed quantity against a projected axis is degenerate ─────
// A ring under camera tilt is an ellipse whose vertical semi-axis is
// sin(pitch) times its horizontal one; it collapses toward a LINE. Anything
// constant against that is right at one tilt and wrong at another.

/** Smallest ring diameter at which `marks` evenly-spaced targets each clear
 *  the tap floor.
 *
 *  Adjacent centres on a circle of diameter d are `d * sin(pi / marks)` apart,
 *  so `d >= tap / sin(pi / marks)`; the extra `tap` is the target's own width,
 *  half of it overhanging at each end. Derived from the constraint rather than
 *  tuned at one mark count — which is the rule, not just the formula. */
export function ringDiameterForMarks({ marks, tapPx }) {
  return tapPx * (1 / Math.sin(Math.PI / marks) + 1);
}

/** How many of `marks` labels still clear each other once the ring is squashed
 *  to `ratio` (1 = face-on, 0 = edge-on).
 *
 *  Returns `marks` or, when adjacent labels have closed up, the largest
 *  power-of-two division of it that still clears — 8 marks fall back to 4
 *  (the cardinals), never to 6. Labels are closest near the horizontal
 *  extremes, where one step moves a label `(1-cos t)` across and
 *  `sin t * ratio` up; that separation is what is compared to `glyphPx`. */
export function labelsThatClear({ marks, ratio, radiusPx, glyphPx }) {
  let n = marks;
  while (n > 2) {
    const t = (2 * Math.PI) / n;
    const dx = (1 - Math.cos(t)) * radiusPx;
    const dy = Math.sin(t) * radiusPx * ratio;
    if (Math.hypot(dx, dy) >= glyphPx) return n;
    n = Math.floor(n / 2);
  }
  return n;
}

// ── rule 3: ink over unknown backing needs its own ground ──────────────
// No colour survives both a glacier and dark aerial imagery. Tuning the grey
// chooses which extreme to fail on.

/** The four halo offsets, in the order the CSS declares them.
 *
 *  HARD OFFSETS, NOT A BLUR: a blurred shadow spreads the same ink thinner and
 *  barely moves the contrast floor. And the width is scaled to the glyph —
 *  2pt of outline around a 10pt label closes the counters and the label reads
 *  as a smudge, which is a round that gets spent every time this is
 *  re-derived. `referencePx` is the size the token width was chosen at. */
export function haloOffsets({ fontPx, haloWidthPx, referencePx = 16 }) {
  const w = (haloWidthPx * fontPx) / referencePx;
  return [
    [w, 0],
    [-w, 0],
    [0, w],
    [0, -w],
  ];
}

// ── the shared case table ───────────────────────────────────────────────
// Run by the JS tests AND emitted into the Rust as #[test] bodies, so the two
// implementations are checked against the same numbers rather than against
// each other's reputation. Adding a case here covers both targets at once;
// there is no way to cover one and miss the other.
export const CASES = {
  wantsCompactNav: [
    { in: { width: 390, height: 844, coarse: true }, out: true, why: 'portrait phone' },
    {
      in: { width: 844, height: 390, coarse: true },
      out: true,
      why: 'LANDSCAPE PHONE — wider than md, still a phone',
    },
    { in: { width: 1440, height: 900, coarse: false }, out: false, why: 'desktop' },
    {
      in: { width: 400, height: 900, coarse: false },
      out: false,
      why: 'narrow DESKTOP window — narrow is not a phone',
    },
    {
      in: { width: 834, height: 1112, coarse: true },
      out: false,
      why: 'tablet portrait: coarse but neither narrow nor short',
    },
    {
      in: { width: 767.98, height: 900, coarse: true },
      out: true,
      why: 'exactly at the narrow bound, inclusive',
    },
    { in: { width: 768, height: 900, coarse: true }, out: false, why: 'one hundredth past it' },
    {
      in: { width: 900, height: 500, coarse: true },
      out: true,
      why: 'exactly at the short bound, inclusive',
    },
  ],
  tapMin: [
    { in: { coarse: false, tapMinPx: 24, tapComfortablePx: 44 }, out: 24 },
    { in: { coarse: true, tapMinPx: 24, tapComfortablePx: 44 }, out: 44 },
  ],
  ringDiameterForMarks: [
    { in: { marks: 8, tapPx: 44 }, out: 158.98, why: 'the shipped gizmo' },
    { in: { marks: 4, tapPx: 44 }, out: 106.23 },
    {
      in: { marks: 16, tapPx: 44 },
      out: 269.54,
      why: 'grows superlinearly — the reason a fixed size is wrong',
    },
  ],
  labelsThatClear: [
    { in: { marks: 8, ratio: 1, radiusPx: 34, glyphPx: 10 }, out: 8, why: 'face-on: all eight' },
    {
      in: { marks: 8, ratio: 0.64, radiusPx: 34, glyphPx: 10 },
      out: 8,
      why: 'moderate tilt still clears',
    },
    {
      in: { marks: 8, ratio: 0.4226, radiusPx: 18, glyphPx: 10 },
      out: 4,
      why: 'THE MEASURED CASE: 25deg pitch, semi-axis 18, 10px glyphs — eight collide, four do not',
    },
    {
      in: { marks: 8, ratio: 0.1, radiusPx: 34, glyphPx: 10 },
      out: 8,
      why: 'a LARGER ring survives a flatter tilt (10.25px apart) — the answer depends on radius, not tilt alone',
    },
    {
      in: { marks: 8, ratio: 0.0, radiusPx: 34, glyphPx: 10 },
      out: 4,
      why: 'fully collapsed — never divides below the cardinals',
    },
  ],
  haloOffsets: [
    {
      in: { fontPx: 16, haloWidthPx: 2, referencePx: 16 },
      out: [
        [2, 0],
        [-2, 0],
        [0, 2],
        [0, -2],
      ],
    },
    {
      in: { fontPx: 10, haloWidthPx: 2, referencePx: 16 },
      out: [
        [1.25, 0],
        [-1.25, 0],
        [0, 1.25],
        [0, -1.25],
      ],
      why: 'scaled DOWN — a 2px halo on a 10px glyph closes the counters',
    },
  ],
};
