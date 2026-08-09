# Icon loader

A control ringed by the spinning [arc](./loader.md#arc) while its section
loads — the "this section is loading" affordance for a [rail](./rail.md),
[dock](./dock.md), or [pillbar](./pillbar.md) item. What it wraps stays static
on top; the arc rings it and takes no pointer events, so the item still clicks
through. Zero JS in the CSS — the app toggles the arc's `--indeterminate` class
to start/stop the spin.

This is junoui's **only** concentric-ring mechanism. Anything that wants an arc
around it composes `.juno-icon-loader` rather than re-rolling the geometry — the
[dock](./dock.md#section-loading-ring)'s `__bubble` is the same wrapper with the
ring resized to the bubble.

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

| Class / prop                    | Effect                                                              |
| ------------------------------- | ------------------------------------------------------------------- |
| `.juno-icon-loader`             | Single-cell grid wrapper — every child is centred on the same cell. |
| `> *`                           | The ringed content, held above the ring.                            |
| `> .juno-arc`                   | The ring — pointer-transparent, painted under the content.          |
| `--juno-icon-loader-ring`       | Ring diameter (default `1.9em`, i.e. relative to the glyph).        |
| `--juno-icon-loader-ring-width` | Ring stroke (default `0.14em`).                                     |
| `.juno--<role>`                 | Ring color (default `active`).                                      |

### Ringing something bigger than a glyph

Both dimensions are custom props, so the same wrapper rings a 14px glyph and a
44px bubble. Give the host a **definite** box and set the diameter to it — then
the ring hugs the edge and the box does not resize when the arc appears:

```css
.my-avatar-loader {
  --juno-icon-loader-ring: var(--juno-size-tap-comfortable);
  --juno-icon-loader-ring-width: 2px;

  inline-size: var(--juno-size-tap-comfortable);
  block-size: var(--juno-size-tap-comfortable);
}
```

That is exactly how `.juno-dock__bubble` gets its section-loading ring.

### Ringing an arbitrary control (button, badge, avatar)

The wrapper doesn't care what it wraps — swap the icon for any interactive
control and the ring still hugs it without resizing its box. Set the ring
diameter to the control's own size (its `--juno-size-*` or `em` value) and
the control keeps its own footprint; the wrapper is the only thing that
grows to fit the ring:

```html
<!-- 40px circular icon button -->
<span
  class="juno-icon-loader"
  style="--juno-icon-loader-ring:40px;--juno-icon-loader-ring-width:2px"
>
  <button class="juno-btn juno-btn--icon" aria-label="More">&#8943;</button>
  <span class="juno-arc juno-arc--indeterminate" role="status" aria-label="Loading"></span>
</span>

<!-- 14px inline badge — small ring, use --smooth to avoid stepped jitter -->
<span
  class="juno-icon-loader"
  style="--juno-icon-loader-ring:14px;--juno-icon-loader-ring-width:2px"
>
  <span class="juno-badge juno-badge--micro">3</span>
  <span
    class="juno-arc juno-arc--indeterminate juno-arc--smooth"
    role="status"
    aria-label="Loading"
  ></span>
</span>
```

The ring is `pointer-events: none` and sits under the content (`z-index: 0`
vs. `1`), so a wrapped `<button>` stays fully clickable.

## Anatomy (any platform)

- A wrapper that stacks the ring and what it rings on one centred cell; with no
  explicit size the wrapper sizes to the larger of the two (normally the ring).
- The ring color is the semantic role; a `.juno--loading`/`.juno--active`
  ancestor tints it.

## Usage

- **Concentric via a single-cell grid, never `translate(-50%, -50%)`** — every
  child shares one grid cell (`place-items: center`), so they're centered on
  each other without any `transform`. The arc's rotation animation writes
  `transform`, so a translate-based centering would be clobbered; keep the grid
  approach if you re-roll the markup.
- **Don't hand-roll a second ring.** If a component needs an arc around it,
  compose this class and override the two ring props — one primitive keeps the
  centring gotcha, the pointer-events rule, and the paint order in one place.
  That includes bespoke overlay CSS elsewhere for a "this control is loading"
  ring — delete it and wrap the control in `.juno-icon-loader` instead.
- Below ~24px, add `.juno-arc--smooth` next to `--indeterminate` — the
  default 12-step sweep (see [loader](./loader.md)) reads as jitter at that
  size; `--smooth` makes it a continuous rotation.
- Gate the spin to first load, not every background refetch — a nav icon that
  blinks on every poll reads as broken. Add `--indeterminate` when a section
  has no data yet; remove it once loaded.
- The arc carries the loading semantics (`role="status"` +
  `aria-label="Loading"`); the icon stays `aria-hidden`. Don't also mark the
  nav item busy — one announcement is enough.
- Respects reduced motion via the arc's own stepped, low-key animation; see
  [loader](./loader.md).
