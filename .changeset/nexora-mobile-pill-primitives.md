---
'junoui': minor
---

Mobile pill / loading primitives — absorbed from an app that hand-rolled them
(nexora `feat/mobile-ui`), so the next consumer gets them plug-and-play. All
additive; a11y contract in `accessibility.md`.

- **Pillbar placement + input slot** — `.juno-pillbar--top-right` /
  `--top-left` / `--bottom-right` / `--bottom-left` pin the pill as a floating
  corner cluster (safe-area-clamped, keeps the blur/border/shadow) instead of
  the centered bottom bar. `.juno-pillbar__input` is a borderless in-pill
  search field held at a `max(16px, …)` font floor so iOS Safari never
  zoom-jumps on focus.
- **Dock pill variant** — `.juno-dock--pill` + `.juno-dock__bubble`: the
  full-width bar becomes a floating rounded pill with big glyphs in circular
  bubbles, labels hidden (each item then **requires** an `aria-label`), active
  reads as a bubble fill. Folds in the `--juno-icon-size` footgun fix (scoped).
- **Nav loading ring** — an indeterminate `.juno-arc` dropped into a
  `.juno-dock__bubble` rings the bubble edge while a section loads (the
  bubble-scale flavor of `icon-loader`); eats no clicks.
- **Reload indicator** — `.juno-reload` + `.juno-reload__dot`: the
  non-blocking counterpart to the skeleton for refetch-over-content. Fixed
  centered `role="status"` dot with a soft halo, `pointer-events: none`, gentle
  `juno-pulse` (new shared keyframe).
- **Inline icon sprite helper** — `junoui/icons/inline`: a tiny generated
  module that injects the sprite into the document once so icons use reliable
  same-document `<use href="#juno-i-…">` refs (external refs intermittently
  drop in Safari). Auto-installs on import; exports `installJunoIcons(doc)`.
- **Safe-area clearance tokens** — `--juno-dock-clearance` /
  `--juno-pillbar-clearance` (web-only CSS custom props, geometry + safe area
  folded in): a floating-nav consumer writes `padding-block-end:
var(--juno-dock-clearance)` on its scroller and stays correct if the dock
  geometry changes.
