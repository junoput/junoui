---
'@junoput01/junoui': minor
---

Ship `.juno-scroller` — the scroll-container primitive every scrolling region in
the library was re-deriving by hand: overflow axis, `overscroll-behavior`, and
snap type as overridable custom props, plus `--x`/`--y`/`--bare` modifiers and a
`.juno-snap` child helper. `.juno-reel` becomes its horizontal-mandatory-snap
preset and reads `scroll-snap-type` from `--juno-scroller-snap`, so the mode is
overridable per instance instead of hardcoded (default unchanged). The props are
only read as `var()` fallbacks and never declared on the element, so a reel
nested inside a scroller keeps its own snap. Fixes 20260802-017.
