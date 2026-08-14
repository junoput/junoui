---
'@junoput01/junoui': minor
---

New `.juno-fold` — animated presence for a member of any row: the slot stays
mounted and folds its definite width (`--juno-fold-size`) to zero with a fade,
leaving the tab order at the end of the fold, driven by the app-set
`data-juno-in` attribute. `--juno-fold-gap` swallows the row's gap so the row
closes completely. Extracted from nexora's scroll-to-top slot so the generic
animation lives in the design system.
