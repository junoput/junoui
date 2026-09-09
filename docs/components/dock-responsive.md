# Dock / pillbar, responsive pairing

`.juno-dock--responsive` and `.juno-pillbar--responsive` are the **reciprocal** of
[`.juno-rail--responsive`](./rail.md). Pair a rail with one of them and the
rail↔dock swap is automatic and — the part that matters — **exhaustive**: exactly
one of the two shows at every size and pointer type.

```html
<nav class="juno-rail juno-rail--responsive" aria-label="Primary">…</nav>
<nav class="juno-dock juno-dock--pill juno-dock--responsive" aria-label="Primary">…</nav>
```

| Class                       | Effect                                                             |
| --------------------------- | ------------------------------------------------------------------ |
| `.juno-dock--responsive`    | Shows only where `.juno-rail--responsive` hides. No width utility. |
| `.juno-pillbar--responsive` | The same inverse, for a [pillbar](./pillbar.md) instead of a dock. |

## Do not pair a responsive rail with `.juno-hide-from-md`

That was the documented pairing and it leaves a hole. The two classes key on
**different conditions** that happen to agree on a portrait phone and disagree in
landscape:

| Viewport        | Size      | `.juno-rail--responsive` | `.juno-hide-from-md` dock | Result            |
| --------------- | --------- | ------------------------ | ------------------------- | ----------------- |
| Portrait phone  | 390 × 844 | hides (coarse, narrow)   | shows (390 < `md`)        | dock              |
| Landscape phone | 844 × 390 | hides (coarse, short)    | **hides** (844 ≥ `md`)    | **no navigation** |

At 844 × 390 the rail correctly hides because the pointer is coarse and the
viewport is short, while the dock hides because it is measuring width alone — and
the app has no primary navigation at all.

**The pairing has to key on one condition.** `--responsive` is the exact inverse
of the rail's own query, so there is no gap by construction rather than by two
rules agreeing.

The generic `.juno-hide-below-md` / `.juno-hide-from-md` helpers stay width-only
on purpose: they mean "hide at this width", and making them pointer-aware would
silently change what a consumer asked for by name. Use them for width-driven
layout, not for the navigation swap.

## The condition

```css
(pointer: coarse) and ((width <= 767.98px) or (height <= 500px))
```

`--juno-compact-nav` in [layout.md](../layout.md#pointer-first), which also
explains why the height term is there: it is what separates a landscape phone
from a tablet or a coarse-pointer kiosk. `tools/pointer-first.mjs` checks a page
for the swap being exhaustive.

## Anatomy (any platform)

There is no anatomy — this is one media query per class and nothing else. It
lives in its own stylesheet rather than appended to `dock.css` so the pairing
reads as one thing with pillbar's half, and so the condition appears exactly
twice in the source instead of being buried in two long files.

## Accessibility

Both navs are real `<nav>` elements with an accessible name; the hidden one
leaves the accessibility tree via `display: none`, so only one `Primary`
landmark is exposed at a time. Everything else is the
[rail / dock contract](../accessibility.md#the-aria-contract-per-component).
