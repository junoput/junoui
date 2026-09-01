---
'@junoput01/junoui': minor
---

**Splitter — the resize separator's affordance and ARIA contract, not its state machine.**

`layout.md` places drag-resizable panels outside junoui's line, and **it still does**: there is no pointer capture here, no width arithmetic, no persistence, no collapse policy. What ships is the half junoui already claims elsewhere — `.juno-gesture-surface`'s CSS without the recognizer, `.juno-pillbar`'s geometry props without the collapse policy.

**The hit area is the point, alongside the ARIA.** A 1px separator is a 1px target: fine for a carefully aimed mouse, a coin flip on a trackpad, unusable with a finger. So the element is tap-sized and the line is painted inside it — and the hit area _overlaps_ its neighbours rather than displacing them, because a consumer that laid out a 44px gap to hold the handle would have that gap on desktop too. `--juno-size-tap-min` promotes on a coarse pointer, so the handle widens on touch without the component knowing what a phone is.

**The keyboard model**, which is the part consumers omit: arrows resize along the separator's own axis (a _vertical_ separator divides panes side by side, so Left/Right move it — the axis names the separator, not the motion), Page keys move ten steps, Home/End reach the declared extremes, Enter asks for collapse. An arrow that does not apply is left alone, so a Down arrow on a vertical splitter still scrolls the page.

```js
import { enhanceSplitter } from 'junoui/splitter';
enhanceSplitter(el, { step: 16 });
el.addEventListener('juno-splitter-move', (e) => setPanelWidth(e.detail.value));
```

Stateless: it clamps a requested value into `[aria-valuemin, aria-valuemax]` and asks. It never writes `aria-valuenow` — whether a pane can actually be 320px wide is a layout question only the app can answer. Collapse is a separate event from a move to the minimum, because an app that restores the previous width needs to know which happened.

`layout.md` now states where the line falls for this case rather than leaving each consumer to assume it.
