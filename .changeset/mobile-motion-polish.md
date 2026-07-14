---
'junoui': minor
---

Mobile motion polish + a motion/integration guide.

- **Touch press feedback.** `dock`, `pillbar`, `navbar` (back), and interactive
  `list` rows now dip under the finger and spring back on release (`:active`,
  token-timed). Reads as native tactile feedback with zero JS.
- **State transitions replace snaps.** Dock/navbar/list color, fill, and active-
  indicator changes cross-fade over `motion.duration.quick`/`instant` instead of
  jumping (pillbar already did; the others matched).
- **RTL correctness.** The `list` drill-in chevron now mirrors under `[dir='rtl']`
  (it pointed the wrong way before), and its press nudge follows.
- **Bottom-sheet grabber.** New `.juno-modal__grabber` — a presentational drag
  handle, hidden by default and revealed on the phone bottom sheet + bottom drawer.
  Add it as the surface's first child.
- **`docs/motion.md`.** New guide: the motion-token vocabulary, what animates
  automatically (wire nothing), and the small amount apps own — overlay triggers
  (`showModal()`/`close()`), drag-to-dismiss, view transitions, and the
  reduced-motion contract.
