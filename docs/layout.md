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

## App shell

Every product app assembles the same frame; here it is once, from existing
parts — a collapsible [rail](./components/rail.md), a topbar, a content outlet,
and a [slide-over](./components/drawer.md#the-slide-over-pattern) for trays.

```html
<div class="juno-shell">
  <nav class="juno-rail" aria-label="Primary">
    <div class="juno-rail__brand">JUNO</div>
    <a class="juno-rail__item" href="/library" aria-current="page">
      <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-squares-four" /></svg>
      <span class="juno-rail__label">Library</span>
    </a>
  </nav>
  <div>
    <header class="juno-shell__topbar">
      <input class="juno-input" type="search" placeholder="SEARCH…" />
      <span class="juno-badge juno-badge--soft juno--nominal">ONLINE</span>
    </header>
    <main class="juno-shell__main">…</main>
  </div>
</div>

<style>
  /* the shell is three declarations — junoui ships the pieces, not a cage */
  .juno-shell {
    display: flex;
    min-block-size: 100dvh;
  }
  .juno-shell > div {
    flex: 1;
    min-inline-size: 0;
  }
  .juno-shell__topbar {
    display: flex;
    align-items: center;
    gap: var(--juno-space-12);
    block-size: 46px;
    padding-inline: var(--juno-pad-surface-inline);
    background: var(--juno-s1);
    border-block-end: var(--juno-border-width-1) solid var(--juno-border);
  }
  .juno-shell__main {
    padding: var(--juno-pad-surface-block) var(--juno-pad-surface-inline);
  }
</style>
```

Collapse the rail by toggling `.juno-rail--collapsed` (one class; the width
transition and label hiding are built in). Trays/detail panels: the
slide-over pattern in the drawer doc.

### Narrow viewports (phone)

Below `md` the shell flips to the mobile frame: the rail hides and a
[dock](./components/dock.md) — bottom tab bar — takes over primary nav. Two
helpers, no JS:

```html
<div class="juno-shell">
  <nav class="juno-rail juno-hide-below-md" aria-label="Primary">…</nav>
  <div>
    <header class="juno-shell__topbar">…</header>
    <main class="juno-shell__main">…</main>
    <nav class="juno-dock juno-hide-from-md" aria-label="Primary">
      <a class="juno-dock__item" href="/library" aria-current="page">
        <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-squares-four" /></svg>
        <span class="juno-dock__label">Library</span>
      </a>
    </nav>
  </div>
</div>
```

The dock is `position: sticky` — last in the scrolling column, it pins to the
bottom without overlapping content and pads for the home indicator
(`safe-area-inset-bottom`). Keep 3–5 destinations; the rest go behind a "More"
item (drawer or menu). Prefer a floating bar? Swap the dock for a
[pillbar](./components/pillbar.md) — same contract, capsule look.

### Tab + stack (phone navigation recipe)

The full phone pattern is three parts: the dock or pillbar switches
_sections_; inside a section, a [list](./components/list.md) row (or any
link) pushes a detail view; every pushed view opens with a
[navbar](./components/navbar.md) whose back control unwinds one level.
junoui ships all three looks — the app owns the stack (routing/history):

```html
<div class="juno-shell">
  <div>
    <!-- one section, drilled one level in -->
    <header class="juno-navbar">
      <a class="juno-navbar__back" href="/settings">
        <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-caret-left" /></svg>
        <span class="juno-navbar__back-label">Settings</span>
      </a>
      <h1 class="juno-navbar__title">Playback</h1>
      <div class="juno-navbar__actions"></div>
    </header>
    <main class="juno-shell__main"><!-- .juno-list groups… --></main>
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
