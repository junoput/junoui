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

| Class / prop        | Effect                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `.juno-dock`        | Sticky bottom `s1` bar, 1px `border` seam on top, safe-area pad.                              |
| `.juno-dock__item`  | Equal-width icon-over-label target, ≥ `size.tap.comfortable` tall.                            |
| `.juno-dock__label` | The text — truncates with an ellipsis, never wraps.                                           |
| `[aria-current]`    | Active item: `s2` fill + 2px role edge on top. Attribute, not class.                          |
| `.juno-dock--fixed` | Pin to the viewport foot (`position: fixed`) — for page-scroll shells where sticky won't pin. |
| `.juno--<role>`     | Active-edge color (default `active`).                                                         |

## Anatomy (any platform)

- Full-width bar on `s1`, hairline seam on the block-start edge; items split the
  width evenly, icon above a `font.size.10` uppercase label.
- Active = `s2` fill + `border.width.2` block-start edge in the role color —
  the rail's active language rotated 90°.
- Bottom padding extends into the safe area (`env(safe-area-inset-bottom)`)
  so the home indicator never covers a target.

## Usage

- Keep it to 3–5 destinations; overflow belongs in a "More" item opening a
  [drawer](./drawer.md) or [menu](./menu.md).
- Sticky, not fixed: place it last inside the scrolling column and it pins
  itself without overlapping content (no bottom-padding hacks). Best is the
  [`.juno-app-shell`](../layout.md#app-shell) frame, whose `__main` region is
  the scroller — the dock then sits at the body foot in flow.
- **Short-page caveat:** sticky only pins while the column overflows. If the
  _whole page_ scrolls and content is shorter than the viewport, the dock
  lands mid-content. For that layout use `.juno-dock--fixed` (viewport-pinned)
  and reserve its height at the page foot so it doesn't cover the last row.
- Pair with the rail via the viewport helpers: `.juno-hide-below-md` on the
  rail, `.juno-hide-from-md` on the dock. One nav is hidden from the
  accessibility tree at a time, so both may share `aria-label="Primary"`.
- The app sets `aria-current="page"` on the active item — junoui styles the
  attribute so nav semantics stay honest.
