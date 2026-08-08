---
'@junoput01/junoui': patch
---

Tappable primitives (`.juno-btn`, dock/pillbar/tabs/list/menu items, segmented
options, chips, toggle buttons) now carry `touch-action: manipulation`, opting
out of double-tap-to-zoom so a browser no longer waits after the first tap to
see whether a second is coming — the late, mushy tap a phone UI is built on.
Panning and pinch-zoom are preserved (never `none`, which would be an a11y
regression), and it is applied outside the coarse-pointer query so hybrid
touch devices that report a fine pointer still get it. Fixes 20260803-038.
