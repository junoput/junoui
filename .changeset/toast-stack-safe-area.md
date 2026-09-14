---
'@junoput01/junoui': patch
---

**Fixed: the toast stack rendered at the top of the screen on every phone-width
viewport.** `--juno-toast-edge-offset` was declared on `.juno-toast` (a child
of `.juno-toast-stack`) but consumed on the stack itself. Custom properties
inherit downward, not upward, so the property was undefined where it was read,
`inset-block-end` was invalid at computed-value time, and a `position: fixed`
box fell back to its static position — the top of the page — below 640px. Now
declared and consumed on `.juno-toast-stack`.

**Fixed: the toast stack ignored the horizontal safe-area inset above 640px.**
The corner placement's default `inset-inline-end` was a flat `--juno-space-24`
with no inset term, so a landscape phone (≥640px wide, where the horizontal
inset is largest) rendered the stack running under the sensor housing.
`.juno-toast-stack` now sheds `--juno-safe-right` there too, additive
[floating chrome], same as `--juno-toast-edge-offset` sheds `--juno-safe-bottom`.

**Fixed: the `--top` and `--start` corner placements were still on flat
tokens.** Both used a bare `--juno-space-24` (or `-12` in the narrow branch)
with no safe-area term at all. `--top` was the worse case: in portrait the
top edge sits exactly where the Dynamic Island is, and this doc's own
letterbox guidance says the top inset is real and must not be zeroed. Both
now shed the relevant inset, additive.

`docs/safe-area.md`'s toast row corrected to match: it previously named the
token's definition without noting it was declared on the wrong element, and
was silent on the horizontal axis.
