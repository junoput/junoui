# Layout & responsiveness

How blocks adapt — defined once, inherited by every UI. Two mechanisms:

1. **Intrinsic layout primitives** — reflow by available space, no media queries.
2. **Container queries** — a component restyles by *its own* width, not the viewport
   (right for a library dropped into unknown layouts).

Breakpoint tokens (`--juno-bp-sm…2xl`) follow Tailwind's scale and exist for the
rare viewport-level case.

## Why container queries over viewport breakpoints

junoui components live inside arbitrary app skeletons. A card doesn't know if it's
in a 280px sidebar or full width — so it adapts to its container:

```css
.juno-card { container-type: inline-size; }   /* already set */
```
`.juno-card__row` stacks automatically when the card is < 320px wide, anywhere.

## Layout primitives

Wrap a region; it adapts on resize. Every knob is a custom property with a token
default — override per instance inline.

| Class | Does | Key knob (default) |
|---|---|---|
| `.juno-center` | Max-measure wrapper, fluid gutters | `--juno-measure` (`bp-xl`) |
| `.juno-stack` | Vertical rhythm between children | `--juno-stack-space` (`space-16`) |
| `.juno-cluster` | Wrapping inline group (toolbars, tags) | `--juno-cluster-space` (`space-8`) |
| `.juno-grid-auto` | Cards that collapse columns themselves | `--juno-grid-min` (`240px`) |
| `.juno-sidebar` | Aside + fluid content, stacks when tight | `--juno-sidebar-width` (`280px`) |
| `.juno-switcher` | N-up or all-stacked at a threshold | `--juno-switcher-threshold` (`bp-sm`) |
| `.juno-reel` | Horizontal scroll-snap row | `--juno-reel-space` (`space-12`) |

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
<div class="juno-switcher"><div>A</div><div>B</div></div>
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
