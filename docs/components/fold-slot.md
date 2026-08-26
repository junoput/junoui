# Fold slot

Animated presence for a member of any flex/grid row: instead of popping in and
out of the DOM, the slot's width folds to zero, it fades, and at the end of the
fold it leaves the tab order (`visibility`, discretely transitioned — instant
coming in, end-of-fade going out). Keep the element mounted; flip
`data-juno-in`. Zero JS.

## Web

```html
<div class="juno-pillbar">
  <button class="juno-fold juno-pillbar__item" data-juno-in aria-label="Scroll to top">
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

## Composing it with a component class

The canonical use puts `.juno-fold` on an element that already carries a
component class — `.juno-pillbar__item`, `.juno-btn`, `.juno-chip` — because that
is where the capsule chrome (tap target, padding, hover, focus ring,
`aria-pressed`) lives. The fold is built for that, and two things about it are
worth knowing rather than rediscovering:

**Which floors it releases.** A border-box inline size has exactly three inputs
that can hold it above zero, and the folded state releases all three:
`min-inline-size` (a component's tap floor), `padding-inline`, and
`border-inline-width`. Each is in the fold's transition list too, so the content
neither snaps sideways as the fold starts nor jumps to full width when the slot
opens. Composed with `.juno-pillbar__item` and none of them released, the folded
slot lays out at 44px — the tap target — and the row never closes.

**It takes over the element's `transition`.** `transition` is a shorthand: two
rules setting it do not merge, the winner replaces the loser's whole list. The
fold's declarations are stated at attribute specificity so it wins that, and its
list therefore also carries the chrome properties (`color`, `background-color`)
the components animate — composing costs the capsule nothing. A component of your
own that composes with `.juno-fold` and needs a third property transitioned
should state it at higher specificity than `.juno-fold[data-juno-in]` (0,2,0),
repeating the fold's own entries, or the fold's list wins and yours is dropped.

- The row's own width follows the slot, so the whole row slides open/closed.
- `prefers-reduced-motion`: handled by the base layer (states still apply,
  transition durations collapse).
- Canonical use: transient toolbar actions — a scroll-to-top arrow, a
  contextual button — whose arrival should slide the row rather than jump it.
