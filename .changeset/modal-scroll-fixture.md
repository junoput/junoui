---
'@junoput01/junoui': patch
---

The modal scroll port is now visible to the visual-regression suite (`20260815-027`).

`20260803-029` made `.juno-modal[open]` a flex column and `.juno-modal__body` the bounded scroll port. It was predicted to move the baseline and moved **zero pixels** — reconstructed as a reverse patch, across all 48 snapshots, at a zero-pixel budget. No tolerance could have fixed that: every showcase modal was short enough that a flex column and a block box lay out identically, and a body that never overflows never scrolls. There was nothing for a screenshot to see.

`showcase/overlays.html` gains `#ov-modal-tall`, a dialog whose body genuinely overflows, added to the overlay shot list as `modal-scrolling`. With it, reverting `20260803-029` now changes the picture and the numbers: the body stops being a port (1125 = 1125 instead of 1125 > 761), the dialog clips, and **the confirm button leaves the screen entirely**.

Its `__foot` is a **sibling** of `__body`, not inside it as the short fixtures have it. Measured: with the footer inside the scroll port it travels 407px out of view once the body is at its end — the "confirm button you cannot reach" shape. `.juno-modal[open]`'s column exists to support the pinned form, and a modal whose body can overflow should use it.

`test/visual/modal-scroll-port.spec.mjs` asserts the contract numerically rather than by pixels — the body overflows by a real margin, the body (not the dialog) is the scroll port, and head and foot hold position while the body scrolls.
