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

| Component                                         | Bucket                    | Where                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.juno-app-shell` (left/right)                    | edge padding              | `layout.css` — shell sits full-bleed; the inset _is_ the gap.                                                                                                                                                                                                                                                                                                                                                            |
| `.juno-app-shell__topbar` (top)                   | edge padding              | `layout.css` — in-flow bar, flush at the top edge.                                                                                                                                                                                                                                                                                                                                                                       |
| `.juno-navbar` (top)                              | edge padding              | `navbar.css` — same shape as the topbar above.                                                                                                                                                                                                                                                                                                                                                                           |
| `.juno-dock` base (bottom; inline open)           | edge padding              | `dock.css` — full-bleed, in-flow, sticky. The bottom axis is settled. The horizontal axis is the open question below: in-flow, so it is correct only where its container already absorbed the inset, and wrong where nothing has.                                                                                                                                                                                        |
| `.juno-dock--fixed` (bottom + inline)             | edge padding              | `dock.css` — `position: fixed; inset-inline: 0`, so **no container can absorb an inset for it** and it takes both horizontal insets unconditionally, as `padding-inline`. Padding rather than margin because the bar is full-bleed by design: the background keeps spanning edge to edge and only the content moves in. Not part of the open question below.                                                             |
| `.juno-dock` (item budget, width)                 | available-space cap       | `dock.css` — `--juno-dock-avail: calc(100vw - var(--juno-safe-left) - var(--juno-safe-right))`, same shape as the pillbar's width cap above.                                                                                                                                                                                                                                                                             |
| `.juno-dock--pill` / `--float` (bottom + inline)  | floating chrome, additive | `dock.css` / `base.css` — `--juno-dock-edge-offset` (bottom) plus two independent horizontal properties, `--juno-dock-edge-offset-inline-start`/`-inline-end`, because a notch is on the left in one orientation and the right when the device turns around.                                                                                                                                                             |
| `.juno-modal` sheet footer (bottom)               | clearance                 | `modal.css:185` — reserves room so the footer's actions clear the home indicator. Scoped `:not(.juno-drawer)`.                                                                                                                                                                                                                                                                                                           |
| `.juno-modal.juno-drawer--bottom` footer (bottom) | clearance                 | `drawer.css:108` — its own declaration, same bucket and arithmetic as the modal row above. The two agree today with no mechanism keeping them that way — see the note below.                                                                                                                                                                                                                                             |
| `.juno-toast` (bottom + inline-end)               | floating chrome, additive | `toast.css` — via `--juno-toast-edge-offset` (declared and consumed on `.juno-toast-stack`, not on `.juno-toast` itself) and `--juno-toast-edge-offset-inline-end`, at both the default corner placement and the <640px full-width band. Fixed in 20260914-071 — the property used to be declared on the stack's own child, which left it unresolved on the stack, and the default (≥640px) branch shed no inset at all. |
| `.juno-pillbar` (edge, corners)                   | floating chrome, additive | `pillbar.css` — via `--juno-pillbar-edge-offset`, and the same additive form on each corner variant's block/inline insets.                                                                                                                                                                                                                                                                                               |
| `.juno-pillbar` (width)                           | available-space cap       | `pillbar.css` — `max-inline-size` sheds both horizontal insets separately from the offset above. Restating `--juno-pillbar-edge-offset` changes where the pill sits, not how wide it is allowed to get.                                                                                                                                                                                                                  |

**`--icon` is not in the table because it does not position anything.** It hides
labels and enlarges glyphs; whether it takes an inset is decided entirely by what
it is combined with — `.juno-dock--icon` alone is the in-flow base bar, and
`.juno-dock--fixed.juno-dock--icon` is the fixed row above. Listing it as a
positioning case would imply a choice it does not make.

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

**THE ANCHORED SURFACES ARE ABSENT FROM THIS TABLE ON PURPOSE, AND THAT IS NOT
THE SAME AS BEING SAFE.** `.juno-popover`, `.juno-menu` and
`.juno-tooltip__bubble` read no `--juno-safe-*` token, so they fall outside the
sentence this table opens with — and a reader asking "does junoui keep overlays
out of the housing?" would take their absence for a yes. It is not.

Measured at 844×390 with 59px insets, trigger 4px from the right edge, opened
through its `popovertarget` (which is the panel's implicit anchor — that is why
neither stylesheet declares an `anchor-name`):

|                 | panel's right edge |
| --------------- | ------------------ |
| `.juno-popover` | **840**            |
| `.juno-menu`    | **840**            |

The right housing spans 785..844, so 55px of each panel — a fifth of a popover —
is physically unreadable.

`.juno-tooltip__bubble` has now been measured too, in its **top-layer
(`popover="hint"`) mode** — the only mode the anchor-positioning rules apply to,
and the one that needs `position-anchor` set by the enhancer, since a tooltip has
no `popovertarget` invoker to act as an implicit anchor. All four placements, each
against a trigger near the edge it opens **toward**:

| placement         | lands at        | housing    | under by                  |
| ----------------- | --------------- | ---------- | ------------------------- |
| `--right`         | right edge 776  | starts 785 | clear — by 9px, see below |
| `--left`          | left edge 68    | ends 59    | clear — by 9px, see below |
| default / `--top` | top edge 53     | ends 59    | 6px                       |
| `--bottom`        | bottom edge 337 | starts 331 | 6px                       |

A centred trigger reads clean on all four, so the fixture is not reporting the
housing for every input.

**THE TWO INLINE ROWS READ "CLEAR" AND THE GAP IS UNCHANGED — read this before
quoting them.** They were 844 and 0, flush against each housing, until
`.juno-tooltip__bubble[popover]` gained `flip-inline` (20260914-155). The flip
moves the bubble to the trigger's other side, which at **this** geometry lands
nine pixels inside the band. It is decided by the trigger's and the bubble's
widths — anchor positioning still cannot read `env()` — so the landing spot does
not move when the housing gets wider:

| inset | `--right` box | verdict     |
| ----- | ------------- | ----------- |
| 59px  | 636..776      | clear       |
| 80px  | 636..776      | **crosses** |
| 100px | 636..776      | **crosses** |

Identical boxes at every inset. `anchored-safe-area-gap.spec.mjs` therefore pins
the inline placements at 80px, where the coincidence does not save them, and the
block placements at 59px, where they still cross on their own.

**The tooltip used to be the weakest of the three, and that has been fixed
without fixing this.** Its base rule declared `position-try-fallbacks:
flip-block` only, and since every placement modifier inherits that rule, `--right`
and `--left` — the two placements whose whole job is inline — never _attempted_ a
horizontal correction, where the popover and menu at least try and then stop at
the viewport boundary. It now declares `flip-block, flip-inline` like they do
(20260914-155), which fixed a separate and plainer defect: a `--right` bubble on
a trigger 4px from the right edge was clamped flush to the viewport **on top of
the trigger that summoned it**. The housing gap above is untouched by that —
the flip is viewport-driven, as the inset table shows.

**Nothing in the component can fix it, and that is the point of recording it
here.** Both panels declare `position-try-fallbacks`, which is exactly the right
tool for _this would overflow, put it somewhere else_ — and it worked: 840 is
inside the viewport's 844. **CSS anchor positioning resolves overflow against the
viewport, and the viewport spans under the housing.** There is no `env()` term in
that computation and no way to introduce one. Two candidate fixes were built and
both failed, each in a way worth knowing before trying it again:

- an inline `margin` equal to the insets **does** pull an overflowing panel into
  the safe area — and moves every non-overflowing panel by the same 59px, because
  it is an ordinary margin. Measured: a centred popover goes 211..491 → 152..432
  with nothing overflowing.
- a custom `@position-try` block as a last resort is **never reached**. The chain
  advances only on viewport overflow, `flip-inline` already produced a
  viewport-fitting placement, and the search stops there. Confirmed reachable in
  principle by a control — as the sole fallback against a genuinely overflowing
  default it fires exactly as written — so this is a real null and not an
  unsupported feature.

Tracked as `20260914-072`, deliberately with no recommendation. Until it has one,
an overlay anchored near a screen edge on a notched device is a known gap, and a
consumer who needs one there should position it themselves rather than assume
this table covers it.

**What is genuinely still open is not the dock's budget or its floating
variants — both now shed the horizontal insets, same as the pillbar.** It is
the in-flow **base** bar's own padding, held on the operator as
`20260914-068`. Measured at 844×390 with 59px insets: the base bar renders
correctly (75..769) inside `.juno-app-shell`, because the shell already pads
for the inset — and wrong (0..844, under both housings) at the viewport root,
where nothing has. Edge padding is the right bucket either way; what's
undecided is how an in-flow component learns whether its container already
paid the inset, so it doesn't pay it twice. The two candidates are a
descendant selector (`.juno-app-shell .juno-dock { padding-inline: 0 }`) or a
second safe-area variable pair distinguishing in-flow from viewport-fixed —
both work, and the ticket's own hold note says the second is more expensive
to reverse. This table's dock rows describe the bar as it behaves today,
unchanged since before this fix — not a promise about which way `20260914-068`
resolves.
