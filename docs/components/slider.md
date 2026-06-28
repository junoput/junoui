# Slider

A track slider: a recessed channel with detent notches, an accent fill, and
a gripped lever. **Value-driven** — junoui ships the look; the app sets the value % and
owns drag / keyboard / ARIA (the same split as the overlays). Two sizes: standard (lever
always full) and `--compact` (lever recedes to a slim marker until hover / focus / drag).

## Web

```html
<div
  class="juno-slider"
  style="--juno-slider-pct: 72"
  role="slider"
  tabindex="0"
  aria-valuenow="72"
  aria-valuemin="0"
  aria-valuemax="100"
>
  <span class="juno-slider__channel"></span>
  <span class="juno-slider__lever"></span>
</div>

<!-- compact, managed accent -->
<div class="juno-slider juno-slider--compact juno--target" style="--juno-slider-pct: 50">…</div>
```

| Property / class         | Effect                                                          |
| ------------------------ | --------------------------------------------------------------- |
| `--juno-slider-pct`      | 0–100; the app sets it. Drives the fill width + lever position. |
| `.juno-slider__channel`  | `s0` channel, `control-edge` border, inset shadow, 10% detents. |
| `.juno-slider__lever`    | Gripped lever (`space.26`×`space.40`) at the value.             |
| `.juno-slider--compact`  | Lever shrinks to a marker until hover / focus / drag.           |
| `.juno--<role>`          | Tints the fill (default `active`).                              |
| `[aria-disabled="true"]` | Dimmed, not-allowed.                                            |

## Anatomy (any platform)

- Channel `space.20`, inset; faint detents every 10%; accent fill (8%→34%) to the value.
- Lever 26×40 (standard), gradient `s3`→`s2`, three grips; compact shrinks to 10×22.
- Lever/size transitions use `motion.duration.base` / `ease`.

## Usage

- The app owns the value: set `--juno-slider-pct` and keep `aria-valuenow` in sync; wire
  pointer-drag and arrow/Page keys, plus `aria-valuetext` when the number needs units.
  (`showcase/app.js` has a reference driver.)
- Pair with a mono readout (`.juno-value`) of the current value.
