---
'@junoput01/junoui': minor
---

Emit the breakpoints as named media queries — `@junoput01/junoui/css/custom-media`
ships `--juno-below-*` / `--juno-from-*` generated from the same
`tokens/core/breakpoint.json`, so consumers stop copying `767.98px` by hand.
Shipped as its own opt-in file because `@custom-media` needs a build step
(postcss-custom-media); each entry documents the plain literal to use without
one. A new build test asserts every breakpoint literal hardcoded in `src/css`
matches a generated boundary, so the tokens are mechanically the source of
truth rather than by convention. Fixes 20260802-024.
