---
'@junoput01/junoui': minor
---

Safe-area seam, published edge offsets, a pillbar budget, and `junoui-doctor` — conformance kit slices D through G (20260826-036).

**One seam for every inset.** `--juno-safe-top` / `-right` / `-bottom` / `-left` are declared once on `:root` as `env(safe-area-inset-*, 0px)`, and all 23 previously-direct `env()` calls now read through them. `html[data-juno-letterboxed]` zeroes `--juno-safe-bottom`, and **only** that one. In a letterboxed iOS standalone window the home indicator is outside the window entirely while iOS keeps reporting the bottom inset, so every primitive padding for it reserves room for something not in the view. The other three are not phantoms and are left alone: measured on an iPhone 16 Pro / iOS 18.7 the window is 812 of 874 points and sits at the top, so its top edge is _under_ the Dynamic Island — zeroing the top inset would put content under the Island in exactly the window the attribute exists for.

**Each floating primitive publishes its offset.** `--juno-pillbar-edge-offset` and `--juno-toast-edge-offset` are the numbers a consumer was previously re-deriving, wrongly — the three buckets (edge padding `max(base, inset)`, clearance `base + inset`, floating chrome) are not interchangeable, and the bucket a primitive belongs to is a property of the primitive.

**The pillbar publishes its horizontal budget**, the same way the dock does — but with its own arithmetic. A dock's items stretch and a pillbar's do not, so a consumer reusing the dock's formula is short by `(items - 1) * gap`.

**`npx junoui-doctor --url <your app>`** runs a consumer's own app against real device profiles and reports what it did not cover on every run. Playwright is an optional peer, not a dependency.

## Migration — read this even though nothing you have will fail to compile

**A guard that reads junoui's shipped stylesheet and matches on `env(` will go red.** The insets are behaviourally unchanged — the same value is added or `max()`-ed in the same places — but the _term_ is now `var(--juno-safe-top)` rather than the `env()` call. If your guard asserts the call site, re-ground it on the rule: follow the seam one hop and assert the seam is itself an `env()` for that edge. nexora's `pillbarHeight.test.ts` is the worked example, and its consumer gate is what found this before the release rather than after.

**A consumer pairing the old way loses navigation entirely on a landscape phone.** That is a breaking change in effect, even though the types still compile and no class was removed. `.juno-rail--responsive` now hides on `(pointer: coarse) and ((width <= 767.98px) or (height <= 500px))`, and `.juno-dock--responsive` is its exact complement. A rail paired with the width-only `.juno-hide-from-md` is correct on a portrait phone and on desktop, and at 844×390 leaves _both_ halves hidden: the rail because the pointer is coarse and the viewport is short, the dock because 844 is wider than `md`. The break is in the _pairing_, which is why nothing warns you. `junoui-doctor` has a `phone-landscape` profile for exactly this, and it is the one finding it reports on a page that looks correct everywhere else.
