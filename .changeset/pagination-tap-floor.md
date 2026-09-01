---
'@junoput01/junoui': patch
---

`.juno-pagination__item` now holds the tap floor on **both** axes (20260815-040).

`min-inline-size` read `--juno-size-tap-min` and took the coarse-pointer promotion; `block-size` was a hard `--juno-space-32` and could not. So on a phone every pagination control was **44 × 32** — clearing WCAG 2.2 **2.5.8** Target Size (Minimum, 24px) and missing **2.5.5** Enhanced (44px), which every other junoui touch control meets.

The floor is now `min-block-size: max(var(--juno-space-32), var(--juno-size-tap-min))` — the larger of the component's own 32px design height and what the pointer needs. Reading the token alone would have *shrunk* desktop pagination to 24px to fix a phone.

**Nothing changes on a fine pointer**: 32px before and after, measured. On a coarse pointer items go 44 × 32 → 44 × 44.

`docs/accessibility.md` and `docs/ios-pwa.md` both carried this as a documented exception to the blanket coarse-pointer promotion. It is no longer an exception, and both now say so.
