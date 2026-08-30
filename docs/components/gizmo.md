# Viewport orientation gizmo

The orientation widget any 3D or map viewport ships: a compass ring with
clickable snap targets, a secondary arc for a second angle (pitch, tilt,
elevation) inside a clamped range, and a centre target that resets the view.

CAD and BIM viewers, product configurators, virtual tours, model previews, floor
plans, any map with a tilt.

## A ring, not a cube

An Autodesk-style ViewCube is the wrong shape for anything with a **privileged
up-vector** — a map, a terrain, a site plan — because there is no meaningful
front, right or bottom face to click. A ring degrades to that case and
generalises to free orbit; a cube does not go the other way.

## Web

```html
<div
  class="juno-gizmo"
  role="group"
  aria-label="View orientation"
  style="--juno-gizmo-heading:45deg; --juno-gizmo-pitch:35deg;"
>
  <p class="juno-gizmo__readout" aria-live="polite">
    Facing north-east, 45 degrees. Tilted 35 degrees.
  </p>
  <div class="juno-gizmo__ring">
    <span class="juno-gizmo__needle" aria-hidden="true"></span>
    <button class="juno-gizmo__mark" style="--juno-gizmo-at:0deg" aria-label="Face north">N</button>
    <!-- …seven more, every 45° -->
    <button class="juno-gizmo__center" aria-label="Reset view to north, level">⌖</button>
  </div>
  <div class="juno-gizmo__arc"><span class="juno-gizmo__arc-hand" aria-hidden="true"></span></div>
</div>
```

| Class / prop                      | Effect                                       |
| --------------------------------- | -------------------------------------------- |
| `.juno-gizmo`                     | Root. Holds the angles and the derived size. |
| `.juno-gizmo__readout`            | The spoken state. `aria-live="polite"`.      |
| `.juno-gizmo__ring`               | The compass ring.                            |
| `.juno-gizmo__needle`             | Points at `--juno-gizmo-heading`.            |
| `.juno-gizmo__mark`               | A snap target. A real `<button>`.            |
| `.juno-gizmo__center`             | Reset target.                                |
| `.juno-gizmo__arc` / `__arc-hand` | The second angle, clamped.                   |
| `--juno-gizmo-heading` / `-pitch` | **The app writes these.**                    |
| `--juno-gizmo-at`                 | One mark's own bearing.                      |
| `--juno-gizmo-pitch-min` / `-max` | The clamp (default `0deg`–`85deg`).          |
| `--juno-gizmo-size`               | Ring diameter. Derived — see below.          |

**The app owns the camera.** junoui rotates the needle and the hand; it never
stores or changes an angle.

## The accessibility contract

This is why the component is upstream rather than in each app.

- **`role="group"`** with an accessible name on the root.
- **Snap targets are real `<button>`s.** Not a canvas hit test, not a `div` with
  a click handler. A button is focusable, activates on Enter _and_ Space, is
  announced as a control, and works in a screen reader's forms mode.
- **Every mark carries an accessible name**, because `"N"` is a letter, not a
  name. `aria-label="Face north"`.
- **One focus stop.** Tab reaches the gizmo once; arrow keys move between marks
  and **wrap**, Enter activates. Eight tab stops for eight compass points is what
  apps ship and what makes the widget unusable by keyboard.
- **The bearing is announced in words.** A rotating needle announces nothing, and
  `"37deg"` is a number the listener has to convert. The readout is a live region
  saying _"Facing north-east, 37 degrees. Tilted 45 degrees."_
- **`aria-current="true"`** on the mark the camera is nearest — not a class, since
  the app must say it for the screen reader anyway.

```js
import { enhanceGizmo, orientationLabel, bearingLabel } from 'junoui/gizmo';

enhanceGizmo(el); // one focus stop, wrapping arrows
readout.textContent = orientationLabel(yaw, pitch);
bearingLabel(37); // → "north-east"
```

Stateless, like `junoui/tree`: it moves focus and lets the marks' own click
handlers fire. It never writes an angle.

## The diameter is derived, not chosen

`N` marks sit evenly around the rim, and each is inset from it by half a target,
so their centres lie on a circle of radius `d/2 − tap/2`. The straight-line
distance between two adjacent centres — the **chord**, not the arc — must be at
least one tap target:

```
d ≥ tap · (1 / sin(π / N) + 1)
```

which is what `--juno-gizmo-size` computes: `158.98px` at `N = 8` and a 44px
target.

**This derivation was wrong twice, and both errors were invisible in the
source.** Sizing off the _arc_ between centres (`N · tap / π`) gives 112.05px,
whose chord is 42.9px — every neighbouring pair overlapping by 1.1px. Correcting
to the chord but forgetting the inset gives 114.98px and measures 27.16px between
centres. Both were caught by measuring a laid-out ring, which is why
`test/visual/gizmo.spec.mjs` asserts the distance between every pair of marks
rather than trusting the formula. The tap floor **moves** — 24px on a
fine pointer, 44px on a coarse one — so a ring with a hard-coded diameter has
eight overlapping targets on a phone. Setting `--juno-gizmo-size` larger is fine;
`max()` stops it going below what the marks need.

## Motion

Snap transitions run on `--juno-motion-scale`, so `prefers-reduced-motion`
collapses them through the base layer without a component-local media query.
