---
'@junoput01/junoui': patch
---

Docs: `docs/safe-area.md` now carries the tooltip's measurements. The
anchored-surfaces section previously said `.juno-tooltip__bubble` was
**unmeasured** in its top-layer mode — it now records all four placements
crossing into the housing (`--right` 25px, `--left` 59px, default and `--bottom`
6px each), and the structural reason the tooltip is the weakest of the three:
its base rule declares `position-try-fallbacks: flip-block` only and no placement
modifier adds `flip-inline`, so unlike the popover and menu it never _attempts_ a
horizontal correction.

No CSS changes.
