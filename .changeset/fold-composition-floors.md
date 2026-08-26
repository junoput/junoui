---
'@junoput01/junoui': patch
---

**fold-slot: the fold now reaches zero when composed with a component class.**
`.juno-fold` promises its inline-size folds to zero, and the canonical use puts it on an element that already carries the capsule chrome — `.juno-pillbar__item`, `.juno-btn`, `.juno-chip`. Composed that way it could not: `min-inline-size` (the 44px tap floor), `padding-inline` and `border-inline-width` each hold a border-box inline size open, and the folded state released none of them. Measured against the built bundle at a 390px viewport, composed with `.juno-pillbar__item`: 44px folded, 20px with the floor released, 0px with all three. A consumer's pill carried one dead 44px slot whenever the folded action was absent.

The folded state now releases all three, and each is in the fold's transition list so nothing snaps as the fold opens or shuts.

Also fixed, and invisible from the source: `transition` is a shorthand, `.juno-fold` was one class of specificity, and `pillbar.css` sorts after `fold-slot.css` — so `.juno-pillbar__item`'s own `transition` replaced the fold's whole list and the slot jumped shut instead of folding. The fold's declarations now sit at attribute specificity, and its transition list carries the chrome properties (`color`, `background-color`) too, since owning the shorthand means owning all of it. A component of your own that composes with `.juno-fold` and needs a third property transitioned must state it above `(0,2,0)`.
