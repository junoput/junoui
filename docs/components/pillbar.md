# Pillbar

A floating pill-shaped bar hovering above the content's bottom edge — the
iOS-style alternative to the full-width [dock](./dock.md). Holds 2–5 icon
actions or destinations; mix nav links and toggle buttons, separated by an
optional divider. Zero JS.

## Web

```html
<nav class="juno-pillbar" aria-label="Primary">
  <a class="juno-pillbar__item" href="/library" aria-current="page" aria-label="Library">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-squares-four" /></svg>
    <span class="juno-pillbar__label">Library</span>
  </a>
  <a class="juno-pillbar__item" href="/albums" aria-label="Albums">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-images" /></svg>
  </a>
  <span class="juno-pillbar__sep"></span>
  <button class="juno-pillbar__item" aria-label="Sync">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-arrows-clockwise" /></svg>
  </button>
</nav>
```

| Class / prop           | Effect                                                                 |
| ---------------------- | ---------------------------------------------------------------------- |
| `.juno-pillbar`        | Sticky floating pill: blurred translucent `s1`, hairline, `shadow.2`.  |
| `.juno-pillbar__item`  | Round tap target ≥ `size.tap.comfortable`; icon with optional label.   |
| `.juno-pillbar__label` | Inline text next to the icon — truncates at 12ch.                      |
| `.juno-pillbar__sep`   | Vertical hairline between item groups (e.g. destinations vs. actions). |
| `[aria-current]`       | Active destination: `s3` pill fill + role color. Attribute, not class. |
| `[aria-pressed]`       | Same active look for toggle buttons.                                   |
| `.juno--<role>`        | Active color (default `active`).                                       |

## Anatomy (any platform)

- Fully-rounded capsule floating `space.16` off the bottom edge (plus the safe
  area), centered inline; translucent `s1` with a background blur, hairline
  `border`, `shadow.2` lift.
- Items are capsule targets at least `size.tap.comfortable` square; the active
  one fills `s3` and takes the role color.
- A separator is a `border`-colored vertical hairline, `space.20` tall.
- **Motion.** A tap scales the item down (`motion.duration.instant`) and it springs
  back on release; color/fill transitions run at `quick`. See [motion.md](../motion.md).

## Usage

- Same rules as the dock: 3–5 destinations, overflow goes behind a "More" item.
  Pick **one** bottom pattern per screen — dock _or_ pillbar, never both.
- Sticky, not fixed: place it last inside the scrolling column; it floats over
  content while staying in flow.
- Icon-only items need `aria-label`. Show the label on the active item (or all
  items) when space allows.
- Nav destinations are `<a>` with `aria-current="page"`; momentary or toggle
  actions are `<button>` (toggles flip `aria-pressed`).
- Works inside a [navbar](./navbar.md) + tab-stack shell — the recipe is in
  [layout.md](../layout.md#app-shell).
