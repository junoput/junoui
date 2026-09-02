# Scrubber — timeline / transport

A track with a playhead, a **loaded** range distinct from the **played** one,
optional in/out marks, optional chapter ticks, and a preview slot the app fills.
For media playback, telemetry and session replay, audio editing, animation
timelines.

**Not `.juno-slider`.** A slider is a single-value form control whose value is a
number. A scrubber has three ranges over one axis, announces a **time**, and its
playhead is dragged rather than nudged. Same ARIA role, different component.

```html
<div
  class="juno-scrubber"
  role="slider"
  tabindex="0"
  aria-label="Playback position"
  aria-valuemin="0"
  aria-valuemax="212"
  aria-valuenow="87"
  aria-valuetext="1:27 of 3:32"
  style="--juno-scrubber-played:41%; --juno-scrubber-loaded:68%"
>
  <div class="juno-scrubber__track">
    <div class="juno-scrubber__loaded"></div>
    <div class="juno-scrubber__played"></div>
  </div>
  <div class="juno-scrubber__head"></div>
</div>
```

With a clip range, chapter ticks and draggable marks:

```html
<div class="juno-scrubber" role="slider" tabindex="0" aria-label="Clip range">
  <div class="juno-scrubber__track">
    <div class="juno-scrubber__loaded"></div>
    <div class="juno-scrubber__played"></div>
  </div>
  <div class="juno-scrubber__range"></div>
  <div class="juno-scrubber__ticks" aria-hidden="true">
    <span class="juno-scrubber__tick" style="inset-inline-start:38%"></span>
  </div>
  <div class="juno-scrubber__head"></div>
  <div class="juno-scrubber__preview">02:41</div>
  <button class="juno-scrubber__mark juno-scrubber__mark--in" aria-label="Clip start"></button>
  <button class="juno-scrubber__mark juno-scrubber__mark--out" aria-label="Clip end"></button>
</div>
```

## The announcement is the contract

`role="slider"` announces `aria-valuenow` by default, so a screen reader says
**"87"** — or "41 percent" — for a position in a three-minute clip. Neither is
usable. `aria-valuetext` must carry a time, and `junoui/scrubber` gives you the
string rather than leaving you to hand-roll it:

```js
import { valueText } from 'junoui/scrubber';
el.setAttribute('aria-valuetext', valueText(87, 212)); // "1:27 of 3:32"
```

`formatTime` drops the hour below an hour (`4:07`, never `0:04:07`) and clamps
negative or non-finite input to `0:00` — a screen reader will happily read
`-1:-5` aloud.

## The hit area

A 4px track is unhittable with a finger, and is the most common failure of a
hand-rolled scrubber. So the **host** is tap-sized on the block axis and the
track is painted inside it: `--juno-size-tap-min` promotes to 44px on a coarse
pointer via `base.css`, so this component never mentions a phone.

The size is on the **host**, not a pseudo-element, so that
`getBoundingClientRect` — and anything auditing tap targets with it, including
`junoui-doctor` — measures what a finger actually hits (`20260902-014`).

The in/out marks are separate controls, so they carry the floor **on both axes**.
That is the `20260815-040` failure stated as a rule: pagination held the floor on
its inline axis and a fixed 32px on its block axis, and shipped at 44×32.

`touch-action` is `none` on both surfaces, overriding the generated touch layer's
`manipulation` — which would leave the browser free to claim a horizontal pan, so
a scrub on a phone scrolls the page instead of seeking.

## Keyboard

`junoui/scrubber` is stateless: it computes a **requested** value and dispatches
`juno-scrubber-seek`; it never writes `aria-valuenow`, because whether a seek
lands is a question only the player can answer.

```js
import { enhanceScrubber } from 'junoui/scrubber';
const stop = enhanceScrubber(el, { step: 5, pageStep: 30 });
el.addEventListener('juno-scrubber-seek', (e) => player.seek(e.detail.value));
```

| Key                 | Moves                            |
| ------------------- | -------------------------------- |
| `←` `→` `↑` `↓`     | one `step`                       |
| `PageUp` `PageDown` | one `pageStep`                   |
| `Home` `End`        | to `aria-valuemin` / `-valuemax` |

Any other key returns `null` from `keyDelta` and is left alone — "no movement"
and "not mine" are different, and collapsing them is how a scrubber ends up
calling `preventDefault` on Tab.

`detail.reason` is `'key'` or `'pointer'`, so an app can throttle a scrub-drag
without throttling arrow keys.

## Classes

| Class                                            | Role                                                            |
| ------------------------------------------------ | --------------------------------------------------------------- |
| `.juno-scrubber`                                 | Host. Carries the ARIA and the tap floor.                       |
| `.juno-scrubber__track`                          | The painted hairline.                                           |
| `.juno-scrubber__loaded`                         | Buffered / available range.                                     |
| `.juno-scrubber__played`                         | Elapsed range.                                                  |
| `.juno-scrubber__range`                          | The in..out selection.                                          |
| `.juno-scrubber__head`                           | The playhead. Not a separate target — the host is.              |
| `.juno-scrubber__ticks` / `.juno-scrubber__tick` | Chapter marks. Decorative; a mark a reader must read is a list. |
| `.juno-scrubber__mark`                           | A draggable in/out handle. Tap-floored on both axes.            |
| `.juno-scrubber__mark--in` / `--out`             | Which end it is.                                                |
| `.juno-scrubber__preview`                        | Slot the app fills — thumbnail, timestamp, sparkline.           |

## Custom properties

| Property                     | Default | Meaning                                  |
| ---------------------------- | ------- | ---------------------------------------- |
| `--juno-scrubber-played`     | `0%`    | Elapsed position.                        |
| `--juno-scrubber-loaded`     | `0%`    | Buffered extent.                         |
| `--juno-scrubber-in`         | `0%`    | Clip start.                              |
| `--juno-scrubber-out`        | `100%`  | Clip end.                                |
| `--juno-scrubber-preview-at` | played  | Where the preview sits, if not the head. |
| `--juno-scrubber-track`      | `4px`   | Painted track thickness.                 |
| `--juno-scrubber-head`       | `12px`  | Painted playhead size.                   |

Percentages, so the app never needs the pixel width of a box it does not own —
`percentOf(value, min, max)` builds them.

## What this does not do

No playback state, no pointer capture, no seeking, no persistence. The app owns
the numbers and writes them in. Same boundary as
[splitter](./splitter.md) — junoui ships the affordance, the hit area and the
ARIA contract, which is the part consumers omit and which is identical in every
app that has a timeline.
