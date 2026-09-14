---
'@junoput01/junoui': patch
---

`.juno-bar__fill` used `left: 0`, so a determinate progress bar filled from the physical
left edge whatever the document direction — measured identical in `dir="ltr"` and
`dir="rtl"` (0..120 of a 0..400 bar at 30%), meaning progress ran backwards for every RTL
reader. It now uses `inset-inline-start`, including inside the `juno-bar-slide` keyframes
that drive the indeterminate segment, so both variants travel with the reading direction.
`.juno-beacon__hub`'s centring was converted in the same pass and is unchanged in effect —
symmetric either way.

Consumers rendering LTR see no difference. RTL consumers see the bar fill from the correct
edge; if you had compensated for this with your own override, remove it.
