// ════════════════════════════════════════════════════════════════════════
//  junoui — the pointer-first conditions, stated once
// ════════════════════════════════════════════════════════════════════════
//  Conformance kit slice 3 (20260826-036, item C). Imported by the token
//  build (to emit the @custom-media names), by junoui's own CSS authoring,
//  and by the test suite — so the CSS literal and the JS string cannot say
//  different things.
//
//  It lives in tools/ rather than scripts/ for a packaging reason, not a
//  taste one: package.json `files` ships tools/ and does NOT ship scripts/,
//  so an export re-exporting from scripts/ would resolve in the repo and 404
//  in the tarball — the 0.4.0 defect exactly (RELEASING.md). Its own module
//  rather than exports from style-dictionary.config.mjs for the reason
//  tools/token-names would be: that config BUILDS on import.
//
//  ── THE DECISION, and the arithmetic behind it ────────────────────────
//
//  Open question C was whether the pointer-first condition is
//  `(pointer: coarse)` alone or needs a size term for coarse-pointer kiosks.
//  It needs one, and the answer falls out of measuring real devices rather
//  than picking a threshold:
//
//    portrait phone     390 x 844   narrow
//    landscape phone    844 x 390   NOT narrow, short      <- the defect
//    tablet portrait    834 x 1112  neither
//    tablet landscape   1112 x 834  neither
//    coarse kiosk      2560 x 1440  neither
//
//  A landscape iPhone is WIDER than md, which is why a width-only rail
//  switch serves it the desktop rail on a device held in two hands. Height
//  is the term that separates it: landscape phones run 320-430px tall,
//  tablets 768px and up. So the condition is
//
//      coarse AND (narrow OR short)
//
//  Portrait phone qualifies on narrow, landscape phone on short, and both
//  tablet orientations and the kiosk qualify on neither — which is correct:
//  a 27" touchscreen has room for a rail and a person standing at arm's
//  length, and giving it phone navigation would be the mirror of the bug
//  being fixed.
//
//  TWO CONDITIONS, NOT ONE, because they answer different questions:
//    - touch ergonomics (tap floors, hit areas) is `(pointer: coarse)` with
//      no size term at all — a finger is a finger on a kiosk too. That one
//      already governs base.css and is unchanged here.
//    - NAVIGATION SHAPE is this one. Conflating them is how a kiosk ends up
//      with a phone's dock, or a landscape phone with a desktop rail.
// ════════════════════════════════════════════════════════════════════════

// The two bounds and the predicate live in scripts/rules.mjs, which is also
// what generates dist/rust/juno_rules.rs. RE-EXPORTED, not restated: a painted
// consumer and a DOM consumer answering this question differently is the exact
// defect 20260901-051 is about, and two copies that agree today is how it
// starts.
//
//   SHORT_MAX_PX  — landscape phones are 320-430px tall, tablets start at 768;
//                   500 sits in the gap with room either side, so anything from
//                   ~460 to ~760 picks the same set. Not a per-device tuning.
//   NARROW_MAX_PX — the md breakpoint's `below` half, which junoui publishes.
export { SHORT_MAX_PX, NARROW_MAX_PX, wantsCompactNav } from '../scripts/rules.mjs';
import { SHORT_MAX_PX, NARROW_MAX_PX } from '../scripts/rules.mjs';

/** Touch ergonomics: a finger, whatever it is attached to. No size term. */
export const COARSE_POINTER = '(pointer: coarse)';

/** Navigation shape: a coarse pointer with phone-sized room in one axis. */
export const COMPACT_NAV = `(pointer: coarse) and ((width <= ${NARROW_MAX_PX}px) or (height <= ${SHORT_MAX_PX}px))`;

/** The `@custom-media` block, emitted into dist/css/juno-custom-media.css. */
export function customMediaBlock() {
  return `/* Pointer-first conditions (conformance kit slice 3).
   TOUCH ERGONOMICS — a finger is a finger, so no size term. Governs tap
   floors and hit areas.
   no postcss? write ${COARSE_POINTER} */
@custom-media --juno-coarse ${COARSE_POINTER};

/* NAVIGATION SHAPE — a coarse pointer with phone-sized room in one axis.
   A landscape phone (844x390) is WIDER than md, so a width-only switch
   serves it the desktop rail; height is the term that separates it from a
   tablet or a coarse-pointer kiosk. See docs/layout.md#pointer-first.
   no postcss? write ${COMPACT_NAV} */
@custom-media --juno-compact-nav ${COMPACT_NAV};
`;
}
