# Tree / outliner

Nested rows at arbitrary depth with disclosure, selection and a reorder handle.
Layer stacks, file browsers, settings trees, org charts, comment threads, nested
navigation. `.juno-list` is flat and `.juno-accordion` is single-level; this
nests.

## Web

```html
<ul class="juno-tree" role="tree" aria-label="Scene">
  <li
    class="juno-tree__item"
    role="treeitem"
    aria-level="1"
    aria-expanded="true"
    aria-selected="false"
  >
    <div class="juno-tree__row">
      <button class="juno-tree__caret" tabindex="-1" aria-hidden="true"></button>
      <svg class="juno-icon juno-tree__icon" aria-hidden="true"><use href="…#juno-i-stack" /></svg>
      <span class="juno-tree__label">Basemap</span>
      <span class="juno-tree__count">3</span>
      <span class="juno-tree__trail"><span class="juno-badge juno--nominal">ON</span></span>
      <button class="juno-tree__handle" aria-label="Reorder Basemap"></button>
    </div>
    <ul class="juno-tree__group" role="group">
      <li class="juno-tree__item" role="treeitem" aria-level="2" aria-selected="true">…</li>
    </ul>
  </li>
</ul>
```

| Class / prop         | Effect                                                                   |
| -------------------- | ------------------------------------------------------------------------ |
| `.juno-tree`         | The `role="tree"` root. Sets `--juno-tree-indent`.                       |
| `.juno-tree__item`   | One `role="treeitem"`. Carries `aria-expanded` / `-level` / `-selected`. |
| `.juno-tree__group`  | A nested `role="group"`. One indent step; depth is structural.           |
| `.juno-tree__row`    | The focusable line. Holds the tap floor.                                 |
| `.juno-tree__caret`  | Disclosure triangle; rotates on `aria-expanded="true"`.                  |
| `.juno-tree__count`  | Count badge slot on a group row.                                         |
| `.juno-tree__trail`  | Trailing-control slot, as on `.juno-list__row`.                          |
| `.juno-tree__handle` | Reorder affordance and its hit area.                                     |
| `--juno-tree-indent` | One indent step (default `space.16`).                                    |

Expansion and collapse are `aria-expanded` on the item — the app owns it, as with
`aria-pressed` elsewhere in junoui. No JS is needed for the visuals.

## The ARIA contract

This is the half apps get wrong, so it is stated rather than implied.

- **`role="tree"`** on the root, with an accessible name (`aria-label` or
  `aria-labelledby`). **`role="group"`** on every nested list, **`role="treeitem"`**
  on every item.
- **`aria-level`** on every item, 1-based. Required: the nesting is visual, and
  a screen reader does not infer depth from indentation.
- **`aria-expanded`** on branches only. **Its absence is what makes an item a
  leaf** — do not put `aria-expanded="false"` on a childless row, or it is
  announced as a collapsed branch that never opens.
- **`aria-selected`** for what the next action applies to. Distinct from
  `aria-current` (which node you are _on_) and from `:hover`. A layer stack has
  all three at once, which is why they paint differently.
- **Roving tabindex**: exactly one row has `tabindex="0"`, the rest `-1`. One Tab
  stop for the whole tree, not one per node.
- **Multi-select** is `aria-multiselectable="true"` on the root plus
  `aria-selected` on each item.

### Keyboard

| Key          | Action                                                          |
| ------------ | --------------------------------------------------------------- |
| ↓ / ↑        | Next / previous **visible** item, across levels                 |
| →            | Closed branch: expand. Open branch: first child. Leaf: nothing. |
| ←            | Open branch: collapse. Otherwise: parent.                       |
| Home / End   | First / last visible item                                       |
| Enter, Space | Select                                                          |
| `*`          | Expand every sibling at this level                              |

A tree without this is a list of buttons wearing tree roles. Because it is
behaviour, no stylesheet can ship it — so junoui ships a stateless enhancer:

```js
import { enhanceTree } from 'junoui/tree';
const stop = enhanceTree(document.querySelector('.juno-tree'));
```

It stores nothing: expansion and selection live on the DOM and belong to you. It
moves focus and dispatches `juno-tree-toggle` / `juno-tree-select` (bubbling,
cancelable, `detail.item`) — it does **not** expand, collapse, select or reorder,
because in a real outliner expanding a node may need to load it.

## Touch

The row holds `--juno-size-tap-min`, which becomes the 44px comfortable target on
a coarse pointer. The caret and the handle **paint** small so a dense tree stays
dense, and grow only their **hit area** with a transparent overlay — a 44px
painted caret would swallow the row it sits in.

**The reorder handle is explicit, and that is not a style choice.** Long-press-drag
is the obvious gesture and the wrong one: a tree sitting on or beside a pan/zoom
surface has to let the pan win, and a gesture that means "reorder" here and "pan"
one pixel to the left is a coin flip. The handle carries `touch-action: none` on
itself alone, so dragging it never scrolls while the rest of the row still pans.

## What junoui does not do

Reorder **logic** — the drop calculation, the model mutation, autoscroll. junoui
ships the affordance, its hit area, and the drop-target styling
(`data-juno-drop="before|after|into"`, plus `data-juno-dragging`). A drop lands
_between_ rows by default: the edge line says "between", a filled highlight says
"into this one", and those are different operations in a tree.
