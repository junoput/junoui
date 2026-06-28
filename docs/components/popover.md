# Popover

An anchored, click-triggered surface for rich, interactive content — filters,
quick-edits, detail cards. Unlike a [tooltip](./tooltip.md) it holds focusable controls
and persists until dismissed.

Built on the **native Popover API**: the panel lives in the browser **top layer**, so
it is _never_ clipped by an ancestor's `overflow`/`transform` and never fights
`z-index`. A `popovertarget` button is its **implicit anchor**; CSS anchor positioning
pins the panel below, inline-end aligned. Open/close, light-dismiss (outside click),
and ESC are all the platform's job — **zero JS**.

## Web

```html
<button popovertarget="pf" aria-haspopup="dialog">RANGE FILTER ▾</button>
<div class="juno-popover" id="pf" popover role="dialog" aria-label="Range filter">
  <!-- any controls -->
  <span class="juno-popover__arrow"></span>
</div>
```

| Class                  | Effect                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| `.juno-popover`        | 280px `s2` panel, radius `5`, shadow `2`. Top-layer, anchor-pinned. |
| `.juno-popover__arrow` | Pointer back to the anchor (top-end corner).                        |
| `.juno-popover-anchor` | Optional inline wrapper to group trigger + panel (layout only).     |

## Anatomy (any platform)

- Top-layer surface `s2` + `shadow.2`, surface-padding. Pinned below the invoker
  (`position-area: block-end span-inline-start`) with a `space.12` gap; flips to stay
  on-screen via `position-try-fallbacks`.
- Enter: rise + fade, `motion.duration.quick` / `ease.decel`, animated open↔closed with
  `@starting-style` + `transition-behavior: allow-discrete`.

## Usage

- Reach for a popover when the content is interactive; a tooltip when it's just text.
- `popovertarget` makes the `<button>` toggle the panel and exposes `aria-expanded` /
  `aria-details` implicitly — no script needed. Keep `aria-haspopup` for intent.
- Default anchoring is block-end / inline-end. Override with `position-area` (or set
  `inset` on the panel's `toggle` event) for other placements or older engines.
