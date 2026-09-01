---
'@junoput01/junoui': patch
---

`.juno-fold` gets a showcase entry, so it is inside the visual-regression suite (`20260826-006`).

It was the only component with no showcase presence at all — every other one gets a pixel diff on every change and this one got none. The section on `showcase/mobile.html` shows the canonical composition (`.juno-fold` on a `.juno-pillbar__item`) in both resting states side by side, which is what makes a static snapshot useful here: the defect this component actually shipped was a folded slot that could not reach zero, and a slot 44px wide instead of 0 moves the row it sits in.

The demo names `--juno-fold-gap`, because without it a folded slot still costs one gap and the row keeps a 2px residue — the case the fold's own docs warn about, and the one a demo is most likely to get wrong and teach.

`test/visual/fold-showcase.spec.mjs` asserts the numbers rather than the picture: the folded slot measures `0`, the present slot keeps the tap floor, and the two rows differ by exactly one item plus one gap. A pixel diff on a row shift can be argued down; `0.00` cannot — and Linux baselines are re-recorded by a separate manual workflow, so between an intended visual change and its re-recording there is a window in which the snapshot proves nothing. This runs in that window too.
