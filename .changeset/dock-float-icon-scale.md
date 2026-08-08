---
'@junoput01/junoui': minor
---

Dock gains composable variants: `--float` (floating capsule chrome, labels kept)
and `--icon` (labels hidden, active state moves to a circular bubble) — together
they reproduce the existing `--pill` look from two independent pieces — plus
`--juno-dock-scale`, a shrink-on-scroll knob whose transition duration is
authored through `--juno-motion-scale` so reduced motion collapses it. Also
fixes the partial border reset on `.juno-dock__item`, which left the UA default
border on three sides of a `<button>` item. Fixes 20260802-015.
