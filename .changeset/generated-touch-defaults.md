---
'@junoput01/junoui': patch
---

**The touch defaults are generated from one declared set — conformance kit slice 2.**

`base.css` carried two hand-maintained `:where()` lists, and both had drifted.

**From the classes:** `.juno-seg__option` (the shipped class is `.juno-seg__opt`) and `.juno-list__item` (it is `.juno-list__row`) sat in them. `:where()` matched nothing, the rule still parsed, every other member kept working — so every segmented control and every grouped list row in every consumer kept the ~300ms double-tap delay.

**From each other:** the tap-highlight list was a strict subset of the touch-action one, missing `__overflow`, `__opt`, `chip` and `toggle-btn`.

**Consumer-visible change:** `.juno-chip`, `.juno-pillbar__overflow`, `.juno-seg__opt` and `.juno-toggle-btn` now have their UA tap-highlight square suppressed on a coarse pointer, like every other tappable primitive. Verified in Chromium on both pointer types. Nothing else moves.

`src/css/touch-surfaces.mjs` is now the source of truth; the two rules are emitted from it. Adding a component to the touch defaults is one line and gets both. `touch-action` stays outside the coarse block — a hybrid device reports a fine primary pointer while still taking touch input — and the highlight stays inside it.
