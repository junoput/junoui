# Data readout

A tile showing one live value: small label, large mono value, unit.

## Web

```html
<div class="juno-readout juno--nominal">
  <span class="juno-readout__label">N1</span>
  <span class="juno-readout__value">89.3</span>
  <span class="juno-readout__unit">%</span>
</div>

<div class="juno-readout juno-readout--alert juno--warning">
  <span class="juno-readout__label">OIL PSI</span>
  <span class="juno-readout__value">12</span>
  <span class="juno-readout__unit juno-text-warning">↓ LOW</span>
</div>
```

| Class | Effect |
|---|---|
| `.juno-readout` | `s2` tile, radius `radius.5`. Value default role = `data`. |
| `.juno--<role>` | Colors the value (status). |
| `.juno-readout--alert` | Adds a 1px role border for critical tiles. |
| `__label` / `__value` / `__unit` | Parts. |

## Anatomy (any platform)

- Tile `s2`, padding `space.20`/`space.16`, radius `radius.5`.
- Label: `font.size.10`, uppercase, tracking `wider`, color `label`.
- Value: **B612 Mono 700**, `font.size.38`, `tabular-nums`, color = role (default `data`).
- Unit: `font.size.11`, color `label`.

## Usage

- Value stays `data` (neutral) when nominal; switch to a status role only when the
  reading itself is non-normal.
- Always B612 Mono with tabular figures so digits don't shift as values update.
