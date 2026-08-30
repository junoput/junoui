// ════════════════════════════════════════════════════════════════════════
//  junoui — the tappable surfaces, declared once
// ════════════════════════════════════════════════════════════════════════
//  THE source of truth for "this is one of junoui's own tappable components".
//  scripts/bundle-css.mjs generates the touch-default rules from it, so the
//  class names exist in exactly one place and a member cannot be misspelled
//  into silence.
//
//  WHY THIS FILE EXISTS. base.css used to carry two hand-maintained `:where()`
//  lists, and both had drifted:
//
//    - from the CLASSES: `.juno-seg__option` (the shipped class is
//      `.juno-seg__opt`) and `.juno-list__item` (it is `.juno-list__row`) sat
//      in them. `:where()` matched nothing, the rule still parsed, every other
//      member kept working — so every segmented control and every grouped list
//      row in every consumer kept the ~300ms double-tap delay. Invisible to
//      lint, to the build and to a screenshot (20260826-024).
//    - from EACH OTHER: the tap-highlight list was a strict subset of the
//      touch-action one, missing __overflow, __opt, chip and toggle-btn, with
//      nothing recording whether that was a decision.
//
//  ONE SET, NOT TWO — the open question from docs/conformance-kit.md, decided
//  on the rules' own rationales rather than by merging them for tidiness. The
//  tap-highlight rule exists so a UA square "never flashes past a rounded
//  control on tap"; every name the shorter list omitted is a rounded tappable
//  (`.juno-chip` and `.juno-pillbar__overflow` are 999px pills,
//  `.juno-seg__opt` and `.juno-toggle-btn` carry radius-3). The omission has no
//  stated reason and the rationale covers them, so it was an omission and not a
//  decision. Both properties answer the same question — "is this one of ours,
//  and is it tapped?" — and now read the same answer.
//
//  Adding a component here is the whole opt-in: state the class once, get both
//  defaults. test/classes.test.mjs asserts every member is a class some
//  component file actually defines, so a typo fails the build rather than
//  going quiet.
// ════════════════════════════════════════════════════════════════════════

export const TOUCH_SURFACES = [
  'juno-btn',
  'juno-chip',
  'juno-dock__item',
  'juno-list__row',
  'juno-menu__item',
  'juno-pillbar__item',
  'juno-pillbar__overflow',
  'juno-seg__opt',
  'juno-tabs__tab',
  'juno-toggle-btn',
  'juno-tree__row',
  'juno-gizmo__mark',
  'juno-gizmo__center',
  'juno-swatch--button',
  'juno-palette__option',
];

/** The `:where()` selector list, formatted for the bundle. */
export function whereList(indent = '') {
  return `:where(\n${TOUCH_SURFACES.map((c) => `${indent}  .${c}`).join(',\n')}\n${indent})`;
}

/** The generated touch-default layer.
 *
 *  Two rules, one member list. `touch-action` is NOT inside the coarse block:
 *  a hybrid device (touch laptop, iPad with a trackpad) reports a fine primary
 *  pointer while still taking touch input, and the property is inert on a
 *  mouse anyway. The tap highlight only exists on touch, so it is.
 *
 *  `:where()` contributes zero specificity by design — these are defaults a
 *  component or a consumer overrides by simply declaring the property. */
export function touchDefaultsCss() {
  return `/* GENERATED from src/css/touch-surfaces.mjs — do not edit here.
 *
 * Tappable primitives opt out of double-tap-to-zoom. A browser that still
 * recognises that gesture has to WAIT after the first tap to see whether a
 * second one is coming, which reads as a late, mushy tap on exactly the
 * surfaces a phone UI is built from. \`manipulation\` keeps panning and
 * pinch-zoom (so the page stays zoomable — never \`none\` here, that would be an
 * a11y regression) and drops only the double-tap.
 * Community convention — no primary Apple/WebKit source names it; see
 * docs/ios-conformance.md. Named components only, so a consumer's own elements
 * are untouched. See 20260803-038. */
${whereList()} {
  touch-action: manipulation;
}

/* And on touch, kill the UA tap-highlight square so it never flashes past a
 * rounded control. Consumers were adding this by hand per component; it is a
 * first-class touch default. See 20260802-020. */
@media (pointer: coarse) {
${whereList('  ')} {
    -webkit-tap-highlight-color: transparent;
  }
}
`;
}
