# Design guidelines

Buildable in any tool — these are rules, not code. Pair with exact values in
[tokens-reference.md](./tokens-reference.md).

## First principle: color encodes status, never decoration

Every hue has one assigned role. Never reuse a status color as styling.

| Role      | Meaning           | When                                                                    |
| --------- | ----------------- | ----------------------------------------------------------------------- |
| `nominal` | Normal / OK       | Nominal readings, confirmed-good, success.                              |
| `active`  | Selected / active | Current selection, armed state, focus rings, live status.               |
| `target`  | Managed / goal    | Computed set-points, automated targets. Use sparingly.                  |
| `caution` | Non-normal, watch | Approaching limits, degraded — no immediate action.                     |
| `warning` | Critical          | Limit exceeded, act now. Reserve strictly — overuse destroys authority. |

Neutral / structural roles carry no status meaning:

| Role      | Use                                                             |
| --------- | --------------------------------------------------------------- |
| `data`    | Primary numeric readouts and live values — the brightest text.  |
| `label`   | Labels, units, helper and secondary text. Never for values.     |
| `muted`   | Disabled, placeholder, decorative separators.                   |
| `border`  | Hairline borders and dividers.                                  |
| `s0`–`s3` | Surface depth: base → panel → elevated card → selected/overlay. |

## More principles

- **Hierarchy via contrast, not scale.** Brightness/weight separate levels before size does.
- **Density is intentional.** Choose spacing deliberately; don't pad by accident.
- **Designed for long sessions.** The `soft` palette and dark mode reduce fatigue.

## Typography

- **B612 Mono** — every number, timestamp, identifier, code. Fixed-width digits
  stop value-change jitter. Use `tabular-nums`.
- **B612** — all non-numeric UI: headings, labels, navigation, buttons.
- Headings are uppercase with wide tracking; values are mono and bright (`data`).

## Accessibility

- The `colorblind` palette is the IBM Carbon universal set — distinguishable across
  deuteranopia, protanopia, tritanopia, and AAA-contrast (≥ 7:1) on dark surfaces.
- **Never make color the sole signal.** Always pair it with a text label, icon, or shape.
- Interactive targets: `size.tap.min` = 24px (WCAG 2.2 AA minimum);
  `size.tap.comfortable` = 44px recommended for primary mobile actions.
- Focus is always visible (the `active` role, 2px outline).

## Choosing a palette

| Palette      | Use                                                |
| ------------ | -------------------------------------------------- |
| `standard`   | Default. Aviation-traditional, vivid OKLCH.        |
| `colorblind` | Accessibility-critical or universal audiences.     |
| `soft`       | Long viewing sessions; lower chroma, less fatigue. |
