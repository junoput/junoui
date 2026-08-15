---
'@junoput01/junoui': minor
---

The floating bar's offset from the bottom edge is now one token,
`--juno-dock-edge-offset`, consumed by both `.juno-dock--pill`/`--float`'s margin
and `--juno-dock-clearance`. Plus `--juno-dock-clearance-breathing` (default
`space-8`) for the gap between the bar and the last row.

No default changes: the offset still resolves to `space-16 + env(safe-area-inset-bottom)`
and the clearances to the same 86px / 78px they did at a 44px bubble.

What it fixes: the inset FORM used to be written separately at each site, so a
consumer whose design puts the bar flush above the home indicator —
`max(8px, env(safe-area-inset-bottom))` — changed its margin and could not change
the reservation, which kept adding. Measured at 16px of dead band at inset 0 and
24px at inset 34, with no value of `--juno-dock-h` able to reconcile them because
one side added the inset and the other maxed it. Both now follow the token, so
they agree by construction at every inset.
