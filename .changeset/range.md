---
'@junoput01/junoui': minor
---

New component: `.juno-range` — dual-thumb range slider (X7, `20260829-027`).

`.juno-slider` is single-value, so a range today is two sliders side by side and nothing stops the low one passing the high one. This is a track with two thumbs, the span between them filled, and the two rules a two-thumb control has to get right.

**Which thumb does a tap grab?** Two 44px thumbs overlap as soon as their centres are within 44px, which is most of a short track — so this is a rule, not an accident of z-order. **Nearest centre between the thumbs, direction of travel outside them.** Pure nearest-centre ties exactly when the thumbs coincide, which is the case it most needs to answer; pure last-moved is wrong at a limit (both thumbs at max, last-moved is the upper, and the upper cannot move); "keeps the range valid" is under-determined while they are apart. The genuine tie — a tap exactly on two coincident thumbs — goes to `last` if the caller tracks it, else to whichever thumb is not pinned. The property, swept in the tests rather than argued: every tap resolves to a thumb that can actually move toward it, and the resulting pair is always valid.

**What if you drag one past the other?** It **clamps** — it does not swap and it does not push. Swapping changes which bound you are dragging mid-gesture, so `aria-valuenow` on the thumb under the finger silently starts meaning the other end and a screen-reader user who grabbed "Minimum" is told nothing. Pushing edits a value the user did not touch. Clamping is the only one where the thumb's identity is stable for the whole gesture and the emitted pair always satisfies `lo <= hi`. `minGap` stops them early for a range that must span something.

Each thumb's `aria-valuemin`/`aria-valuemax` is **the other thumb's position**, so the constraint is announced rather than merely enforced; `thumbBounds()` computes them. Two sliders in a `role="group"`, each with its own accessible name.

The overlap is in the **hit areas, not the paint**: each thumb is a tap-sized box with a small grip inside, so two fully-overlapping boxes still read as two thumbs.

`junoui/range` is stateless — `pickThumb`, `moveThumb`, `thumbBounds`, and a keyboard model where arrows, PageUp/PageDown and Home/End all run through `moveThumb`, so the keyboard cannot cross the thumbs either. The event carries the whole pair, so a caller cannot apply half of it.
