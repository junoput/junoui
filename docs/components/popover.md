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
- **Following the flip needs script; junoui ships the CSS, not an enhancer.**
  `getComputedStyle(panel).positionArea` reflects the RESOLVED area after a fallback
  fires, so a consumer that wants to flip an arrow to match can read it — same shape as
  the [tooltip](./tooltip.md)'s top-layer mode. Don't match against a literal string:
  read it once when the panel opens uncrowded and again in the case you care about, and
  compare against THAT reading rather than a hardcoded value — Chromium serializes the
  authored logical `block-end span-inline-start` back as the physical `end span-end` /
  `end span-start`, not as the logical spelling you wrote, and that serialization is
  one engine's choice, not part of the spec's contract. Three limits: the resolved
  value names the area, not _which_ fallback produced it, so two different crowding
  conditions can read back identically; there is no CSS selector for it at all — this
  is JS-only; and it was only measured in Chromium — Safari and Firefox may serialize
  differently, or not support `position-area`/`position-try-fallbacks` at all, so treat
  the property's availability and spelling as something to feature-detect, not assume.

## Usage

- Reach for a popover when the content is interactive; a tooltip when it's just text.
- `popovertarget` makes the `<button>` toggle the panel and exposes `aria-expanded` /
  `aria-details` implicitly — no script needed. Keep `aria-haspopup` for intent.
- Default anchoring is block-end / inline-end. Override with `position-area` (or set
  `inset` on the panel's `toggle` event) for other placements or older engines.
