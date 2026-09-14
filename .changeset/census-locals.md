---
'@junoput01/junoui': patch
---

Docs: `docs/inventory-elements.md`'s `Local custom properties` column is
re-derived — twelve rows moved — and its Method note now records the exclusion
rule it actually needs.

Seven shared names (`--juno-control-edge`, `--juno-control-edge-strong`,
`--juno-control-surface` and the four `--juno-knob-*`) are added to the excluded
set: all are declared centrally in `base.css`, whose own comment already calls the
knob group "the knob + track-rim of the lever controls (switch / slider)". They
account for 13 of the 22 rows the unamended rule would move.

The note also records **two counter-cases** proving no single mechanical rule is
right — `--juno-icon-size` has one canonical declarer with another component
merely configuring a nested child, while `--juno-arc-size` is two components
declaring the same name for unrelated purposes — and that usage must be read with
comments stripped, since `--juno-dock-clearance` appears in `dock.css` only inside
a doc comment.

No CSS changes.
