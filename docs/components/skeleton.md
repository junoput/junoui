# Skeleton

A shimmering placeholder that stands in for content not yet loaded — same shimmer as
the [table](./table.md) row skeleton, generalized to text lines, blocks, circles, and
aspect-ratio tiles. Zero JS; honors `prefers-reduced-motion` (shimmer → static) via the
global motion contract.

## Web

```html
<div aria-busy="true" aria-live="polite">
  <span class="juno-skeleton juno-skeleton--circle" style="--juno-skeleton-h: 48px"></span>
  <span class="juno-skeleton juno-skeleton--text" style="inline-size: 60%"></span>
  <span class="juno-skeleton juno-skeleton--text"></span>
  <span class="juno-skeleton juno-skeleton--block"></span>
  <span class="juno-skeleton juno-skeleton--tile"></span>
</div>
```

| Class                    | Effect                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.juno-skeleton`         | Shimmering bar; height `--juno-skeleton-h` (default `space.16`).                                                                                       |
| `.juno-skeleton--text`   | One text line (`1em` tall, soft radius).                                                                                                               |
| `.juno-skeleton--circle` | Round avatar / icon placeholder (square via the height).                                                                                               |
| `.juno-skeleton--block`  | Larger surface (card / media), `space.56` tall.                                                                                                        |
| `.juno-skeleton--tile`   | Content-box mode: sized by `--juno-skeleton-ratio` instead of a fixed height — the media-grid case (a tile matching a real image/card's aspect ratio). |
| `--juno-skeleton-h`      | Override the height (any length).                                                                                                                      |
| `--juno-skeleton-ratio`  | `.juno-skeleton--tile` only — the aspect ratio (default `1`, e.g. `16 / 9`).                                                                           |

## Usage

- Wrap the loading region in `aria-busy="true"` (and `aria-live="polite"`) so assistive
  tech announces the pending state; swap in the real content when it arrives.
- Mirror the **shape** of the content it replaces — line widths, an avatar circle, a
  tile's aspect ratio — so the layout doesn't jump on load.
- Width is layout-driven: set `inline-size` (e.g. `60%`) per line; height via the variant,
  `--juno-skeleton-h`, or (for `--tile`) `--juno-skeleton-ratio`.

## Anatomy (any platform)

- Solid `s2` fill; the shimmer is a separate overlay layer sliding across on `transform`
  only (never `background-position`), so it animates on the compositor instead of
  repainting the gradient every frame — cheap even with hundreds of skeletons on screen.
  Highlight band `s3` at 70% opacity, 1.2s ease-in-out loop. Radius `3` (block/tile `4`,
  text `2`). Static fill under reduced motion.
