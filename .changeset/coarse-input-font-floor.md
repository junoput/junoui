---
'@junoput01/junoui': patch
---

Fix: the 16px `.juno-input` font floor on touch never applied.

The rule lived in `base.css`'s `@media (pointer: coarse)` block, but a media
query adds no specificity — so `components/input.css`'s own
`.juno-input { font-size: var(--juno-font-size-14) }`, same 0,1,0 selector and
later in the bundle, won every time. On a coarse pointer the field measured
14px, i.e. exactly the condition the floor exists to avoid (iOS Safari zooming
the page onto a focused sub-16px field). The rule now lives in `input.css`,
after the declaration it has to beat.

Found by the new coarse-pointer visual-regression project (20260815-006): the
suite ran only `Desktop Chrome`, where `(pointer: coarse)` never matches, so
nothing had ever exercised the rule.
