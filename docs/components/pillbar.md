# Pillbar

A floating pill-shaped bar hovering above the content's bottom edge — the
iOS-style alternative to the full-width [dock](./dock.md). Holds 2–5 icon
actions or destinations; mix nav links and toggle buttons, separated by an
optional divider. Zero JS.

## Web

```html
<nav class="juno-pillbar" aria-label="Primary">
  <a class="juno-pillbar__item" href="/library" aria-current="page" aria-label="Library">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-squares-four" /></svg>
    <span class="juno-pillbar__label">Library</span>
  </a>
  <a class="juno-pillbar__item" href="/albums" aria-label="Albums">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-images" /></svg>
  </a>
  <span class="juno-pillbar__sep"></span>
  <button class="juno-pillbar__item" aria-label="Sync">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-arrows-clockwise" /></svg>
  </button>
</nav>
```

| Class / prop                                                                   | Effect                                                                                                                                             |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.juno-pillbar`                                                                | Sticky floating pill: blurred translucent `s1`, hairline, `shadow.2`.                                                                              |
| `.juno-pillbar__item`                                                          | Round tap target ≥ `size.tap.comfortable`; icon with optional label.                                                                               |
| `.juno-pillbar__label`                                                         | Inline text next to the icon — truncates at 12ch.                                                                                                  |
| `.juno-pillbar__sep`                                                           | Vertical hairline between item groups (e.g. destinations vs. actions).                                                                             |
| `[aria-current]`                                                               | Active destination: `s3` pill fill + role color. Attribute, not class.                                                                             |
| `[aria-pressed]`                                                               | Same active look for toggle buttons.                                                                                                               |
| `.juno-pillbar--fixed`                                                         | Fix to the viewport (`position: fixed`), floating its usual `space.16` + safe-area above the foot — for page-scroll shells where sticky won't pin. |
| `.juno-pillbar--top-right` / `--top-left` / `--bottom-right` / `--bottom-left` | Fix as a floating cluster in one viewport corner (safe-area-clamped), instead of the centered bottom bar.                                          |
| `.juno-pillbar__input`                                                         | Borderless search field inside the pill (`min(52vw, 240px)`, 16px font floor).                                                                     |
| `.juno-pillbar__overflow`                                                      | "More" trigger for items that don't fit — anchors a [menu](./menu.md) via `popovertarget`.                                                         |
| `.juno-pillbar--collapsible`                                                   | The pill folds into a single circle (`__toggle`) and animates back to full width — see [Collapsible](#collapsible).                                |
| `.juno-pillbar__toggle`                                                        | The collapsible pill's circular expand/collapse control; state on `aria-expanded`, same chrome as `__overflow`.                                    |
| `.juno-pillbar__tray`                                                          | Wrapper whose width animates shut — holds one child wrapping the usual `__item` markup.                                                            |
| `.juno--<role>`                                                                | Active color (default `active`).                                                                                                                   |

### Geometry custom props

Read from `.juno-pillbar` (or its computed style) instead of hardcoding these
in an app-side capacity planner — they're the single source of truth for how
many `__item` fit before the rest should route to `__overflow`.

| Prop                  | Default                | Meaning                                                                                                                                               |
| --------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--juno-pillbar-item` | `size.tap.comfortable` | Item tap-target side (square).                                                                                                                        |
| `--juno-pillbar-gap`  | `space.2`              | Gap between items.                                                                                                                                    |
| `--juno-pillbar-pad`  | `space.4`              | Pill's own inner padding.                                                                                                                             |
| `--juno-pillbar-edge` | `space.16`             | Base (bottom-center) placement's offset from the viewport edge. Not used by the corner modifiers, which keep their own distinct block/inline offsets. |

## Corner placement

The base pillbar is a centered bottom bar. The corner modifiers pin it as a
floating cluster in one viewport corner instead — e.g. a top-right
search/filter cluster over a full-bleed grid. Each flips to `position: fixed`
and clamps the corner with `env(safe-area-inset-*)` so it never lands under a
notch or the home indicator; the base blur/border/shadow carries over. For the
bottom corners, reserve scroll clearance with
`padding-block-end: var(--juno-pillbar-clearance)` if the pill overlaps
content.

## Input slot

`.juno-pillbar__input` is an expandable search field that lives inside the
pill, reading as part of it rather than a boxed control.

```html
<div class="juno-pillbar juno-pillbar--top-right">
  <input
    class="juno-pillbar__input"
    type="search"
    aria-label="Search library"
    placeholder="Search…"
  />
  <button class="juno-pillbar__item" aria-label="Search" aria-pressed="true">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-magnifying-glass" /></svg>
  </button>
</div>
```

- The field is borderless/transparent; its font-size is held at
  `max(16px, …)` because iOS Safari zooms the whole page onto any focused text
  field under 16px (the same floor the base [input](./input.md) applies on
  touch).
- **A placeholder is not a label** — give the input an `aria-label` or a
  visually-hidden `<label>`.

## Overflow slot

`.juno-pillbar__overflow` is a "more" trigger, styled like `__item`, for
pills with variable membership (e.g. a top-right action pill whose item count
depends on the current view). It opens a [`.juno-menu`](./menu.md) holding
whatever didn't fit — zero JS, via the native Popover API:

```html
<div class="juno-pillbar juno-pillbar--top-right">
  <button class="juno-pillbar__item" aria-label="Search" aria-pressed="true">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-magnifying-glass" /></svg>
  </button>
  <button class="juno-pillbar__item" aria-label="Filter">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-funnel" /></svg>
  </button>
  <button
    class="juno-pillbar__overflow"
    popovertarget="pillbar-more"
    aria-haspopup="menu"
    aria-expanded="false"
    aria-label="More"
  >
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-dots-three" /></svg>
  </button>
</div>
<ul class="juno-menu" id="pillbar-more" popover role="menu">
  <li>
    <button
      class="juno-menu__item"
      role="menuitem"
      popovertarget="pillbar-more"
      popovertargetaction="hide"
    >
      <span class="juno-menu__icon">⤓</span>Export
    </button>
  </li>
</ul>
```

- **junoui ships the docking point, not the collapse policy.** Deciding
  _which_ items overflow and _when_ is the app's job — read the
  [geometry custom props](#geometry-custom-props) to do the capacity math,
  then conditionally render `.juno-pillbar__overflow` and move the spilled
  `__item`s into the menu. This keeps one source of truth for the pixel
  constants instead of an app re-declaring them in JS.
- The invoker (`popovertarget`) is the menu's implicit anchor, so
  `.juno-menu`'s own `position-try-fallbacks` handles flipping it clear of the
  viewport edge — no extra positioning needed in the pill.
- `aria-expanded` mirrors the menu's open state like `[aria-pressed]` does for
  toggle items; toggle it from the app or a stateless enhancer (junoui itself
  ships no JS).

## Collapsible

`.juno-pillbar--collapsible` lets the whole pill fold into a single circular
button and expand back to full width on demand — for toolbars that should get
out of the content's way (e.g. a media viewer's action bar). State lives on
the toggle's `aria-expanded`; junoui ships no JS, the app flips the attribute.

```html
<nav class="juno-pillbar juno-pillbar--collapsible" aria-label="Tools">
  <button class="juno-pillbar__toggle" aria-expanded="false" aria-label="Show toolbar">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-dots-three" /></svg>
  </button>
  <div class="juno-pillbar__tray">
    <div>
      <button class="juno-pillbar__item" aria-label="Share">…</button>
      <span class="juno-pillbar__sep"></span>
      <button class="juno-pillbar__item" aria-label="Delete">…</button>
    </div>
  </div>
</nav>
```

- **The tray needs exactly one child wrapper** (any element). The expansion is
  a `grid-template-columns: 0fr ↔ 1fr` transition — the only widely-supported
  way to animate to an intrinsic width (Safari 16+) — and the track needs a
  single shrinkable child to collapse.
- DOM order is free: toggle-first reads naturally for a left-anchored pill,
  toggle-last for a right-anchored corner (`--bottom-right`), so the circle
  stays put and the tray grows out of it.
- Collapsed, the tray goes `visibility: hidden` at the end of the slide, which
  also removes its items from the tab order. **Collapsing while focus is
  inside the tray is the app's edge:** move focus to the toggle first.
- The toggle's glyph rotates a quarter-turn while expanded; swap the icon from
  the app instead if you want e.g. dots → ×.
- `prefers-reduced-motion` is handled by the base layer (every transition
  collapses to ~0ms) — the states still apply, just without the slide.

## Anatomy (any platform)

- Fully-rounded capsule floating `space.16` off the bottom edge (plus the safe
  area), centered inline; translucent `s1` with a background blur, hairline
  `border`, `shadow.2` lift.
- Items are capsule targets at least `size.tap.comfortable` square; the active
  one fills `s3` and takes the role color.
- A separator is a `border`-colored vertical hairline, `space.20` tall.

## Usage

- Same rules as the dock: 3–5 destinations, overflow goes behind a "More" item.
  Pick **one** bottom pattern per screen — dock _or_ pillbar, never both.
- Variable-membership action pills (not fixed destinations) use the
  [overflow slot](#overflow-slot) instead of hand-rolling a "more" menu.
- Sticky, not fixed: place it last inside the scrolling column; it floats over
  content while staying in flow. Best inside the
  [`.juno-app-shell`](../layout.md#app-shell) frame, whose `__main` is the
  scroller.
- **Short-page caveat:** sticky only pins while the column overflows, so on a
  short page that doesn't scroll the pillbar lands mid-content. If the _whole
  page_ scrolls, use `.juno-pillbar--fixed` to fix it to the viewport (it keeps
  floating its usual gap above the foot) and reserve its footprint at the page
  foot.
- Icon-only items need `aria-label`. Show the label on the active item (or all
  items) when space allows.
- Nav destinations are `<a>` with `aria-current="page"`; momentary or toggle
  actions are `<button>` (toggles flip `aria-pressed`).
- Works inside a [navbar](./navbar.md) + tab-stack shell — the recipe is in
  [layout.md](../layout.md#app-shell).
