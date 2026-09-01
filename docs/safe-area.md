# Safe areas

Notches, home indicators, rounded corners. Every inset in junoui reads through
one seam, and **which arithmetic you use is not a style choice** — there are
three cases and they give different answers.

## The three buckets

| Bucket              | Rule                                                             | Because                                                                                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **edge padding**    | `max(base, inset)`                                               | The content is already inside the box. The inset _replaces_ the gap you wanted; adding them double-pads.                                                                                                   |
| **clearance**       | `base + inset`                                                   | Room reserved so content can scroll clear of floating chrome. The chrome's own offset already contains the inset, so the reservation must contain it too or it lands short by exactly the inset.           |
| **floating chrome** | `base + inset` _or_ `max(base, inset)` — **the consumer's call** | A floating element sits _off_ the edge, so its gap and the inset stack. But a design that wants the bar flush above the home indicator wants `max()`. junoui defaults to additive and lets you restate it. |

Getting this wrong is not subtle at the extremes and is invisible at inset 0,
which is where it gets shipped. A consumer that took the additive form for a
floating dock had it sitting 42px off the bottom edge on an iPhone and flush on
a desktop, and nothing in a headless test could see it.

## The seam

```css
--juno-safe-top    --juno-safe-right    --juno-safe-bottom    --juno-safe-left
```

**No rule in junoui calls `env()` directly.** Everything reads these four. That
buys two things consumers were otherwise doing by hand:

**You can zero or substitute an inset in one place.** In a letterboxed
standalone window iOS keeps reporting `safe-area-inset-bottom` while the home
indicator is outside the window entirely, so honouring it reserves room for
something not in the view. An app that has detected the letterbox previously had
to override every rule mentioning `env()`. Now:

```html
<html data-juno-letterboxed></html>
```

…and `--juno-safe-bottom` goes to zero.

**Only the bottom, and that is deliberate.** Measured on an iPhone 16 Pro /
iOS 18.7: the window is 812 of the screen's 874 points and sits at the **top**,
so the dead strip is the bottom 62. The window's top edge is therefore _under_
the Dynamic Island — the top inset is real, and zeroing it would put content
under the Island in the one window this attribute exists for. Left and right are
0 in portrait and real in landscape. Neither is a phantom, so neither is touched.
See ticket `20260815-039`.

Or restate one:

```css
:root {
  --juno-safe-bottom: max(8px, env(safe-area-inset-bottom, 0px));
}
```

**A test can measure a device that is not present.** `env()` cannot be forced in
a headless browser, so every safe-area measurement works by rewriting the
stylesheet. One named seam is one substitution instead of a regex over
hand-written `calc()`s.

### Always a unit-bearing fallback

`env(safe-area-inset-bottom, 0px)` — never bare `0`. Inside `calc()` a unitless
zero is a `<number>`, which invalidates the sum and **drops the whole
declaration**. A stack would then sit flush at 0 on every device _without_ a safe
area, which is the opposite of the intent and completely silent.

## Floating chrome states its offset once

Each floating primitive publishes the offset it uses, declared once and consumed
by every site that needs it — its own margin _and_ any clearance derived from it,
so the two cannot disagree about where the bar sits:

| Primitive                      | Token                        |
| ------------------------------ | ---------------------------- |
| `.juno-dock--pill` / `--float` | `--juno-dock-edge-offset`    |
| `.juno-pillbar`                | `--juno-pillbar-edge-offset` |
| `.juno-toast`                  | `--juno-toast-edge-offset`   |

Restating one of these is how you take the `max()` form for that primitive:

```css
:root {
  --juno-dock-edge-offset: max(8px, var(--juno-safe-bottom));
}
```

Before these tokens the form was written separately at each site, so a consumer
that changed one silently disagreed with the other — measured at 16px of dead
band at inset 0 and 24px at inset 34, with no value of the bar's height able to
reconcile them, because one side added the inset and the other took its max.
