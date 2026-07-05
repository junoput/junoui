# Gauge

A determinate metric ring — CPU / RAM / DISK readouts with the value centered.
The metric cousin of the [arc loader](./loader.md): the arc shows _progress of a
task_; the gauge shows _the current level of a quantity_. Pure CSS
(`conic-gradient`), no SVG in the markup.

## Web

```html
<div
  class="juno-gauge juno-gauge--sm juno--nominal"
  style="--juno-gauge-value: 67"
  role="meter"
  aria-valuenow="67"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="Disk"
>
  <span class="juno-gauge__value">67</span>
</div>
<span class="juno-gauge__label">DISK</span>
```

| Class / prop         | Effect                                                                        |
| -------------------- | ----------------------------------------------------------------------------- |
| `.juno-gauge`        | 64px ring; sweep = `--juno-gauge-value` (0–100).                              |
| `.juno-gauge--sm`    | 44px — dense card grids.                                                      |
| `.juno-gauge--lg`    | 96px — hero metrics.                                                          |
| `.juno-gauge__value` | Centered mono readout, role-colored.                                          |
| `.juno-gauge__label` | Caption (a sibling — place it under or beside the ring).                      |
| `.juno--<role>`      | Ring + value color (default `active`).                                        |
| `--juno-gauge-value` | The value, set inline or from JS. Registered (`@property`) so it transitions. |

## Anatomy (any platform)

- Ring: track = `border` color, fill sweep = role, round the ring `size / 16`
  stroke (4px at 64). Value: mono, bold, same color as the sweep.
- Sweep starts at 12 o'clock, clockwise.

## Usage

- **Thresholds are app policy.** junoui ships no value → color rule; map it
  yourself. The field-tested recipe: `v ≥ 90 → warning`, `≥ 75 → caution`,
  `else nominal`.
- Add `role="meter"` + `aria-valuenow/min/max` + a label; the ring alone is
  invisible to assistive tech.
- For task progress (this will finish), use a [loader](./loader.md) instead.
