# Popover

An anchored, click-triggered surface for rich, interactive content — filters,
quick-edits, detail cards. Unlike a [tooltip](./tooltip.md) it holds focusable controls
and persists until dismissed. junoui ships the surface + arrow; **the app owns**
open/close, positioning, and outside-click / ESC dismiss.

## Web

```html
<div class="juno-popover-anchor">
  <button aria-expanded="true" aria-controls="pf">RANGE FILTER ▾</button>
  <div class="juno-popover" id="pf" role="dialog" aria-label="Range filter">
    <!-- any controls -->
    <span class="juno-popover__arrow"></span>
  </div>
</div>
```

| Class                  | Effect                                                                           |
| ---------------------- | -------------------------------------------------------------------------------- |
| `.juno-popover-anchor` | Relative positioning context for the panel.                                      |
| `.juno-popover`        | 280px `s2` panel, radius `5`, shadow `2`, `z.anchored` (2000), top-end anchored. |
| `.juno-popover__arrow` | Pointer back to the anchor (top-end corner).                                     |

## Anatomy (any platform)

- Anchored layer: `z.anchored` + `shadow.2`. Surface `s2`, surface-padding.
- Enter (app-driven): scale + fade, `motion.duration.base` (200ms) / `ease.decel`.

## Usage

- Reach for a popover when the content is interactive; a tooltip when it's just text.
- Toggle with `[hidden]` and keep `aria-expanded` on the trigger in sync.
- The default anchoring is top/inline-end; reposition in the app (or with CSS anchor
  positioning) for other placements.
