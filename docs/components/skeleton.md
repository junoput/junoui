# Skeleton

A shimmering placeholder that stands in for content not yet loaded — same shimmer as
the [table](./table.md) row skeleton, generalized to text lines, blocks, and circles.
Zero JS; honors `prefers-reduced-motion` (shimmer → static).

## Web

```html
<div aria-busy="true" aria-live="polite">
  <span class="juno-skeleton juno-skeleton--circle" style="--juno-skeleton-h: 48px"></span>
  <span class="juno-skeleton juno-skeleton--text" style="inline-size: 60%"></span>
  <span class="juno-skeleton juno-skeleton--text"></span>
  <span class="juno-skeleton juno-skeleton--block"></span>
</div>
```

| Class                    | Effect                                                           |
| ------------------------ | ---------------------------------------------------------------- |
| `.juno-skeleton`         | Shimmering bar; height `--juno-skeleton-h` (default `space.16`). |
| `.juno-skeleton--text`   | One text line (`1em` tall, soft radius).                         |
| `.juno-skeleton--circle` | Round avatar / icon placeholder (square via the height).         |
| `.juno-skeleton--block`  | Larger surface (card / media), `space.56` tall.                  |
| `--juno-skeleton-h`      | Override the height (any length).                                |

## Usage

- Wrap the loading region in `aria-busy="true"` (and `aria-live="polite"`) so assistive
  tech announces the pending state; swap in the real content when it arrives.
- Mirror the **shape** of the content it replaces — line widths, an avatar circle — so
  the layout doesn't jump on load.
- Width is layout-driven: set `inline-size` (e.g. `60%`) per line; height via the variant
  or `--juno-skeleton-h`.

## Anatomy (any platform)

- `s2`→`s3`→`s2` horizontal gradient, `background-size: 200%`, animated 1.2s ease-in-out
  loop. Radius `3` (block `4`, text `2`). Static fill under reduced-motion.
