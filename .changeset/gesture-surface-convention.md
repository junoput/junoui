---
'@junoput01/junoui': minor
---

Publish a gesture-surface convention: `.juno-gesture-surface` marks an element
whose pointer events app JS fully owns (`touch-action` via `--juno-touch-action`,
plus the callout / selection / tap-highlight resets the UA otherwise applies),
with `.juno-pan-x` / `.juno-pan-y` as single-axis escape hatches. Opt-in classes
only — nothing changes unless applied. This is community convention, not Apple
guidance; no primary source names these properties for iOS. Fixes 20260802-021.
