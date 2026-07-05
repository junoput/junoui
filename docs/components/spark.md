# Spark

A sparkline **contract**, not a chart library. junoui deliberately ships no
charting: your app computes the `<polyline>` points; `.juno-spark` supplies the
size / stroke / role-color so every sparkline in a product matches.

## Web

```html
<svg
  class="juno-spark juno--nominal"
  viewBox="0 0 120 24"
  preserveAspectRatio="none"
  aria-hidden="true"
>
  <polyline points="0,20 8,14 16,17 24,10 32,12 40,6 48,9" />
</svg>
```

| Class / part    | Effect                                            |
| --------------- | ------------------------------------------------- |
| `.juno-spark`   | Block, full width, `space.24` tall.               |
| `polyline`      | No fill, role stroke, 1.5 wide, round joins/caps. |
| `.juno--<role>` | Line color (default `active`).                    |

## Generating points

16 samples into a `0 0 120 24` viewBox, y inverted (SVG y grows downward),
with 2px headroom so the round cap never clips:

```js
const W = 120,
  H = 24,
  PAD = 2;
const points = (samples) => {
  const max = Math.max(...samples, 1);
  const step = W / (samples.length - 1);
  return samples
    .map((v, i) => `${(i * step).toFixed(1)},${(H - PAD - (v / max) * (H - 2 * PAD)).toFixed(1)}`)
    .join(' ');
};
```

## Usage

- Trend-at-a-glance in cards and table rows; pair with a [readout](./readout.md)
  or [gauge](./gauge.md) for the current value.
- A sparkline has no axes and is decorative — `aria-hidden="true"`, and put the
  actual number in text next to it.
- Needs axes, tooltips, more than one series? That's a chart — use a charting
  library in the app, not this.
