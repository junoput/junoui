---
'@junoput01/junoui': patch
---

`.juno-tooltip__bubble[popover]` declared `position-try-fallbacks: flip-block` on the base
rule every placement modifier inherits, so `--right` and `--left` — the two placements whose
whole job is inline — had no inline correction available. A `--right` bubble on a trigger 4px
from the right edge was clamped flush to the viewport and covered the trigger that summoned
it (measured: bubble 777..844, trigger 820..840, at 844px wide). Now `flip-block, flip-inline`,
as `popover.css` and `menu.css` have always declared. A centred trigger is unaffected, pinned
by a control.

It is not a safe-area fix, though it clears the 59px housing in `docs/safe-area.md`'s fixture:
the flipped position is identical at 59px, 80px and 100px insets, so it clears that one by
nine pixels of coincidence and crosses a wider housing. The doc and its pinned-defect test
were updated to measure the inline placements at 80px, where the coincidence does not save
them.
