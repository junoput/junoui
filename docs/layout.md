# Layout & responsiveness

How blocks adapt — defined once, inherited by every UI. Two mechanisms:

1. **Intrinsic layout primitives** — reflow by available space, no media queries.
2. **Container queries** — a component restyles by _its own_ width, not the viewport
   (right for a library dropped into unknown layouts).

Breakpoint tokens (`--juno-bp-sm…2xl`) follow Tailwind's scale and exist for the
rare viewport-level case.

## Why container queries over viewport breakpoints

junoui components live inside arbitrary app skeletons. A card doesn't know if it's
in a 280px sidebar or full width — so it adapts to its container:

```css
.juno-card {
  container-type: inline-size;
} /* already set */
```

`.juno-card__row` stacks automatically when the card is < 320px wide, anywhere.

## Layout primitives

Wrap a region; it adapts on resize. Every knob is a custom property with a token
default — override per instance inline.

| Class                    | Does                                     | Key knob (default)                       |
| ------------------------ | ---------------------------------------- | ---------------------------------------- |
| `.juno-center`           | Max-measure wrapper, fluid gutters       | `--juno-measure` (`bp-xl`)               |
| `.juno-stack`            | Vertical rhythm between children         | `--juno-stack-space` (`space-16`)        |
| `.juno-cluster`          | Wrapping inline group (toolbars, tags)   | `--juno-cluster-space` (`space-8`)       |
| `.juno-grid-auto`        | Cards that collapse columns themselves   | `--juno-grid-min` (`240px`)              |
| `.juno-grid-auto--tiles` | Media wall wired to the density layer    | `--juno-tile-min` / `--juno-gap-content` |
| `.juno-sidebar`          | Aside + fluid content, stacks when tight | `--juno-sidebar-width` (`280px`)         |
| `.juno-switcher`         | N-up or all-stacked at a threshold       | `--juno-switcher-threshold` (`bp-sm`)    |
| `.juno-scroller`         | Bare scroll container (axis/snap/bar)    | `--juno-scroller-snap` (`none`)          |
| `.juno-reel`             | Horizontal scroll-snap row               | `--juno-reel-space` (`space-12`)         |

### Examples

```html
<!-- responsive card grid — no breakpoints, columns just fit -->
<div class="juno-grid-auto" style="--juno-grid-min:280px;">
  <article class="juno-card">…</article>
  <article class="juno-card">…</article>
  <article class="juno-card">…</article>
</div>

<!-- toolbar that wraps -->
<div class="juno-cluster">
  <button class="juno-btn juno--nominal">CONFIRM</button>
  <button class="juno-btn juno-btn--ghost">CANCEL</button>
</div>

<!-- sidebar + content; stacks when content would get too narrow -->
<div class="juno-sidebar">
  <aside class="juno-sidebar__aside">…</aside>
  <main class="juno-sidebar__main">…</main>
</div>

<!-- two-up that flips to stacked under ~640px of space -->
<div class="juno-switcher">
  <div>A</div>
  <div>B</div>
</div>

<!-- media wall: tile size + gap follow [data-juno-density] -->
<div class="juno-grid-auto juno-grid-auto--tiles"><img … /><img … /><img … /></div>
```

`--tiles` reads `--juno-tile-min` / `--juno-gap-content` from the density layer
(`150px` / `space-10` comfortable, `108px` / `space-4` compact), so one
`data-juno-density` attribute re-densifies controls, surfaces **and** content
grids together.

## Scroller

Every scrolling region in the library — `.juno-reel`, `.juno-app-shell__main`,
tab strips — is the same three knobs: overflow axis, overscroll containment,
snap type. `.juno-scroller` ships them as overridable custom props instead of
each consumer re-deriving (and usually forgetting `overscroll-behavior`, which
lets iOS pull-to-refresh/scroll-chain through an inner scroller into the
page). Defaults: `overflow: auto` (both axes), `overscroll-behavior: contain`,
no snap.

```html
<!-- vertical list scroller with containment, no snap -->
<div class="juno-scroller juno-scroller--y">…</div>

<!-- horizontal, scrollbar hidden, softer "proximity" snap, opt-in stops -->
<div
  class="juno-scroller juno-scroller--x juno-scroller--bare"
  style="--juno-scroller-snap: x proximity;"
>
  <div class="juno-snap">…</div>
  <div class="juno-snap">…</div>
</div>
```

- `.juno-scroller--x` — horizontal axis only (`overflow: auto hidden`)
- `.juno-scroller--y` — vertical axis only (`overflow: hidden auto`)
- `.juno-scroller--bare` — hides the scrollbar (Firefox + WebKit)
- `.juno-snap` — on a child: opts into `scroll-snap-align`

`.juno-reel` is `.juno-scroller`'s horizontal-snap preset baked into one
class: it now reads its `scroll-snap-type` from the same `--juno-scroller-snap`
prop (default unchanged: `inline mandatory`), so the mode is overridable
per instance instead of hardcoded — e.g. a "magnet" strip that wants
`proximity` instead of a stepped `mandatory` feel:

```html
<div class="juno-reel" style="--juno-scroller-snap: inline proximity;">…</div>
```

## Gesture surfaces

For an element whose pointer events an app JS layer owns outright — drag-pan,
pinch-zoom, swipe classification, anything that is a state machine rather than
native scrolling — junoui ships the CSS side of that contract as one class.
The gesture handler itself is the app's job (or a sibling `junoui-<framework>`
package): junoui declares the surface, never the logic.

```html
<div class="juno-gesture-surface" id="viewport"><!-- JS drag/pinch handlers attach here --></div>

<!-- only needs the touch-action axis lock, not the full reset -->
<li class="juno-list__item juno-pan-x"><!-- swipe-to-reveal row --></li>
```

`.juno-gesture-surface` sets `touch-action: var(--juno-touch-action, none)`,
`-webkit-touch-callout: none`, `user-select: none` and
`-webkit-tap-highlight-color: transparent` — so the UA never fights the
handler with its own scroll/zoom recognition, long-press callout, text
selection or tap flash. Override `--juno-touch-action` per instance to hand
back one axis (`pan-x` / `pan-y`) instead of all of them. `.juno-pan-x` /
`.juno-pan-y` are standalone single-axis classes for elements that want the
axis lock alone.

These four properties are **community convention, not Apple-documented
behavior** — see [ios-conformance.md](./ios-conformance.md) before citing them
as a platform requirement.

## App shell

Every product app assembles the same frame; `.juno-app-shell` ships it as
classes — a collapsible [rail](./components/rail.md), a topbar, a scrolling
content outlet, and a [dock](./components/dock.md) at the foot — so you stop
copy-pasting the same `<style>` block into every app.

```html
<div class="juno-app-shell">
  <nav class="juno-rail juno-rail--responsive" aria-label="Primary">
    <div class="juno-rail__brand">JUNO</div>
    <a class="juno-rail__item" href="/library" aria-current="page">
      <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-squares-four" /></svg>
      <span class="juno-rail__label">Library</span>
    </a>
  </nav>
  <div class="juno-app-shell__body">
    <header class="juno-app-shell__topbar">
      <input class="juno-input" type="search" placeholder="SEARCH…" />
      <span class="juno-badge juno-badge--soft juno--nominal">ONLINE</span>
    </header>
    <main class="juno-app-shell__main">…</main>
    <nav class="juno-dock juno-hide-from-md" aria-label="Primary">
      <a class="juno-dock__item" href="/library" aria-current="page">
        <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-squares-four" /></svg>
        <span class="juno-dock__label">Library</span>
      </a>
    </nav>
  </div>
</div>
```

What the primitive encodes so you don't have to:

- **`100dvh`, not `100vh`** — the shell fills the _dynamic_ viewport, so the
  dock isn't clipped by the phone's shrinking address bar.
- **The `__main` region is the scroller**, not the page. The dock (or
  [pillbar](./components/pillbar.md)) is a flex sibling at the body foot, so it
  stays pinned with zero `sticky`/`fixed` and never overlaps content — the
  short-page pitfall of sticky nav bars (below) can't happen here.
- **Safe-area insets** — the shell pads for landscape notches
  (`inset-left`/`right`), the topbar for `inset-top`, the dock for
  `inset-bottom`. **This requires `viewport-fit=cover` in your page's viewport
  meta** ([getting-started](./getting-started.md#required-the-viewport-meta)) —
  without it iOS reports every inset as `0` and none of this padding happens.

Collapse the rail by toggling `.juno-rail--collapsed` (one class; the width
transition and label hiding are built in). Trays/detail panels: the
[slide-over](./components/drawer.md#the-slide-over-pattern) pattern in the
drawer doc. Knobs: `--juno-app-shell-topbar-size` (topbar height).

### Narrow viewports (phone)

The rail↔dock swap is two classes, no JS: `.juno-rail--responsive` self-hides
below `md`, and the dock carries `.juno-hide-from-md` so it shows only there.
(Equivalent to hanging `.juno-hide-below-md` on the rail yourself — the
modifier just saves you knowing to.) Keep 3–5 dock destinations; the rest go
behind a "More" item (drawer or menu). Prefer a floating bar? Swap the dock
for a [pillbar](./components/pillbar.md) — same contract, capsule look.

**Viewport helpers.** For the cases an intrinsic primitive can't express
(swap a nav for a menu button), hide/show by breakpoint at `sm` (640px),
`md` (768px), `lg` (1024px):

| Class                                        | Visible        |
| -------------------------------------------- | -------------- |
| `.juno-hide-below-md` / `.juno-show-from-md` | at `md` and up |
| `.juno-hide-from-md` / `.juno-show-below-md` | below `md`     |

`show-*` are readable aliases for the inverse `hide-*` (`show-from-md` ≡
`hide-below-md`); pick whichever reads clearer at the call site. Same three
cut points for `sm` and `lg`.

### Page-scroll shells (dock/pillbar `--fixed`)

`.juno-app-shell` is the recommended frame because its `__main` scroller keeps
the dock in flow. If instead the **whole page** scrolls, the dock/pillbar use
`position: sticky` — which only pins _while the column overflows_. On a short
page that doesn't scroll, a sticky bar lands mid-content, reading as "not
stuck." For that layout use `.juno-dock--fixed` (pins flush to the viewport
foot) or `.juno-pillbar--fixed` (fixes to the viewport, still floating its gap
above the foot) — then reserve the bar's footprint at the page foot (e.g.
`padding-block-end`) so it doesn't cover the last row.

### Tab + stack (phone navigation recipe)

The full phone pattern is three parts: the dock or pillbar switches
_sections_; inside a section, a [list](./components/list.md) row (or any
link) pushes a detail view; every pushed view opens with a
[navbar](./components/navbar.md) whose back control unwinds one level.
junoui ships all three looks — the app owns the stack (routing/history):

```html
<div class="juno-app-shell">
  <div class="juno-app-shell__body">
    <!-- one section, drilled one level in -->
    <header class="juno-navbar">
      <a class="juno-navbar__back" href="/settings">
        <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-caret-left" /></svg>
        <span class="juno-navbar__back-label">Settings</span>
      </a>
      <h1 class="juno-navbar__title">Playback</h1>
      <div class="juno-navbar__actions"></div>
    </header>
    <main class="juno-app-shell__main"><!-- .juno-list groups… --></main>
    <nav class="juno-pillbar" aria-label="Primary"><!-- section tabs --></nav>
  </div>
</div>
```

## Adopting in an existing project

No restructuring required — additive and incremental:

1. Set `data-juno-palette` / `data-juno-mode`, swap hardcoded values → `var(--juno-*)`.
2. Add component classes where blocks match.
3. Wrap layout regions in a primitive (`.juno-grid-auto`, `.juno-cluster`, …) to get
   reflow. Add `container-type: inline-size` to a wrapper for component-level queries.

You opt in per region; nothing forces a markup shape.

## The JS line

These are all CSS. Behavior that needs state (resize observers feeding app state,
virtualization, drag-resizable panels) belongs in your app or a sibling
`junoui-<framework>` package — not the design system.
