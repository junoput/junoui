---
'@junoput01/junoui': patch
---

Fix: `.juno-dock--fixed` now takes both horizontal safe-area insets as
`padding-inline`. It is `position: fixed; inset-inline: 0`, so no ancestor's
padding reaches it — measured inside a `.juno-app-shell` that had already padded
by both insets, at 844x390 with 59px insets, the bar still spanned `0..844` with
its first item's leading edge at 0.

**Padding, not margin**, unlike the `--pill`/`--float` fix that preceded it: this
bar is full-bleed by design, so its background keeps spanning edge to edge and
only the content moves in. Its box is unchanged.

Inert without insets. Also splits the `docs/safe-area.md` row that grouped
`--fixed` with the in-flow base bar and said the inset depends on the container,
which is false for a viewport-fixed element.
