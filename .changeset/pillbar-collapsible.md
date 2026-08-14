---
'@junoput01/junoui': minor
---

Pillbar gains `.juno-pillbar--collapsible`: the whole pill folds into a single
circular `.juno-pillbar__toggle` and animates back to full width when tapped.
State is the toggle's `aria-expanded` (app-owned, zero JS, same convention as
`__item`'s `aria-pressed`), read via `:has()` so toggle/tray DOM order is free.
The `.juno-pillbar__tray` animates `grid-template-columns: 0fr ↔ 1fr` — the
only widely-supported transition to an intrinsic width (Safari 16+) — and goes
`visibility: hidden` at the end of the slide so collapsed items leave the tab
order. `__toggle` shares `__overflow`'s circle chrome; existing markup renders
unchanged.
