---
'@junoput01/junoui': minor
---

**Pointer-first responsiveness — conformance kit slice 3.**

`.juno-rail--responsive` keyed on `width <= 767.98px`. A landscape iPhone is **844×390 — wider than `md`** — so it was served the desktop rail on a device held in two hands. Width has never been the question.

junoui now states **two** conditions, because they answer different questions. Touch ergonomics is `(pointer: coarse)` with **no size term** — a finger is a finger on a kiosk too. Navigation shape is `(pointer: coarse) and ((width <= 767.98px) or (height <= 500px))`, and the height term is what separates a landscape phone (320–430px tall) from a tablet or a coarse-pointer kiosk (768px and up), both of which keep the rail.

New: `--juno-coarse` and `--juno-compact-nav` in `dist/css/juno-custom-media.css`, and `junoui/pointer` exporting the same strings plus `matchesCompactNav` / `onCompactNav` for an app choosing a _component_ rather than a rule. A listener, not a one-shot read — rotating a phone crosses this without a reload.

**New: `.juno-dock--responsive` and `.juno-pillbar--responsive`.** Pairing a responsive rail with `.juno-hide-from-md` on the dock — the previously documented pairing — leaves a hole: at 844×390 the rail hides _and_ the dock hides, and the app has no primary navigation at all. The reciprocals key on the inverse of the same condition, so exactly one half shows at every size and pointer type.

The generic `.juno-hide-below-md` / `.juno-hide-from-md` helpers stay width-only on purpose.

**Migration:** swap `.juno-hide-from-md` on a dock or pillbar that pairs with `.juno-rail--responsive` for `.juno-dock--responsive` / `.juno-pillbar--responsive`. A dock paired the old way keeps working on portrait phones and loses navigation in landscape.
