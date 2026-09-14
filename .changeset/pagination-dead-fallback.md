---
'@junoput01/junoui': patch
---

`.juno-pagination__item` read its inline tap floor as
`var(--juno-size-tap-min, var(--juno-space-32))`. `--juno-size-tap-min` is declared at
`:root` in every build, so that fallback could never fire — it read as a 32px floor and
was dead code. Rendering is unchanged (measured both ways: `1` is 26x32 and a chevron
24x32 on a fine pointer, 44x44 on a coarse one, either form); the line now reads the
token plainly and says so. Whether the inline floor should be 32px is an appearance
question and is still open.

A new test pins the class: of the 36 `--juno-*` names junoui reads through a `var()`
fallback, 35 are consumer knobs that are genuinely undefined by default, and no
declared token may wear that idiom again.
