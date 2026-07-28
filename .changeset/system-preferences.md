---
'@junoput01/junoui': minor
---

System-preference detection, all CSS:

- **Auto color scheme** — `data-juno-mode` is now optional: without it the
  theme follows the OS via `prefers-color-scheme` (per palette, live). An
  explicit mode pins it, exactly as before. The base layer sets
  `color-scheme` so scrollbars/native form chrome match the effective mode.
- A palette attribute without a mode now resolves to that palette's dark
  theme (previously fell back to standard's colors).
- `prefers-contrast: more` → hairline borders step up to `border-strong`.
- `prefers-reduced-transparency` → the pillbar drops its blur/translucency
  for a solid surface.

Showcase: mode control gains **AUTO** (the new default); the quick flip
button resolves the effective OS mode and pins the opposite; the header
clock formats in the browser's preferred language.
