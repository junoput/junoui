---
'@junoput01/junoui': patch
---

**Pagination items hold the tap minimum on both axes.**

`.juno-pagination__item` floored its **inline** size at `--juno-size-tap-min` but set a fixed 32px `block-size`. On a coarse pointer the tap floor promotes to 44px, so these widened to 44 and stayed 32 tall — a control that is a tap target in one direction and not the other, which is not a tap target.

Both axes now use `max(space.32, size.tap.min)`: a fine pointer is unchanged at 32×32, a coarse pointer gets 44×44. `max()` rather than a plain swap, because `min-block-size: var(--juno-size-tap-min)` alone would let a desktop page button shrink to 24px — the design draws these at 32.

The reason it went unnoticed is now fixed too: `tap-targets.spec.mjs` had no pagination row, so the numeric coarse-pointer check that found the 16px input floor never looked here. It asserts **both** dimensions, since a single-axis check would have passed throughout the bug's entire life.
