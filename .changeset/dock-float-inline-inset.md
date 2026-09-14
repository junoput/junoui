---
'@junoput01/junoui': patch
---

Fix: the dock's floating variants (`--pill`, `--float`) now shed the horizontal
safe-area insets as well as the bottom one. Their `margin` shorthand paired a
safe-area-aware block term with a flat `--juno-space-12` inline term, so at
844x390 with 59px insets the bar painted from x=12 with its first item's leading
edge at 17 — 42px under a housing ending at 59.

Adds two custom properties, `--juno-dock-edge-offset-inline-start` and
`--juno-dock-edge-offset-inline-end`, mirroring `--juno-dock-edge-offset` on the
inline axis. Two rather than one because the horizontal insets are independent:
a notch is on the left in one orientation and the right when the device is turned
around.

Additive and inert without insets: with `env()` at 0 both resolve to the same
`--juno-space-12` the variants used before. The full-bleed base bar is
deliberately unchanged — it is in-flow, so whether it needs the inset depends on
its nesting.
