# Dock

The bottom navigation bar of the app shell on narrow viewports — 3–5 primary
destinations as icon-over-label tap targets. The phone-width counterpart of the
[rail](./rail.md); the swap recipe is in [layout.md](../layout.md#app-shell).

## Web

```html
<nav class="juno-dock" aria-label="Primary">
  <a class="juno-dock__item" href="/library" aria-current="page">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-squares-four" /></svg>
    <span class="juno-dock__label">Library</span>
  </a>
  <a class="juno-dock__item" href="/nodes">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-hexagon" /></svg>
    <span class="juno-dock__label">Nodes</span>
  </a>
</nav>
```

| Class / prop              | Effect                                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.juno-dock`              | Sticky bottom `s1` bar, 1px `border` seam on top, safe-area pad.                                                                                                                           |
| `.juno-dock__item`        | Equal-width icon-over-label target, ≥ `size.tap.comfortable` tall.                                                                                                                         |
| `.juno-dock__label`       | The text — truncates with an ellipsis, never wraps.                                                                                                                                        |
| `[aria-current]`          | Active item: `s2` fill + 2px role edge on top. Attribute, not class.                                                                                                                       |
| `.juno-dock--fixed`       | Pin to the viewport foot (`position: fixed`) — for page-scroll shells where sticky won't pin.                                                                                              |
| `.juno-dock--pill`        | Floating rounded pill: big glyphs in circular bubbles, labels hidden, active = bubble fill.                                                                                                |
| `.juno-dock--float`       | Pillbar-style floating capsule chrome (fixed, rounded, blurred, shadowed) — keeps icon+label items and the full-item active fill. Combine with `--icon` for the `--pill` look, decomposed. |
| `.juno-dock--icon`        | Labels hidden, glyphs grow, active = bubble fill — standalone (no floating chrome required).                                                                                               |
| `.juno-dock__bubble`      | Circular icon holder (`--pill`/`--icon`); pair with `.juno-icon-loader` to host the loading ring.                                                                                          |
| `.juno-dock--collapsible` | Fold-to-a-circle variant driven by `--juno-dock-fold` — see [Collapsible](#collapsible-fold-driven).                                                                                       |
| `.juno-dock__tray`        | The collapsible bar's item row — fades out as the fold closes.                                                                                                                             |
| `.juno-dock__knob`        | The collapsed circle's face (a button); shown only under `data-juno-collapsed`.                                                                                                            |
| `.juno--<role>`           | Active-edge color (default `active`).                                                                                                                                                      |
| `--juno-dock-scale`       | Consumer-set scale factor (default `1`) applied to the whole bar — e.g. shrink on scroll.                                                                                                  |

## Pill variant

`.juno-dock--pill` turns the full-width bar into a floating rounded pill: big
glyphs sit in circular `.juno-dock__bubble`s, the labels drop, and only the
active tab's bubble fills. It floats out of flow (fixed), so the page scrolls
_under_ it — reserve room on the scroller with
`padding-block-end: var(--juno-dock-clearance)` (a published token that folds
in the pill height + safe area, so it stays correct if the geometry changes).

```html
<nav class="juno-dock juno-dock--pill juno-hide-from-md" aria-label="Primary">
  <a class="juno-dock__item" href="/library" aria-current="page" aria-label="Library">
    <span class="juno-dock__bubble juno-icon-loader">
      <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-squares-four" /></svg>
    </span>
  </a>
  <button class="juno-dock__item" aria-label="Nodes">
    <span class="juno-dock__bubble juno-icon-loader">
      <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-hexagon" /></svg>
    </span>
  </button>
</nav>
```

- **Labels are hidden — every item MUST carry an `aria-label`** (on the
  `<a>`/`<button>`). The glyph alone is not an accessible name.
- Focus lands on the bubble, so the ring hugs the round target.
- Pair every bubble with [`.juno-icon-loader`](./icon-loader.md) — it's the
  concentric-stack contract, and having it on from the start means a loading
  arc can appear later without touching the class list.

### Section-loading ring

The bubble doesn't invent its own ring: it is an
[icon-loader](./icon-loader.md) host that overrides the ring's two dimensions
(`--juno-icon-loader-ring` = the bubble diameter, `--juno-icon-loader-ring-width`
= 2px), so the arc rings the bubble's **edge** rather than the glyph. Drop an
indeterminate [arc](./loader.md) inside while the section loads; it eats no
clicks, so the item still activates, and because the bubble's box is definite
the arc appearing never resizes it. The app owns the state — add/remove
`.juno-arc--indeterminate`; give the arc `role="status"` + `aria-label`.

```html
<span class="juno-dock__bubble juno-icon-loader">
  <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-gear" /></svg>
  <span class="juno-arc juno-arc--indeterminate" role="status" aria-label="Loading"></span>
</span>
```

## Float variant

`.juno-dock--float` lifts the pillbar's floating capsule chrome (fixed
position, rounded shell, blur, shadow, off-edge margin) onto the dock's own
item model — icon+label items stay, and the active item still fills (`s2` +
role edge), just clipped to the capsule's rounded corners. It's `--pill`'s
exterior without `--pill`'s interior; combine with `--icon` below to
reproduce the original `--pill` look from two composable pieces. Out of flow
(fixed), so reserve room on the scroller with
`padding-block-end: var(--juno-dock-clearance)`.

```html
<nav class="juno-dock juno-dock--float juno-hide-from-md" aria-label="Primary">
  <a class="juno-dock__item" href="/library" aria-current="page">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-squares-four" /></svg>
    <span class="juno-dock__label">Library</span>
  </a>
  <a class="juno-dock__item" href="/nodes">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-hexagon" /></svg>
    <span class="juno-dock__label">Nodes</span>
  </a>
</nav>
```

## Icon variant

`.juno-dock--icon` hides labels, grows the glyph, and moves the active state
onto a circular `.juno-dock__bubble` — usable standalone on a plain
sticky/`--fixed` bar for a compact, icon-only dock that stays in flow. Follows
the same bubble contract as `--pill` (pair with
[`.juno-icon-loader`](./icon-loader.md); see the pill section above for the
section-loading ring).

```html
<nav class="juno-dock juno-dock--icon" aria-label="Primary">
  <a class="juno-dock__item" href="/library" aria-current="page" aria-label="Library">
    <span class="juno-dock__bubble juno-icon-loader">
      <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-squares-four" /></svg>
    </span>
  </a>
  <button class="juno-dock__item" aria-label="Nodes">
    <span class="juno-dock__bubble juno-icon-loader">
      <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-hexagon" /></svg>
    </span>
  </button>
</nav>
```

- **Labels are hidden — every item MUST carry an `aria-label`.**
- Combine with `.juno-dock--float` for a floating icon-only capsule (the
  original `--pill` treatment, built from the two composable variants).

## Shrink on scroll

`--juno-dock-scale` (default `1`) drives a `transform: scale()` on the whole
bar, anchored `bottom center`, so a consumer can compact the dock as the page
scrolls without junoui shipping any scroll-listener JS:

```js
dockEl.style.setProperty('--juno-dock-scale', shrink ? '0.92' : '1');
```

The transition duration is authored through the motion scale, so
`prefers-reduced-motion` collapses it to an instant snap with no
component-specific media query.

## Collapsible (fold-driven)

`.juno-dock--collapsible` folds the whole bar into a single circular
`.juno-dock__knob` at the inline-end edge, driven by one inherited custom prop
the app writes — `--juno-dock-fold` (`0` open … `1` the circle). Write it per
scroll frame for a gesture-tracked fold, or flip it `0`/`1` for a toggle.
Compose with a fixed placement (`--pill`, `--float`, or `--fixed`).

```html
<nav class="juno-dock juno-dock--pill juno-dock--collapsible" aria-label="Primary">
  <div class="juno-dock__tray">…the usual __item children…</div>
  <button class="juno-dock__knob" aria-label="Show navigation">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-dots-three" /></svg>
  </button>
</nav>
```

Two phases, split at `--juno-dock-fold-split` (default `0.35`): first the bar
**shrinks** in place to `--juno-dock-fold-scale` (default `0.78`, transform
only — no relayout), then it **slides** shut to `--juno-dock-collapsed-size`.
The width interpolates between two definite lengths (a transition cannot run
to an intrinsic size); `--juno-dock-fold-smoothing` (default `90ms`) smooths
over scroll-event discretization — anything longer visibly lags the finger.

- `data-juno-collapsed` is the **end state**, set by the app only at fold = 1:
  it hides the tray (`visibility` — the items leave the tab order) and reveals
  the knob. Remove it the moment the fold reopens.
- The knob **must** carry an `aria-label`. Collapsing while focus is inside
  the tray is the app's edge — move focus to the knob first.
- The fold's scale **replaces** the base `--juno-dock-scale` hook (one
  transform slot). Transform-origin is the physical bottom right; RTL
  consumers flip the origin and inset overrides together.
- Knobs: `--juno-dock-collapsed-size` (default: one tap-comfortable bubble
  plus the pill's padding and border), `--juno-dock-edge-gap` (what the
  floating margins take from `100%` — default `2 × space.12`).

## How many items fit

`.juno-dock__item` is `flex: 1 1 0`, so the bar divides its inner width by
however many items are present. A consumer deciding **how many to render** — and
whether they still hold a tap target — reads that budget from junoui rather than
re-deriving it from the numbers in `dock.css`:

| Custom property             | What it is                                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--juno-dock-items`         | The item budget. **You set it** to what you render; junoui does not enforce it, it derives from it.                   |
| `--juno-dock-item-inline`   | The width one item gets. A prediction of what the flex layout produces — asserted against the measured box in CI.     |
| `--juno-dock-fit-inline`    | The narrowest viewport at which every item still holds `--juno-size-tap-comfortable`. Below it, drop an item.         |
| `--juno-dock-chrome-inline` | The bar's total inline chrome (margin + padding + border, both sides). `0` on the full-bleed bar, `34px` on the pill. |
| `--juno-dock-avail`         | The width the budget divides. Defaults to `100vw`; override it when the bar is not viewport-wide.                     |

```css
/* five destinations need 254px; below that, render four */
@media (max-width: 253px) {
  .my-dock__item--secondary {
    display: none;
  }
}
```

The margin, padding and border terms are declared **once** and consumed by both
the variant's own box and the sum above, so the budget cannot disagree with the
bar it describes — the same construction as `--juno-dock-edge-offset`.

**There is deliberately no scale floor.** "What scale keeps a 44px target?" is
`44px / --juno-dock-item-inline`, a ratio of two lengths, and CSS cannot divide
by a length. A consumer that must scale rather than drop compares those two
values itself. Prefer dropping an item: scaling a bar scales its hit areas with
it, which is the problem the floor was being computed to avoid.

## Anatomy (any platform)

- Full-width bar on `s1`, hairline seam on the block-start edge; items split the
  width evenly, icon above a `font.size.10` uppercase label.
- Active = `s2` fill + `border.width.2` block-start edge in the role color —
  the rail's active language rotated 90°.
- Bottom padding extends into the safe area (`env(safe-area-inset-bottom)`)
  so the home indicator never covers a target.

## Usage

- Keep it to 3–5 destinations; overflow belongs in a "More" item opening a
  [drawer](./drawer.md) or [menu](./menu.md).
- Sticky, not fixed: place it last inside the scrolling column and it pins
  itself without overlapping content (no bottom-padding hacks). Best is the
  [`.juno-app-shell`](../layout.md#app-shell) frame, whose `__main` region is
  the scroller — the dock then sits at the body foot in flow.
- **Short-page caveat:** sticky only pins while the column overflows. If the
  _whole page_ scrolls and content is shorter than the viewport, the dock
  lands mid-content. For that layout use `.juno-dock--fixed` (viewport-pinned)
  and reserve its height at the page foot so it doesn't cover the last row.
- Pair with the rail via the viewport helpers: `.juno-hide-below-md` on the
  rail, `.juno-hide-from-md` on the dock. One nav is hidden from the
  accessibility tree at a time, so both may share `aria-label="Primary"`.
- The app sets `aria-current="page"` on the active item — junoui styles the
  attribute so nav semantics stay honest.
