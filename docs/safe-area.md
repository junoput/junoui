# Safe areas

Notches, home indicators, rounded corners. Every inset in junoui reads through
one seam, and **which arithmetic you use is not a style choice** — there are
four shapes and they give different answers.

## The buckets

The first three all answer "how far from the edge should this sit". The
fourth answers a different question — "how much room is there between the two
housings" — and belongs here for the same reason: get the arithmetic wrong and
it is invisible at inset 0, which is where it ships.

| Bucket                  | Rule                                                             | Because                                                                                                                                                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **edge padding**        | `max(base, inset)`                                               | The content is already inside the box. The inset _replaces_ the gap you wanted; adding them double-pads.                                                                                                                                                    |
| **clearance**           | `base + inset`                                                   | Room reserved so content can scroll clear of floating chrome. The chrome's own offset already contains the inset, so the reservation must contain it too or it lands short by exactly the inset.                                                            |
| **floating chrome**     | `base + inset` _or_ `max(base, inset)` — **the consumer's call** | A floating element sits _off_ the edge, so its gap and the inset stack. But a design that wants the bar flush above the home indicator wants `max()`. junoui defaults to additive and lets you restate it.                                                  |
| **available-space cap** | `100% - 2 * edge - inset-start - inset-end`                      | Not a distance from an edge at all — a term _subtracted_ from how much room exists, so a width cap does not run its content under the housing on either side. Restating a component's edge-offset token does nothing to this; it is a separate declaration. |

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

## Which bucket each component uses

The buckets above are not a taxonomy you apply — every component that
reads a `--juno-safe-*` token already picked one. This table says which, so a
consumer overriding a component's offset knows what arithmetic it is
replacing instead of reverse-engineering it from the CSS. (Filed after a
consumer took the additive form for `.juno-dock--pill` assuming it was the
only option, then had to read the source to find `--juno-dock-edge-offset`
and learn there was a choice at all — 20260909-126.)

| Component                                         | Bucket                    | Where                                                                                                                                                                                                   |
| ------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.juno-app-shell` (left/right)                    | edge padding              | `layout.css` — shell sits full-bleed; the inset _is_ the gap.                                                                                                                                           |
| `.juno-app-shell__topbar` (top)                   | edge padding              | `layout.css` — in-flow bar, flush at the top edge.                                                                                                                                                      |
| `.juno-navbar` (top)                              | edge padding              | `navbar.css` — same shape as the topbar above.                                                                                                                                                          |
| `.juno-dock` base/`--fixed`/`--icon` (bottom)     | edge padding              | `dock.css` — full-bleed, in-flow, sticky; not floating.                                                                                                                                                 |
| `.juno-dock--pill` / `--float` (bottom)           | floating chrome, additive | `dock.css` — via `--juno-dock-edge-offset`; the bar sits _off_ the edge, so its own margin and the inset stack.                                                                                         |
| `.juno-modal` sheet footer (bottom)               | clearance                 | `modal.css:185` — reserves room so the footer's actions clear the home indicator. Scoped `:not(.juno-drawer)`.                                                                                          |
| `.juno-modal.juno-drawer--bottom` footer (bottom) | clearance                 | `drawer.css:108` — its own declaration, same bucket and arithmetic as the modal row above. The two agree today with no mechanism keeping them that way — see the note below.                            |
| `.juno-toast` (bottom)                            | floating chrome, additive | `toast.css` — via `--juno-toast-edge-offset`.                                                                                                                                                           |
| `.juno-pillbar` (edge, corners)                   | floating chrome, additive | `pillbar.css` — via `--juno-pillbar-edge-offset`, and the same additive form on each corner variant's block/inline insets.                                                                              |
| `.juno-pillbar` (width)                           | available-space cap       | `pillbar.css` — `max-inline-size` sheds both horizontal insets separately from the offset above. Restating `--juno-pillbar-edge-offset` changes where the pill sits, not how wide it is allowed to get. |

**The dock is the one component that uses both buckets, on purpose, for
different variants.** The base bar is in-flow and full-bleed — the inset
_replaces_ the design gap, so it's edge padding, same as the app shell. The
`--pill`/`--float` variants float off the edge — their own margin and the
inset are two separate distances that both have to be accounted for, so
they're additive floating chrome. Restating `--juno-dock-edge-offset` (as
shown above) only changes the floating variants; the base bar has no
equivalent token to restate because `max()` was never a live choice for it —
there's no design gap for the inset to replace, `padding-block-end` already
_is_ the inset.

**The modal and drawer rows compute the same thing from two separate
declarations, not one shared rule.** `modal.css`'s clearance is scoped
`:not(.juno-drawer)`; `drawer.css` carries its own `.juno-modal.juno-drawer--bottom`
rule with the identical arithmetic. They agree today because someone kept them
in sync by hand, not because one reads from the other — a consumer changing
the modal site on the strength of this table would see no effect in a bottom
drawer, and nothing would say why. If you're touching either, check both.

**The pillbar's two rows are not optional to read together.** Its edge-offset
(floating chrome, additive) says how far the pill sits from the corner; its
width cap (available-space, subtractive) says how wide it's allowed to get
before it runs under the sensor housing. A consumer who restates only the
offset — the documented way to take the `max()` form — gets a repositioned
pill that can still overflow, because the cap is a separate declaration this
table's earlier "restate one token" advice does not reach.

**A third available-space instance exists and is not yet fixed.**
`dock.css`'s `--juno-dock-avail: 100vw` has the same shape as the pillbar's
old defect — it spans under the housing on both sides rather than shedding
the horizontal insets — and is tracked open as `20260914-066`, not fixed by
this change. Once it lands, this table's dock rows gain an available-space
entry matching the pillbar's.
