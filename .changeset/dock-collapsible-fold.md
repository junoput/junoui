---
'@junoput01/junoui': minor
---

Dock gains `.juno-dock--collapsible`: the whole bar folds into a single
circular `.juno-dock__knob` at the inline-end edge, driven by one inherited
custom prop the app writes per scroll frame — `--juno-dock-fold` (0 open … 1
circle) — so the fold can track the gesture. Two phases split at
`--juno-dock-fold-split`: shrink in place to `--juno-dock-fold-scale`, then
slide shut to `--juno-dock-collapsed-size`; `data-juno-collapsed` is the
app-set end state that drops the `.juno-dock__tray` items from the tab order
and reveals the knob. Composes with `--pill`/`--float`/`--fixed`; zero JS.
Extracted from nexora's shipped scroll-fold so the mechanism lives in the
design system and apps keep only the scroll wiring.
