---
'@junoput01/junoui': patch
---

Fix: `--juno-dock-avail` now defaults to the **safe** viewport width,
`calc(100vw - safe-left - safe-right)`, instead of raw `100vw`. It feeds
`--juno-dock-item-inline`, the published figure a consumer uses to decide how
many items fit — and `100vw` spans under the sensor housing in landscape, so that
figure was larger than the room that exists. Measured at 844x390 with 59px
insets, 5 items: 168.8px published against 145.2px available.

Changes nothing where the insets are zero, which is every display without them.

Note the bar itself still paints full-bleed under the housing at the viewport
root — that half is a separate decision, because the dock is the edge-padding
bucket and `.juno-app-shell` already pads by the same two insets, so padding the
bar unconditionally would double-pad it when nested.
