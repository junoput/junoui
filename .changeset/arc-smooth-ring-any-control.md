---
'@junoput01/junoui': patch
---

`.juno-icon-loader` is documented as what it always was — a primitive that rings
**any** control (button, badge, avatar), not just a nav icon; the single-cell
grid never cared what it wrapped. Adds `.juno-arc--smooth`, a continuous-rotation
modifier for indeterminate arcs, because the default 12-step sweep reads as
jitter under ~24px. No second ringing mechanism was introduced. Fixes 20260802-013.
