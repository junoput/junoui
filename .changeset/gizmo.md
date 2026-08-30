---
'@junoput01/junoui': minor
---

**Viewport orientation gizmo — compass ring, pitch arc, snap targets.**

The orientation widget any 3D or map viewport ships: a ring showing a heading with clickable snap targets, a secondary arc for a second angle (pitch, tilt, elevation) inside a clamped range, and a centre target that resets the view. For CAD and BIM viewers, product configurators, virtual tours, model previews, floor plans, and any map with a tilt.

**A ring, not a cube.** An Autodesk-style ViewCube is the wrong shape for anything with a privileged up-vector — a map, a terrain, a site plan — because there is no meaningful front, right or bottom face to click. A ring degrades to that case and generalises to free orbit; a cube does not go the other way.

**The app owns the camera.** It writes `--juno-gizmo-heading` and `--juno-gizmo-pitch`; junoui rotates the needle and the hand and never stores an angle.

The accessibility contract is why this is upstream rather than app-local: snap targets are real `<button>`s (focusable, activate on Enter _and_ Space, announced as controls, work in a screen reader's forms mode); every mark carries a real name, because `"N"` is a letter and not one; the widget is **one focus stop** with wrapping arrow keys, not eight tab stops for eight compass points; and the bearing is announced in words through a live region, because a rotating needle announces nothing and `"37deg"` is a number the listener has to convert.

```js
import { enhanceGizmo, orientationLabel, bearingLabel } from 'junoui/gizmo';
bearingLabel(37); // → "north-east"
```

**The ring's diameter is derived, not chosen:** `d ≥ tap · (1 / sin(π/N) + 1)`. The tap floor moves from 24px to 44px on a coarse pointer, so a hard-coded diameter ships eight overlapping targets to a phone.
