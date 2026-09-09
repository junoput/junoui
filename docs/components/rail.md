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

| Class / prop             | Effect                                                                                                                                                                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.juno-rail`             | `s1` column, 180px, 1px `border` seam on the inline-end edge. Also a size container (`container-type: inline-size`) — see auto-collapse below.                                                                                                |
| `.juno-rail__brand`      | Mono uppercase brand block.                                                                                                                                                                                                                   |
| `.juno-rail__item`       | Icon + label row; hover `s2`.                                                                                                                                                                                                                 |
| `.juno-rail__label`      | The text — ellipsis-truncates, and hides (visually and in the a11y tree) when collapsed, manually or automatically.                                                                                                                           |
| `[aria-current]`         | Active item: `s3` fill + 2px role edge. Attribute, not a class.                                                                                                                                                                               |
| `.juno-rail--collapsed`  | Icons-only, `space.56` wide; width transition. App-toggled — see auto-collapse below for the width-driven case.                                                                                                                               |
| `.juno-rail--responsive` | Self-hides where navigation should be a bottom bar (coarse pointer, narrow **or short**); pair with `.juno-dock--responsive` / `.juno-pillbar--responsive`, never with `.juno-hide-from-md` — see [dock-responsive.md](./dock-responsive.md). |
| `--juno-rail-width`      | Override the expanded width.                                                                                                                                                                                                                  |
| `.juno--<role>`          | Active-edge color (default `active`).                                                                                                                                                                                                         |

### Auto-collapse (20260908-005)

The rail also collapses to icon-only **automatically**, with no class, once its
own measured inline size can no longer fit an icon plus a comfortable-density
gap (57px — derived from `--juno-space-16` × 2, `--juno-border-width-2`, the
icon's `1.25em` at `--juno-font-size-12`, and `--juno-gap-control`; see the
derivation in `rail.css`'s own comment and `test/rail-collapse-threshold.test.mjs`).
This is a `@container` query on the rail's own box, not a viewport breakpoint —
it fires whenever something narrows the rail below that floor, including a
rail composed inside a resizable `.juno-sidebar__aside` (see
[layout.md](../layout.md) and `docs/sidebar-behaviour.md`), independent of
whether the app ever toggles `.juno-rail--collapsed` itself.

**Authoring contract change:** because collapse can now happen without the app
choosing it, give every `.juno-rail__item` (and `.juno-rail__brand`, if it
carries its own label) an `aria-label` or `title` **unconditionally**, not
only on the branches where the app itself sets `.juno-rail--collapsed`. A rail
that only added those attributes conditionally on its own collapse toggle can
now go icon-only from width alone and leave items unlabeled.

## Anatomy (any platform)

- Column on `s1`, hairline seam, items `space.8` × `space.16`, `font.size.12`
  uppercase `label` → `data` on hover/active.
- Active = `s3` fill + `border.width.2` inline-start edge in the role color.
- Edges are logical: the rail mirrors under RTL.

## Usage

- The app can force collapse with the `.juno-rail--collapsed` class toggle,
  and sets `aria-current="page"` on the active item — junoui styles the
  attribute so nav semantics stay honest. The rail also collapses on its own
  once it gets too narrow to hold an icon and a label — see auto-collapse
  above — so treat collapse as something that can happen either way, not only
  when you ask for it.
- Whichever way it collapses, labels leave the accessibility tree: give each
  item an `aria-label` (or `title`) unconditionally so icons-only mode stays
  navigable in both cases.
- Pair with [tooltip](./tooltip.md) for collapsed-item labels.
- Adaptive shell: add `.juno-rail--responsive` so the rail self-hides below
  `md` and a paired [dock](./dock.md)/[pillbar](./pillbar.md) takes over — no
  need to hang `.juno-hide-below-md` on the rail yourself.
- Show a section is loading by wrapping an item's icon in an
  [icon-loader](./icon-loader.md) ring.
