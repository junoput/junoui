# Icon

A zero-JS inline-SVG glyph. Icons ship as one **SVG sprite** of `<symbol>`s; you
reference a symbol with `<use>`. The glyph inherits the current text color and sizes
in `em`, so it tracks `font-size` and the `[data-juno-text]` scale.

Set ships [Phosphor Icons](https://phosphoricons.com) (bold weight) — MIT-licensed,
free to redistribute and sell. The bundle carries the license in `src/icons/LICENSE`
and a banner in the generated sprite; keep both when you ship.

## Web

```html
<!-- decorative — hide from assistive tech -->
<svg class="juno-icon" aria-hidden="true">
  <use href="node_modules/junoui/dist/icons/juno-icons.svg#juno-i-gear" />
</svg>

<!-- meaningful — label it -->
<svg class="juno-icon juno-icon--lg juno-icon--role juno--warning" role="img" aria-label="Warning">
  <use href="…/juno-icons.svg#juno-i-warning" />
</svg>
```

Import path: `junoui/icons` resolves to the sprite.

| Class              | Effect                                                        |
| ------------------ | ------------------------------------------------------------- |
| `.juno-icon`       | 1.25em square, `fill: currentColor`, baseline-aligned inline. |
| `.juno-icon--sm`   | 1em (matches surrounding text).                               |
| `.juno-icon--lg`   | 1.75em.                                                       |
| `.juno-icon--xl`   | 2.5em.                                                        |
| `.juno-icon--role` | Tint with `var(--juno-role)` instead of inherited text color. |
| `--juno-icon-size` | Override the size directly (any length).                      |

## Sizing & color

- **Color** is `currentColor`: an icon inside colored text matches it. Add
  `.juno-icon--role` + a `.juno--<role>` ancestor (or set `--juno-role`) to tint by
  status. Always pair a status color with a text label — color is never the only signal.
- **Size** is `em`-relative, so icons grow with the type scale and stay proportional
  inside buttons / inputs. For a fixed pixel size set `--juno-icon-size: 20px`.

## Adding / changing icons

Drop an SVG into `src/icons/` (must use `currentColor`, a `viewBox`), then
`npm run build:icons` (part of `npm run build`). The file name becomes the symbol id
`juno-i-<name>`. Swapping icon sets is a source change in `src/icons/` — keep the new
set's license file alongside.
