---
'junoui': minor
---

New components + visibility pass.

- **Icon** system: `.juno-icon` + an SVG sprite (`junoui/icons`, Phosphor bold, MIT) —
  `currentColor`-tinted, `em`-sized (rides the type scale).
- New components: **skeleton**, **avatar**, **divider**, **chip/tag**, **breadcrumb**,
  **pagination**, **stepper**.
- **Type-scale switcher**: `[data-juno-text]` + `--juno-font-scale` scales all type tokens.
- Higher-contrast controls: switch/slider knob + track rim, and a shared
  `--juno-control-edge-strong` on inputs, checkbox/radio, toggle buttons.
- Contrast fix (token values, hue/chroma kept): `muted` and dark `label` raised to legible
  levels across all three palettes. Pre-1.0 visual change — re-check custom theming.
- Fixes: table two-line clamp no longer leaks a third line; switch ON-state now reads at a
  squint.
