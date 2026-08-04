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
- `.juno-label` reads an optional `--juno-label-size` knob (falls back to
  `--juno-font-size-13`) so a context can resize labels — e.g. a compact list —
  without forking the class: set the custom property on an ancestor, never on
  `.juno-label` itself.
  ```html
  <div style="--juno-label-size: var(--juno-font-size-11)">
    <span class="juno-label">Signal strength</span>
  </div>
  ```

## Date & time

One fixed house format everywhere — no locale drift between screens. This is a
**content convention**, not code: apps do the formatting; junoui specifies what it
looks like.

| What     | Format                    | Example              |
| -------- | ------------------------- | -------------------- |
| Date     | `dd.mm.yyyy`, zero-padded | `05.07.2026`         |
| Time     | 24-hour `HH:MM`(`:SS`)    | `14:32` · `14:32:07` |
| Combined | date first, interpunct    | `05.07.2026 · 14:32` |
| Range    | en-dash, no spaces        | `14:00–15:30`        |
| Open     | trailing en-dash          | `14:00–`             |

Rendering rules:

- Always mono + `tabular-nums` (the [Typography](#typography) value rule) — use
  `.juno-value` or `.juno-mono`, wrapped in `<time>` with the machine-readable ISO
  value: `<time class="juno-mono" datetime="2026-07-05T14:32">05.07.2026 · 14:32</time>`.
- Never AM/PM, never month names in data UI (prose may spell them out).
- Relative time ("2h ago") is app policy; when used, pair it with the absolute
  timestamp in a `title` or adjacent text.

App-side recipe (the `de-DE` locale happens to produce exactly this format):

```js
const fmt = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
fmt.format(date).replace(', ', ' · '); // "05.07.2026 · 14:32"
```

This is the junoui house format. Locale-sensitive consumer products may override it
with `Intl` defaults — deviating is a per-app decision; log it like any other
extension (see [integration.md](./integration.md)).

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

A third value, `auto`, re-densifies for small **coarse-pointer** viewports (phone,
`pointer: coarse` and width ≤ 640px) — a data-heavy layout gets its compact-ish
padding back on a phone without the consumer hand-tracking breakpoints:

```html
<body data-juno-density="auto">
  <!-- comfortable everywhere else; re-densifies only on a narrow touch phone -->
</body>
```

`auto` is **opt-in only** — existing `comfortable`/compact-pinned consumers render
byte-identical, nothing changes silently. It never touches a control's
`min-height`; `--juno-size-tap-min` still only grows (never shrinks) under
`base.css`'s own `@media (pointer: coarse)` rule, so `auto` can't undo the WCAG
tap-target work. Only `--juno-tile-min` / `--juno-gap-content` /
`--juno-pad-surface-inline` shrink, same as `compact`.

## Accessibility

Accessibility is a core design goal, held to published standards — **WCAG 2.2** and
**WAI-ARIA** — with the exact success criteria cited in
[accessibility.md](./accessibility.md).

- The `colorblind` palette is the IBM Carbon universal set — distinguishable across
  deuteranopia, protanopia, tritanopia, and AAA-contrast (≥ 7:1) on dark surfaces
  (WCAG 1.4.6).
- **Never make color the sole signal** (WCAG 1.4.1). Always pair it with a text label,
  icon, or shape.
- Interactive targets: `size.tap.min` = 24px (WCAG 2.5.8, AA); `size.tap.comfortable`
  = 44px (WCAG 2.5.5, AAA) recommended for primary mobile actions.
- Focus is always visible — the `active` role, 2px outline (WCAG 2.4.7 / 2.4.11).

## Choosing a palette

| Palette      | Use                                                |
| ------------ | -------------------------------------------------- |
| `standard`   | Default. Vivid, high-contrast OKLCH.               |
| `colorblind` | Accessibility-critical or universal audiences.     |
| `soft`       | Long viewing sessions; lower chroma, less fatigue. |
