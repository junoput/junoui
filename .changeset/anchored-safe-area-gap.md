---
'@junoput01/junoui': patch
---

Docs: `docs/safe-area.md` now records that the anchored surfaces
(`.juno-popover`, `.juno-menu`, `.juno-tooltip__bubble`) are **absent from the
bucket table on purpose, and that this is not the same as being safe**. They read
no `--juno-safe-*` token, so their absence would otherwise read as "handled".

Measured: at 844x390 with 59px insets, an edge-anchored popover or menu ends at
x=840 against a housing spanning 785..844 — a fifth of the panel unreadable. No
component-level fix exists, because CSS anchor positioning resolves overflow
against the **viewport**, which spans under the housing. Two candidate fixes and
why each fails are recorded with the gap.

No CSS changes.
