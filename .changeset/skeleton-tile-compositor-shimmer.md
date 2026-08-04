---
'@junoput01/junoui': minor
---

Skeleton gains a content-box mode — `.juno-skeleton--tile` sized by
`--juno-skeleton-ratio` (default square) for media grids, so the layout doesn't
jump on load — and the shimmer moves to the compositor: a `::before` band
animated on `transform` only, never `background-position`, so it stops
repainting the gradient every frame. The local reduced-motion override is
dropped in favour of the global one in the base layer.
