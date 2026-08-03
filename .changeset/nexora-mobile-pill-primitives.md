---
'@junoput01/junoui': minor
---

Mobile pill / loading primitives — absorbed from an app that hand-rolled them
(nexora `feat/mobile-ui`), so the next consumer gets them plug-and-play.
Almost all additive; a11y contract in `accessibility.md`. Filed as a pre-1.0
_minor_ (the breaking-capable channel) because two existing surfaces move:
`.juno-icon-loader` now stacks **every** child on its centre cell, and the
bottom-sheet / snackbar safe-area fix restores padding that Chromium was
silently dropping — see the last two bullets.

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
- **Reload indicator** — `.juno-reload` + `.juno-reload__dot`: the
  non-blocking counterpart to the skeleton for refetch-over-content. Fixed
  centered `role="status"` dot with a soft halo, `pointer-events: none`, gentle
  `juno-pulse` (new shared keyframe).
- **Inline icon sprite helper** — `@junoput01/junoui/icons/inline`: a tiny
  generated module that injects the sprite into the document once so icons use
  reliable same-document `<use href="#juno-i-…">` refs (external refs
  intermittently drop in Safari). Auto-installs on import; exports
  `installJunoIcons(doc)`.
- **Safe-area clearance tokens** — `--juno-dock-clearance` /
  `--juno-pillbar-clearance` (web-only CSS custom props, geometry + safe area
  folded in): a floating-nav consumer writes `padding-block-end:
var(--juno-dock-clearance)` on its scroller and stays correct if the dock
  geometry changes.
- **`.juno-icon-loader` generalised to _the_ ring-a-control primitive** — the
  ring stroke is now a custom prop (`--juno-icon-loader-ring-width`, default
  `0.14em`) alongside the existing `--juno-icon-loader-ring`, and every child
  — not just `.juno-icon` — shares the centre cell. A host with a definite box
  sets the diameter to that box and the ring hugs its edge without the box
  resizing when the arc appears. `.juno-dock__bubble` is exactly that: pair it
  with `.juno-icon-loader` and an indeterminate `.juno-arc` rings the bubble
  edge while a section loads. There is one ring mechanism, not two.
  _Upgrade note:_ a `.juno-icon-loader` with children beyond the icon + arc
  used to lay them out in extra grid cells; they now stack on the centre cell.
- **Safe-area `calc()` fix** — the bottom-sheet body and the narrow-viewport
  toast stack passed a **unitless** `0` as the `env(safe-area-inset-bottom)`
  fallback inside `calc()`. A unitless `0` is a `<number>`, so the sum is
  invalid and Chromium dropped the whole declaration — losing the constant
  padding term on every device without a safe area. Fallback is now `0px`, so
  the padding lands as designed (a small, intended, visible shift).
