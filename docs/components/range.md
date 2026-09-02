# Range — dual-thumb slider

A track with two thumbs and the span between them filled. Price filters, date
ranges, histogram brushing, audio trim, threshold pairs, zoom windows.

`.juno-slider` is single-value, so a range today is two sliders side by side and
nothing stops the low one passing the high one.

```html
<div
  class="juno-range"
  role="group"
  aria-label="Price"
  data-juno-min="0"
  data-juno-max="100"
  style="--juno-range-lo:30%; --juno-range-hi:70%"
>
  <div class="juno-range__track"><div class="juno-range__fill"></div></div>
  <div
    class="juno-range__thumb juno-range__thumb--lo"
    role="slider"
    tabindex="0"
    aria-label="Minimum"
    aria-valuemin="0"
    aria-valuemax="70"
    aria-valuenow="30"
  ></div>
  <div
    class="juno-range__thumb juno-range__thumb--hi"
    role="slider"
    tabindex="0"
    aria-label="Maximum"
    aria-valuemin="30"
    aria-valuemax="100"
    aria-valuenow="70"
  ></div>
</div>
```

## The constraint is announced, not just enforced

Each thumb's `aria-valuemin` / `aria-valuemax` is **the other thumb's position**,
not the track's. Without that a screen-reader user pushes against an invisible
wall and is told nothing. `thumbBounds()` computes them:

```js
import { thumbBounds } from 'junoui/range';
const { min, max } = thumbBounds({ thumb: 'lo', lo: 30, hi: 70, min: 0, max: 100 });
// { min: 0, max: 70 }
```

Two sliders in a `role="group"`, each with its own accessible name. A bare
"slider" twice is unusable.

## Which thumb does a tap grab?

Two 44px thumbs **overlap as soon as their centres are within 44px**, which is
most of a short track — so this is a rule, not an accident of z-order.

**Nearest centre between the thumbs; direction of travel outside them.**

```js
import { pickThumb } from 'junoui/range';
pickThumb({ value: 40, lo: 30, hi: 70, min: 0, max: 100 }); // 'lo'
pickThumb({ value: 80, lo: 50, hi: 50, min: 0, max: 100 }); // 'hi' — coincident
```

Why not the obvious rules on their own:

| Rule                  | Where it fails                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------ |
| nearest centre        | **ties exactly when the thumbs coincide** — every tap is equidistant — and jitters near it |
| last moved            | wrong at a limit: both thumbs at max, last-moved is the upper, and the upper cannot move   |
| keeps the range valid | under-determined while the thumbs are apart, where either choice is valid                  |

Outside the pair the first two agree, since the nearer thumb _is_ the one on that
side. The direction rule earns its place on coincident thumbs.

The one genuine tie is a tap exactly on two coincident thumbs. Pass `last` and it
sticks to the thumb you were just moving; without it, the thumb that is **not**
pinned at a limit wins, because the other one cannot move at all.

The property this buys, swept in the tests rather than argued: **every tap
resolves to a thumb that can actually move toward it, and the resulting pair is
always valid.**

## Dragging one thumb past the other

**It clamps. It does not swap, and it does not push.**

| Behaviour   | Why not                                                                                                                                                                                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **swap**    | changes which bound you are dragging mid-gesture. `aria-valuenow` on the thumb under the finger silently starts meaning the other end, and a screen-reader user who grabbed "Minimum" is told nothing. An app that bound the low thumb to a field sees it jump. |
| **push**    | edits a value the user did not touch. On a price filter that is a silent change to the other bound.                                                                                                                                                             |
| **clamp** ✔ | the thumb's identity is stable for the whole gesture and the emitted pair always satisfies `lo <= hi`. The thumb stops, the finger keeps going, bring it back and it resumes.                                                                                   |

```js
import { moveThumb } from 'junoui/range';
moveThumb({ thumb: 'lo', value: 90, lo: 30, hi: 70, min: 0, max: 100 });
// { lo: 70, hi: 70 } — stopped at the other thumb, which did not move
```

`minGap` stops them early, for a range that must span something:

```js
moveThumb({ thumb: 'lo', value: 90, lo: 30, hi: 70, min: 0, max: 100, minGap: 10 });
// { lo: 60, hi: 70 }
```

## Overlap is in the hit areas, not the paint

Each thumb is a tap-sized **box** with a small grip painted inside it. The boxes
may overlap completely; the grips stay visibly separate, so a control that
_behaves_ as two thumbs also _looks_ like two. If the paint overlapped as well it
would read as one thumb and respond as two.

The focused or dragged thumb paints above its neighbour, so the grip a keyboard
user is moving is never hidden behind the other.

## Keyboard

```js
import { enhanceRange } from 'junoui/range';
const stop = enhanceRange(root, { step: 1, pageStep: 10, minGap: 0 });
root.addEventListener('juno-range-change', (e) => setRange(e.detail)); // {lo, hi, thumb}
```

Arrows step, PageUp/PageDown page, Home/End go to the track's ends — and all of
them run through `moveThumb`, so the keyboard cannot cross the thumbs either. The
event carries the **whole pair**, so a caller cannot apply half of it.

Stateless: it never writes `aria-valuenow`. The app owns the values.

## Classes

| Class                             | Role                                         |
| --------------------------------- | -------------------------------------------- |
| `.juno-range`                     | Host. `role="group"`, carries the tap floor. |
| `.juno-range__track`              | The painted hairline.                        |
| `.juno-range__fill`               | The selected span, between the thumbs.       |
| `.juno-range__thumb`              | A tap-sized box; the grip paints inside it.  |
| `.juno-range__thumb--lo` / `--hi` | Which bound it is.                           |

## Custom properties

| Property             | Default | Meaning                  |
| -------------------- | ------- | ------------------------ |
| `--juno-range-lo`    | `0%`    | Low thumb position.      |
| `--juno-range-hi`    | `100%`  | High thumb position.     |
| `--juno-range-track` | `4px`   | Painted track thickness. |
| `--juno-range-grip`  | `16px`  | Painted grip size.       |

## What this does not do

No values, no clamping applied for you, no persistence. Same boundary as
[slider](./slider.md), [scrubber](./scrubber.md) and [splitter](./splitter.md):
junoui ships the affordance, the hit area, the ARIA contract and the two rules
above, which is the part consumers omit and which is identical in every app with
a range.
