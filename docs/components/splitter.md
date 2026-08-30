# Splitter (resize separator)

The handle between two panes: a side panel over a canvas, an editor beside a
preview, a list beside a detail.

## Where the line is

`layout.md` says behaviour that needs state belongs in your app. **It still
does.** junoui ships no resize state machine here — no pointer capture, no width
arithmetic, no persistence, no collapse policy.

What it ships is the half it already claims elsewhere: `.juno-gesture-surface`'s
CSS without the recognizer, `.juno-pillbar`'s geometry props without the collapse
policy. Here that is **the affordance, its hit area, and the ARIA contract** —
the part consumers omit, and the part that is identical in every app with two
panes.

**The app owns the number.** It writes the position into `aria-valuenow` and
moves the pane when the separator asks.

## Web

```html
<div
  class="juno-splitter"
  role="separator"
  tabindex="0"
  aria-orientation="vertical"
  aria-label="Resize panel"
  aria-valuenow="320"
  aria-valuemin="180"
  aria-valuemax="640"
></div>
```

```js
import { enhanceSplitter } from 'junoui/splitter';

enhanceSplitter(el, { step: 16 });
el.addEventListener('juno-splitter-move', (e) => setPanelWidth(e.detail.value));
el.addEventListener('juno-splitter-collapse', () => togglePanel());
```

| Class / prop           | Effect                                                 |
| ---------------------- | ------------------------------------------------------ |
| `.juno-splitter`       | The separator. Tap-sized target, hairline paint.       |
| `--juno-splitter-line` | The painted hairline (default `border.width.1`).       |
| `--juno-splitter-hit`  | The hit area (default `size.tap.min`).                 |
| `[aria-orientation]`   | `vertical` (default) or `horizontal`. Drives the axis. |
| `[data-juno-dragging]` | App-set while a drag is in progress.                   |

## The hit area is not the line

A 1px separator is a 1px target — fine for a carefully aimed mouse, a coin flip
on a trackpad, unusable with a finger. So the **element** is tap-sized and the
**line** is painted inside it: grow the target, not the rule.
`--juno-size-tap-min` promotes to 44px on a coarse pointer through the base
layer, so the handle widens on touch without this component knowing what a phone
is.

The hit area is centred on the boundary and **overlaps** its neighbours rather
than displacing them — a consumer that laid out a 44px gap to hold it would have
a 44px gap on desktop too.

## The ARIA contract

This is the reason the component is upstream.

- **`role="separator"`** with `tabindex="0"`. A focusable separator is a widget;
  without the tabindex it is decoration and the keyboard model below is
  unreachable.
- **`aria-orientation`** — `vertical` (the default) divides panes _side by side_.
  The axis names the separator, not the motion.
- **`aria-valuenow` / `-valuemin` / `-valuemax`** — the position and its range.
  A separator without them announces "separator" and nothing else.
- **`aria-label`** or `aria-labelledby`. "Separator" is a role, not a name.

### Keyboard

| Key                 | Action                                      |
| ------------------- | ------------------------------------------- |
| ← / →               | Move a **vertical** separator by one step   |
| ↑ / ↓               | Move a **horizontal** separator by one step |
| Page Up / Page Down | Move by ten steps                           |
| Home / End          | Go to minimum / maximum                     |
| Enter               | Toggle collapse                             |

Arrow keys that do not apply to the current orientation are **left alone**, so a
Down arrow on a vertical splitter scrolls the page as it should rather than being
swallowed.

`enhanceSplitter` is stateless: it computes a requested value from
`aria-valuenow`, clamps it into the declared range, and dispatches
`juno-splitter-move` / `juno-splitter-collapse` (bubbling, cancelable,
`detail.value`). It never writes the attribute — whether a pane can actually be
320px wide is a layout question only your app can answer.

Collapse is a **separate event** from a move to the minimum, because they are
different questions: "put this pane away" survives a later resize, and an app
that restores to the previous width needs to know which one happened.

## What junoui does not do

Pointer dragging. Attach your own `pointerdown`/`pointermove` — the element sets
`touch-action: none` so a drag never scrolls — and set `[data-juno-dragging]`
while it runs so the handle shows its active state.
