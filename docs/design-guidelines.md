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

## Foundation tokens (motion, layering, depth, opacity)

These scales exist so transitions, overlays, and surfaces stay consistent. junoui
ships the values; stateful behavior (open/close, positioning, focus traps) lives in
apps. Exact values: [tokens-reference.md](./tokens-reference.md).

- **Motion.** `--juno-motion-duration-{fast,base,slow}` + `--juno-motion-ease-{standard,in,out}`.
  `fast` for micro feedback, `base` for most transitions, `slow` for overlays. Use
  `ease-out` for entering, `ease-in` for leaving, `ease-standard` otherwise. Always
  inside a `transition`/`animation`; `prefers-reduced-motion` already collapses these
  in `base.css`.
- **Z-index.** `--juno-z-*` is the single layering source of truth — never invent raw
  z-index. Order: `raised` < `sticky` < `dropdown` < `overlay` < `modal` < `popover`
  < `toast`. Gaps between steps leave room to slot custom layers.
- **Elevation.** Depth is **border-first** by design. Reach for `--juno-shadow-{1,2,3}`
  only when a surface genuinely lifts off the page (dropdown, popover, modal) — `1`
  subtle, `2` floating, `3` top layer.
- **Opacity.** `--juno-opacity-disabled` for inert controls, `--juno-opacity-muted`
  for de-emphasised content, `--juno-opacity-scrim` for a modal/drawer backdrop.

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
