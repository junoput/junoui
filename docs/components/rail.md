# Rail

The side navigation column of the standard app shell — brand block on top, then
icon + label items. Collapsible to icons-only. The full shell composition
(rail + topbar + content + slide-over) is in [layout.md](../layout.md#app-shell).
On phone widths the shell swaps the rail for a [dock](./dock.md) (bottom nav).

## Web

```html
<nav class="juno-rail" aria-label="Primary">
  <div class="juno-rail__brand">JUNO</div>
  <a class="juno-rail__item" href="/library" aria-current="page">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-squares-four" /></svg>
    <span class="juno-rail__label">Library</span>
  </a>
  <a class="juno-rail__item" href="/nodes">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-hexagon" /></svg>
    <span class="juno-rail__label">Nodes</span>
  </a>
</nav>
```

| Class / prop            | Effect                                                          |
| ----------------------- | --------------------------------------------------------------- |
| `.juno-rail`            | `s1` column, 180px, 1px `border` seam on the inline-end edge.   |
| `.juno-rail__brand`     | Mono uppercase brand block.                                     |
| `.juno-rail__item`      | Icon + label row; hover `s2`.                                   |
| `.juno-rail__label`     | The text — hidden when collapsed.                               |
| `[aria-current]`        | Active item: `s3` fill + 2px role edge. Attribute, not a class. |
| `.juno-rail--collapsed` | Icons-only, `space.56` wide; width transition.                  |
| `--juno-rail-width`     | Override the expanded width.                                    |
| `.juno--<role>`         | Active-edge color (default `active`).                           |

## Anatomy (any platform)

- Column on `s1`, hairline seam, items `space.8` × `space.16`, `font.size.12`
  uppercase `label` → `data` on hover/active.
- Active = `s3` fill + `border.width.2` inline-start edge in the role color.
- Edges are logical: the rail mirrors under RTL.

## Usage

- The app owns the collapse state (a class toggle) and sets `aria-current="page"`
  on the active item — junoui styles the attribute so nav semantics stay honest.
- When collapsed, labels leave the accessibility tree: give each item an
  `aria-label` (or `title`) so icons-only mode stays navigable.
- Pair with [tooltip](./tooltip.md) for collapsed-item labels.
