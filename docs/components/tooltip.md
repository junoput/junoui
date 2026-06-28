# Tooltip

A transient hover/focus label. Pure CSS reveal — no JS. Four placements with an arrow.

## Web

```html
<span class="juno-tooltip">
  <button tabindex="0">SPD</button>
  <span class="juno-tooltip__bubble" role="tooltip">
    Requests / sec · 248
    <span class="juno-tooltip__arrow"></span>
  </span>
</span>

<!-- placements -->
<span class="juno-tooltip__bubble juno-tooltip__bubble--right">…</span>
<span class="juno-tooltip__bubble juno-tooltip__bubble--bottom">…</span>
<span class="juno-tooltip__bubble juno-tooltip__bubble--left">…</span>
```

| Class                                           | Effect                                                   |
| ----------------------------------------------- | -------------------------------------------------------- |
| `.juno-tooltip`                                 | Relative wrapper around the trigger.                     |
| `.juno-tooltip__bubble`                         | `s3` bubble, mono 11px, shadow `2`, `z.anchored` (2000). |
| `--top` (default) `--right` `--bottom` `--left` | Placement of the bubble + arrow.                         |
| `.juno-tooltip__arrow`                          | Rotated-square pointer back to the trigger.              |

Shows on `:hover` or `:focus-within` of the wrapper; `motion.duration.quick` (140ms)
/ `ease.decel` rise.

## Top-layer mode (escaping clipping)

The pure-CSS reveal is clipped if an ancestor sets `overflow`/`clip` (cards, scroll
areas). To lift it above everything, promote the bubble to a `popover="hint"` — it then
renders in the browser **top layer**, immune to ancestor clipping. The bubble already
carries `:popover-open` + anchor-positioning styles; a tiny stateless enhancer toggles it
and points `position-anchor` at the trigger:

```js
const name = `--juno-tip-${i}`;
trigger.style.anchorName = name;
bubble.style.positionAnchor = name;
bubble.popover = 'hint';
trigger.addEventListener('pointerenter', () => bubble.showPopover());
trigger.addEventListener('pointerleave', () => bubble.hidePopover());
trigger.addEventListener('focus', () => bubble.showPopover());
trigger.addEventListener('blur', () => bubble.hidePopover());
```

(`showcase/app.js` ships this as `initTooltips()`.) With no enhancer the component still
works as the CSS-only hover tooltip — just clippable by its container.

## Anatomy (any platform)

- Bubble offset `space.8` from the trigger edge; small rise on reveal.
- Content is mono (codes/values); single line (`white-space: nowrap`).

## Usage

- Reference text only — never put focusable controls in a tooltip (use a [popover](./popover.md)).
- Give the trigger a tabstop and the bubble `role="tooltip"` + `aria-describedby` so it
  reveals on keyboard focus, not just hover.
