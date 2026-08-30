---
'@junoput01/junoui': minor
---

**Tree / outliner — nested rows, disclosure, selection, reorder.**

`.juno-list` is flat and `.juno-accordion` is single-level. `.juno-tree` nests to arbitrary depth and carries a selection, a count slot, the same trailing-control slot `.juno-list__row` has, and a reorder handle. For layer stacks, file browsers, settings trees, org charts, comment threads and nested navigation.

**Zero JS for the visuals.** Indentation comes from the nested `role="group"` lists the ARIA pattern already requires, so depth is structural — no per-row custom property, no level number to keep in sync with `aria-level`. Collapse is `[aria-expanded="false"]` on the item, which the app owns, exactly like `aria-pressed` elsewhere.

**Keyboard is not optional and is not CSS.** A tree without arrow-key traversal and a roving tabindex is a list of buttons wearing tree roles, so junoui ships a stateless enhancer at `junoui/tree`:

```js
import { enhanceTree } from 'junoui/tree';
const stop = enhanceTree(document.querySelector('.juno-tree'));
```

It stores nothing — expansion and selection live on the DOM and belong to you. It moves focus and dispatches `juno-tree-toggle` / `juno-tree-select` (bubbling, cancelable, `detail.item`); it does not expand, collapse, select or reorder, because expanding a node may need to load it.

**Three states that get conflated are painted separately:** `:hover` is where the pointer is, `aria-current` is which node you are on, `aria-selected` is what the next action applies to. A layer stack has all three at once.

**Touch.** The row holds `--juno-size-tap-min`. The caret and handle paint small so a dense tree stays dense and grow only their _hit area_ — a 44px painted caret would swallow its row. The handle is explicit and carries `touch-action: none` on itself alone: long-press-drag is the obvious gesture and the wrong one, because a tree beside a pan surface has to let the pan win.

Reorder _logic_ stays yours; junoui ships the affordance, its hit area, and the drop styling (`data-juno-drop="before|after|into"`, `data-juno-dragging`) — where a between-rows drop and an into-a-row drop look different, because they are different operations.
