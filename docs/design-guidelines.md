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

| Role            | Use                                                                |
| --------------- | ------------------------------------------------------------------ |
| `data`          | Primary numeric readouts and live values — the brightest text.     |
| `data-dim`      | Faint metadata — timestamps, tick labels. Decorative; below muted. |
| `label`         | Labels, units, helper and secondary text. Never for values.        |
| `muted`         | Disabled, placeholder, decorative separators.                      |
| `border`        | Hairline borders and dividers.                                     |
| `border-strong` | Divider / stronger rule — heavier than the hairline border.        |
| `s0`–`s3`       | Surface depth: base → panel → elevated card → selected/overlay.    |

## More principles

- **Hierarchy via contrast, not scale.** Brightness/weight separate levels before size does.
- **Density is intentional.** Choose spacing deliberately; don't pad by accident.
  Switch the whole UI between comfortable and compact with one attribute (below).
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

- **Motion.** Durations `--juno-motion-duration-{instant,quick,base,deliberate}`
  (80·140·200·300ms) and easings `--juno-motion-ease-{decel,accel,standard,spring}`.
  `instant` for state feedback, `quick` for tooltip/menu, `base` for popover/drawer,
  `deliberate` for modal/scrim. Enter with `decel`, exit with `accel`, reposition with
  `standard`, toggle with `spring`. Always inside a `transition`/`animation`;
  `prefers-reduced-motion` already collapses these in `base.css`.
- **Z-index.** `--juno-z-*` is the single layering source of truth — never invent raw
  z-index. Layer stack: `surface` (0) < `raised` (100) < `anchored` (2000, menu ·
  popover · tooltip) < `overlay` (4000, modal · drawer + scrim) < `alert` (5000, toast).
  Large gaps leave room for app layers.
- **Elevation.** Depth is **border-first** by design; elevation = z-index + shadow,
  paired. Reach for `--juno-shadow-{1,2,3}` only when a surface lifts off the glass —
  `1` raised card, `2` anchored (menu/popover/tooltip), `3` overlay (modal/drawer).
- **Opacity.** `--juno-opacity-disabled` for inert controls, `--juno-opacity-muted`
  for de-emphasised content, `--juno-opacity-scrim` for a modal/drawer backdrop.

## Density

One attribute on any ancestor swaps the internal padding of every component
underneath it — no per-component class:

```html
<body data-juno-density="compact">
  <!-- comfortable (default) needs no attribute -->
</body>
```

Components read **semantic padding aliases** (`--juno-pad-control-*`,
`--juno-pad-surface-*`, `--juno-gap-control`) instead of raw `--juno-space-*`;
`data-juno-density` redefines that set. Density is deliberately **non-linear** —
compact removes more block (vertical) than inline padding, so text never crowds its
edges. Interactive controls keep their `min-height` (WCAG tap target); only padding
shrinks. New components should use the aliases for internal padding to inherit
density for free; add a new archetype only when one is genuinely needed.

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
| `standard`   | Default. Vivid, high-contrast OKLCH.               |
| `colorblind` | Accessibility-critical or universal audiences.     |
| `soft`       | Long viewing sessions; lower chroma, less fatigue. |
