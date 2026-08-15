---
'@junoput01/junoui': patch
---

Fix: the forced-colors (Windows High Contrast) border never applied.

`@media (forced-colors: active) { .juno-badge, .juno-btn, .juno-card,
.juno-readout { border: 1px solid CanvasText } }` lived in `base.css`, which the
bundler emits before `components/`. A media query adds no specificity, so each
component's own `border` declaration won on source order alone. Measured under
emulated forced-colors: `.juno-badge` computed a transparent border — it sets
`forced-color-adjust: none` to keep its status fill, and that opt-out also
disables the UA repaint that was silently rescuing `.juno-btn` and `.juno-card`.

New `src/css/overrides.css`, bundled last, is where cross-cutting `@media` /
`@supports` gates live now — after everything they guard. Same reasoning the
bundler already applied to `utilities.css`.
