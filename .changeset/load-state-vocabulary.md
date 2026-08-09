---
'@junoput01/junoui': minor
---

Encode a load-state vocabulary so nothing spins forever: `.juno-shimmer` (work
in progress, no ETA), `.juno-fault` (terminal failure), and `.juno-empty`
(loaded, nothing to show), plus an optional CSS-only `.juno-state` /
`data-juno-when` switch that shows one treatment at a time. Zero JS — deciding
when a load becomes a fault stays the app's call; junoui ships the look and the
ARIA contract (documented in `accessibility.md`). `.juno-shimmer` reuses
skeleton's keyframe rather than forking a second shimmer. Fixes 20260802-014.
