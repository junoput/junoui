# Fold slot

Animated presence for a member of any flex/grid row: instead of popping in and
out of the DOM, the slot's width folds to zero, it fades, and at the end of the
fold it leaves the tab order (`visibility`, discretely transitioned — instant
coming in, end-of-fade going out). Keep the element mounted; flip
`data-juno-in`. Zero JS.

## Web

```html
<div class="juno-pillbar">
  <button class="juno-fold" data-juno-in aria-label="Scroll to top">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-arrow-up" /></svg>
  </button>
  …other members…
</div>
```

| Class / prop       | Effect                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `.juno-fold`       | The slot: definite width (`--juno-fold-size`), folds shut when `data-juno-in` is absent.                                        |
| `[data-juno-in]`   | Present state — app-set. Absent = folded away, invisible, out of the tab order.                                                 |
| `--juno-fold-size` | The slot's open width (default `size.tap.comfortable`) — must be definite, transitions cannot run to an intrinsic size.         |
| `--juno-fold-gap`  | The row's flex/grid gap (default `0px`) — the folded slot swallows one gap with a negative margin so the row closes completely. |

- The row's own width follows the slot, so the whole row slides open/closed.
- `prefers-reduced-motion`: handled by the base layer (states still apply,
  transition durations collapse).
- Canonical use: transient toolbar actions — a scroll-to-top arrow, a
  contextual button — whose arrival should slide the row rather than jump it.
