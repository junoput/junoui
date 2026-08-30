# Canvas ink

Marks drawn over **arbitrary imagery** — a photo, a map, a video frame, a camera
feed. Anywhere the background is content rather than one of junoui's surfaces.

## Why this is not just a colour

junoui's contrast story assumes a controlled surface, `s0` through `s3`: every
role colour's ratio is computed against a known background. Over imagery there
is no known background. In one orthophoto a black shadow and a snowfield are
adjacent pixels, so **no single ink colour is legible and no contrast ratio can
be asserted about one**.

The answer is a pair that spans the luminance range. Over a light backing the
halo carries the contrast; over a dark one the ink does. Neither half works
alone, which is why one class applies both.

```html
<figcaption class="juno-canvas-ink">Sector 7 · 1.2 km</figcaption>
<figcaption class="juno-canvas-ink juno-canvas-ink--warning">Signal lost</figcaption>

<svg>
  <path class="juno-canvas-ink__halo" d="…" />
  <path class="juno-canvas-ink__stroke" d="…" />
</svg>

<div class="juno-canvas-scrim">…chrome floating over live content…</div>
```

| Class / token                         | Effect                                           |
| ------------------------------------- | ------------------------------------------------ |
| `.juno-canvas-ink`                    | Text: the ink colour plus a four-offset halo.    |
| `.juno-canvas-ink--lg`                | The wider halo, for `font.size.20` and up.       |
| `.juno-canvas-ink--<role>`            | A status hue at raised chroma, keeping the halo. |
| `.juno-canvas-ink__halo` / `__stroke` | Vector marks: two passes of the same path.       |
| `.juno-canvas-scrim`                  | Backdrop for chrome floating over live content.  |
| `ink.canvas.ink` / `ink.canvas.halo`  | The pair.                                        |
| `ink.canvas.halo-width` / `-lg`       | Outline widths.                                  |
| `ink.vivid.*`                         | Role hues at raised chroma.                      |
| `ink.canvas.scrim`                    | `0.28`, distinct from `opacity.scrim`.           |

## Three things that are decided, not preferences

**The halo is pure black because the arithmetic says so.** The worst backing is
a mid grey, where both halves are weakest at once — not the extremes, which are
the easy cases. The sweep floor there is **4.61:1** against a 4.5:1 requirement.
A tasteful near-black with a blue cast (`#0A0C10`) measures 4.43:1 and fails on
three of 256 grey backings. The pair has roughly 0.1 of headroom, so neither
half can be nudged for looks. `test/canvas-ink.test.mjs` sweeps every grey.

**It is not themed.** A satellite image does not get lighter because the user
chose light mode. Theming the pair would make it track the app's surface, which
is precisely the background it is _not_ over. A test fails if `ink.canvas.ink`
or `ink.canvas.halo` ever appears under a mode or palette selector.

**The scrim is not `opacity.scrim`.** `0.62` is tuned to suppress a modal's
background. Here the background is the thing the chrome is annotating — greying
it out defeats the purpose. `0.28` is the value for content you still want read.

## Four offsets, not one blur

A blurred shadow fades at the glyph's corners, which is exactly where a thin
stroke needs the most help. Four hard offsets cost the same and hold the corners.
In SVG, `paint-order: stroke fill` gives a real stroke and is better; the class
sets both.

## Native

Every target carries these tokens — `INK_CANVAS_INK` / `INK_CANVAS_HALO` in
Rust, `inkCanvasInk` in Swift and Dart. The halo mechanism is yours to apply:
stroke the path twice, or draw text with an outline pass first.
