# Icon loader

A nav destination's icon ringed by the spinning [arc](./loader.md#arc) while
that section loads — the "this section is loading" affordance for a
[rail](./rail.md), [dock](./dock.md), or [pillbar](./pillbar.md) item. The icon
stays static on top; the arc sizes in `em` around it and takes no pointer
events, so the item still clicks through. Zero JS in the CSS — the app toggles
the arc's `--indeterminate` class to start/stop the spin.

## Web

```html
<a class="juno-rail__item" href="/library" aria-current="page">
  <span class="juno-icon-loader">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-squares-four" /></svg>
    <span class="juno-arc juno-arc--indeterminate" role="status" aria-label="Loading"></span>
  </span>
  <span class="juno-rail__label">Library</span>
</a>
```

When the section finishes, remove `.juno-arc--indeterminate` (or the whole
`.juno-arc`). For a progress ring instead of an endless spin, drop
`--indeterminate` and set `--juno-progress` (0–100) on the `.juno-arc`.

| Class / prop              | Effect                                                         |
| ------------------------- | -------------------------------------------------------------- |
| `.juno-icon-loader`       | Positioned wrapper; sizes to the icon, centers the ring on it. |
| `> .juno-icon`            | The static glyph, held above the ring.                         |
| `> .juno-arc`             | The ring — `1.9em`, thin (`0.14em`), pointer-transparent.      |
| `--juno-icon-loader-ring` | Override the ring diameter (default `1.9em`).                  |
| `.juno--<role>`           | Ring color (default `active`).                                 |

## Anatomy (any platform)

- A wrapper the size of the icon; the arc is absolutely positioned and centered
  over it, at a larger diameter so it rings the glyph.
- The ring color is the semantic role; a `.juno--loading`/`.juno--active`
  ancestor tints it.

## Usage

- **Center with `inset: 0; margin: auto`, never `translate(-50%, -50%)`** — the
  arc's rotation animation writes `transform`, which would clobber a translate.
  The component already does this; keep it if you re-roll the markup.
- Gate the spin to first load, not every background refetch — a nav icon that
  blinks on every poll reads as broken. Add `--indeterminate` when a section
  has no data yet; remove it once loaded.
- The arc carries the loading semantics (`role="status"` +
  `aria-label="Loading"`); the icon stays `aria-hidden`. Don't also mark the
  nav item busy — one announcement is enough.
- Respects reduced motion via the arc's own stepped, low-key animation; see
  [loader](./loader.md).
