# Dock

The bottom navigation bar of the app shell on narrow viewports — 3–5 primary
destinations as icon-over-label tap targets. The phone-width counterpart of the
[rail](./rail.md); the swap recipe is in [layout.md](../layout.md#app-shell).

## Web

```html
<nav class="juno-dock" aria-label="Primary">
  <a class="juno-dock__item" href="/library" aria-current="page">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-squares-four" /></svg>
    <span class="juno-dock__label">Library</span>
  </a>
  <a class="juno-dock__item" href="/nodes">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-hexagon" /></svg>
    <span class="juno-dock__label">Nodes</span>
  </a>
</nav>
```

| Class / prop        | Effect                                                               |
| ------------------- | -------------------------------------------------------------------- |
| `.juno-dock`        | Sticky bottom `s1` bar, 1px `border` seam on top, safe-area pad.     |
| `.juno-dock__item`  | Equal-width icon-over-label target, ≥ `size.tap.comfortable` tall.   |
| `.juno-dock__label` | The text — truncates with an ellipsis, never wraps.                  |
| `[aria-current]`    | Active item: `s2` fill + 2px role edge on top. Attribute, not class. |
| `.juno--<role>`     | Active-edge color (default `active`).                                |

## Anatomy (any platform)

- Full-width bar on `s1`, hairline seam on the block-start edge; items split the
  width evenly, icon above a `font.size.10` uppercase label.
- Active = `s2` fill + `border.width.2` block-start edge in the role color —
  the rail's active language rotated 90°.
- Bottom padding extends into the safe area (`env(safe-area-inset-bottom)`)
  so the home indicator never covers a target.
- **Motion.** Color, fill, and the active indicator cross-fade over
  `motion.duration.quick`; a tap tints the cell (`s3`) and dips the glyph — native
  tactile feedback, zero JS. See [motion.md](../motion.md).

## Usage

- Keep it to 3–5 destinations; overflow belongs in a "More" item opening a
  [drawer](./drawer.md) or [menu](./menu.md).
- Sticky, not fixed: place it last inside the scrolling column and it pins
  itself without overlapping content (no bottom-padding hacks).
- Pair with the rail via the viewport helpers: `.juno-hide-below-md` on the
  rail, `.juno-hide-from-md` on the dock. One nav is hidden from the
  accessibility tree at a time, so both may share `aria-label="Primary"`.
- The app sets `aria-current="page"` on the active item — junoui styles the
  attribute so nav semantics stay honest.
