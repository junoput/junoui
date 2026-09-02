---
'@junoput01/junoui': minor
---

`junoui-doctor` measures the **effective hit area**, not the border box (`20260902-014`).

`getBoundingClientRect` is not the hit area, and reading it was wrong in both directions.

**Noise:** `.juno-splitter` is a 1px painted hairline whose `::after` is a 44px target overlapping its neighbours — deliberate, since a 44px gap on desktop would be wrong. Pseudo-elements cannot be measured, so junoui's own doctor reported junoui's own component as a 1px tap target. An audit that cries wolf on a legitimate, common pattern gets muted.

**The dangerous mirror:** a control sized 44px whose real hit area is shrunk by something on top of it was reported **clean**.

The extent is now probed with `elementFromPoint`, outward from the centre, bounded by the floor. Where box and hit disagree the finding names both, because "box 44x44, hit 12x44" and "12x12" need different fixes.

**One opt-out, and it is never silent.** A control whose pointer input is routed by a shared handler on an ancestor cannot be audited per element — `junoui/range` is the case: at coincident positions one thumb is entirely under the other, and which one a tap grabs is decided by `pickThumb` from a handler on the host. `data-juno-hit="delegated"` declares that, and the doctor **prints how many controls used it on every run, including a clean one**. `.juno-range` sets it.
