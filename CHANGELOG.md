# Changelog

## 0.4.0

### Minor Changes

- ff7a437: `.juno-drawer--bottom` is a real bottom sheet: rounded top corners, a decorative
  grab handle (`.juno-sheet__handle`), a height knob `--juno-sheet-h` (default
  `60dvh`) capped by `--juno-sheet-max` (`92dvh`), and safe-area padding moved to
  `.juno-modal__body` so a scrolling sheet's last row clears the home indicator.
  Docs state the contract the app still owns — `showModal()`, focus trap, `inert`
  background, dismiss — and that `<dialog>` is the only supported sheet root.
  Fixes 20260802-019.
- 8fba3e8: Emit the breakpoints as named media queries — `@junoput01/junoui/css/custom-media`
  ships `--juno-below-*` / `--juno-from-*` generated from the same
  `tokens/core/breakpoint.json`, so consumers stop copying `767.98px` by hand.
  Shipped as its own opt-in file because `@custom-media` needs a build step
  (postcss-custom-media); each entry documents the plain literal to use without
  one. A new build test asserts every breakpoint literal hardcoded in `src/css`
  matches a generated boundary, so the tokens are mechanically the source of
  truth rather than by convention. Fixes 20260802-024.
- b04aa26: `data-juno-density="auto"` — an opt-in density that renders as `comfortable`
  everywhere except a narrow coarse-pointer viewport, where content spacing
  re-densifies to the `compact` values. It never touches `min-height` or
  `--juno-size-tap-min`, so it cannot regress the WCAG tap-target guarantees.
  Nothing changes for existing `comfortable` / `compact` consumers. Fixes 20260802-023.
- 3b18db8: Dock gains `.juno-dock--collapsible`: the whole bar folds into a single
  circular `.juno-dock__knob` at the inline-end edge, driven by one inherited
  custom prop the app writes per scroll frame — `--juno-dock-fold` (0 open … 1
  circle) — so the fold can track the gesture. Two phases split at
  `--juno-dock-fold-split`: shrink in place to `--juno-dock-fold-scale`, then
  slide shut to `--juno-dock-collapsed-size`; `data-juno-collapsed` is the
  app-set end state that drops the `.juno-dock__tray` items from the tab order
  and reveals the knob. Composes with `--pill`/`--float`/`--fixed`; zero JS.
  Extracted from nexora's shipped scroll-fold so the mechanism lives in the
  design system and apps keep only the scroll wiring.
- 2682b04: Dock gains composable variants: `--float` (floating capsule chrome, labels kept)
  and `--icon` (labels hidden, active state moves to a circular bubble) — together
  they reproduce the existing `--pill` look from two independent pieces — plus
  `--juno-dock-scale`, a shrink-on-scroll knob whose transition duration is
  authored through `--juno-motion-scale` so reduced motion collapses it. Also
  fixes the partial border reset on `.juno-dock__item`, which left the UA default
  border on three sides of a `<button>` item. Fixes 20260802-015.
- 4616add: New `.juno-fold` — animated presence for a member of any row: the slot stays
  mounted and folds its definite width (`--juno-fold-size`) to zero with a fade,
  leaving the tab order at the end of the fold, driven by the app-set
  `data-juno-in` attribute. `--juno-fold-gap` swallows the row's gap so the row
  closes completely. Extracted from nexora's scroll-to-top slot so the generic
  animation lives in the design system.
- e450769: Publish a gesture-surface convention: `.juno-gesture-surface` marks an element
  whose pointer events app JS fully owns (`touch-action` via `--juno-touch-action`,
  plus the callout / selection / tap-highlight resets the UA otherwise applies),
  with `.juno-pan-x` / `.juno-pan-y` as single-axis escape hatches. Opt-in classes
  only — nothing changes unless applied. This is community convention, not Apple
  guidance; no primary source names these properties for iOS. Fixes 20260802-021.
- 3675ad7: Ship a JS-readable motion contract. `prefers-reduced-motion` is a CSS media
  query, so imperative JS (smooth-scroll choices, rAF-driven transforms) could
  never see it without its own `matchMedia` listener. The base layer now exposes
  `--juno-motion` (`auto` | `none`) and `--juno-motion-scale` (`1` | `0`) on
  `:root`, flipped inside the existing reduced-motion query — one
  `getComputedStyle` read decides. `--juno-motion-scale` also lets CSS author a
  duration as `calc(var(--juno-motion-duration-base) * var(--juno-motion-scale))`
  instead of repeating a per-component media query. Additive. Closes 20260802-011.
- 8fba3e8: Encode a load-state vocabulary so nothing spins forever: `.juno-shimmer` (work
  in progress, no ETA), `.juno-fault` (terminal failure), and `.juno-empty`
  (loaded, nothing to show), plus an optional CSS-only `.juno-state` /
  `data-juno-when` switch that shows one treatment at a time. Zero JS — deciding
  when a load becomes a fault stays the app's call; junoui ships the look and the
  ARIA contract (documented in `accessibility.md`). `.juno-shimmer` reuses
  skeleton's keyframe rather than forking a second shimmer. Fixes 20260802-014.
- 721d2e7: Mobile pill / loading primitives — absorbed from an app that hand-rolled them
  (nexora `feat/mobile-ui`), so the next consumer gets them plug-and-play.
  Almost all additive; a11y contract in `accessibility.md`. Filed as a pre-1.0
  _minor_ (the breaking-capable channel) because two existing surfaces move:
  `.juno-icon-loader` now stacks **every** child on its centre cell, and the
  bottom-sheet / snackbar safe-area fix restores padding that Chromium was
  silently dropping — see the last two bullets.

  - **Pillbar placement + input slot** — `.juno-pillbar--top-right` /
    `--top-left` / `--bottom-right` / `--bottom-left` pin the pill as a floating
    corner cluster (safe-area-clamped, keeps the blur/border/shadow) instead of
    the centered bottom bar. `.juno-pillbar__input` is a borderless in-pill
    search field held at a `max(16px, …)` font floor so iOS Safari never
    zoom-jumps on focus.
  - **Dock pill variant** — `.juno-dock--pill` + `.juno-dock__bubble`: the
    full-width bar becomes a floating rounded pill with big glyphs in circular
    bubbles, labels hidden (each item then **requires** an `aria-label`), active
    reads as a bubble fill. Folds in the `--juno-icon-size` footgun fix (scoped).
  - **Reload indicator** — `.juno-reload` + `.juno-reload__dot`: the
    non-blocking counterpart to the skeleton for refetch-over-content. Fixed
    centered `role="status"` dot with a soft halo, `pointer-events: none`, gentle
    `juno-pulse` (new shared keyframe).
  - **Inline icon sprite helper** — `@junoput01/junoui/icons/inline`: a tiny
    generated module that injects the sprite into the document once so icons use
    reliable same-document `<use href="#juno-i-…">` refs (external refs
    intermittently drop in Safari). Auto-installs on import; exports
    `installJunoIcons(doc)`.
  - **Safe-area clearance tokens** — `--juno-dock-clearance` /
    `--juno-pillbar-clearance` (web-only CSS custom props, geometry + safe area
    folded in): a floating-nav consumer writes `padding-block-end:
var(--juno-dock-clearance)` on its scroller and stays correct if the dock
    geometry changes.
  - **`.juno-icon-loader` generalised to _the_ ring-a-control primitive** — the
    ring stroke is now a custom prop (`--juno-icon-loader-ring-width`, default
    `0.14em`) alongside the existing `--juno-icon-loader-ring`, and every child
    — not just `.juno-icon` — shares the centre cell. A host with a definite box
    sets the diameter to that box and the ring hugs its edge without the box
    resizing when the arc appears. `.juno-dock__bubble` is exactly that: pair it
    with `.juno-icon-loader` and an indeterminate `.juno-arc` rings the bubble
    edge while a section loads. There is one ring mechanism, not two.
    _Upgrade note:_ a `.juno-icon-loader` with children beyond the icon + arc
    used to lay them out in extra grid cells; they now stack on the centre cell.
  - **Safe-area `calc()` fix** — the bottom-sheet body and the narrow-viewport
    toast stack passed a **unitless** `0` as the `env(safe-area-inset-bottom)`
    fallback inside `calc()`. A unitless `0` is a `<number>`, so the sum is
    invalid and Chromium dropped the whole declaration — losing the constant
    padding term on every device without a safe area. Fallback is now `0px`, so
    the padding lands as designed (a small, intended, visible shift).

- 643d85e: Pillbar gains `.juno-pillbar--collapsible`: the whole pill folds into a single
  circular `.juno-pillbar__toggle` and animates back to full width when tapped.
  State is the toggle's `aria-expanded` (app-owned, zero JS, same convention as
  `__item`'s `aria-pressed`), read via `:has()` so toggle/tray DOM order is free.
  The `.juno-pillbar__tray` animates `grid-template-columns: 0fr ↔ 1fr` — the
  only widely-supported transition to an intrinsic width (Safari 16+) — and goes
  `visibility: hidden` at the end of the slide so collapsed items leave the tab
  order. `__toggle` shares `__overflow`'s circle chrome; existing markup renders
  unchanged.
- cae069b: Pillbar publishes its geometry as custom props (`--juno-pillbar-item`, `-gap`,
  `-pad`, `-edge`) so an app-side capacity planner reads real values instead of
  hardcoding pixel constants in JS, and adds `.juno-pillbar__overflow` — a "more"
  trigger styled like an item that anchors a `.juno-menu` through the native
  Popover API, zero JS. junoui ships the dock point; which items overflow stays
  app policy. Computed output for existing markup is unchanged. Fixes 20260802-012.
- 7a653cf: Ship `.juno-scroller` — the scroll-container primitive every scrolling region in
  the library was re-deriving by hand: overflow axis, `overscroll-behavior`, and
  snap type as overridable custom props, plus `--x`/`--y`/`--bare` modifiers and a
  `.juno-snap` child helper. `.juno-reel` becomes its horizontal-mandatory-snap
  preset and reads `scroll-snap-type` from `--juno-scroller-snap`, so the mode is
  overridable per instance instead of hardcoded (default unchanged). The props are
  only read as `var()` fallbacks and never declared on the element, so a reel
  nested inside a scroller keeps its own snap. Fixes 20260802-017.
- e564c0c: Skeleton gains a content-box mode — `.juno-skeleton--tile` sized by
  `--juno-skeleton-ratio` (default square) for media grids, so the layout doesn't
  jump on load — and the shimmer moves to the compositor: a `::before` band
  animated on `transform` only, never `background-position`, so it stops
  repainting the gradient every frame. The local reduced-motion override is
  dropped in favour of the global one in the base layer.
- 56b2b3c: `.juno-thumb` gains an aspect-locked frame (`--juno-thumb-ratio`, default
  square) so a media wall's scroll height is stable before anything loads, a
  `--selected` state drawn as an inset outline (never a border — a border would
  reflow the frame), a `--flush` variant for full-bleed tiles, and four
  `__corner` slots for badges/duration chips. Corner modifiers are named
  `--top-start` / `--top-end` / `--bottom-start` / `--bottom-end`, matching the
  logical insets they use, so they flip correctly under `dir="rtl"`. Additive:
  existing markup sets `aspect-ratio` inline, which still wins. Fixes 20260802-018.

### Patch Changes

- 5a85ae8: `.juno-icon-loader` is documented as what it always was — a primitive that rings
  **any** control (button, badge, avatar), not just a nav icon; the single-cell
  grid never cared what it wrapped. Adds `.juno-arc--smooth`, a continuous-rotation
  modifier for indeterminate arcs, because the default 12-step sweep reads as
  jitter under ~24px. No second ringing mechanism was introduced. Fixes 20260802-013.
- 2a95eab: docs: boot-shell guide — the five-rung boot ladder (pre-bundle shell with token
  literals, cache-aware chrome, default-screen-only bundle, background warming,
  offline shell), with the sync-guard rules for the literal copies it requires.
- def7651: `.juno-icon` no longer pins `--juno-icon-size` on the element itself; the
  `1.25em` default now lives in the `var()` fallback. An ancestor that sets
  `--juno-icon-size` for contextual sizing (e.g. `.juno-list__chevron`) is no
  longer shadowed, so it actually reaches the glyph. Explicit `--sm/--lg/--xl`
  modifiers are unaffected. Fixes the footgun in 20260727-011.
- eb639cc: Add `docs/ios-conformance.md` — the sourced iOS metric contract. Records what
  junoui encodes and why (Apple pt = 1 CSS px, the WCAG 24/44 split, safe-area
  opt-in, the `max()`-vs-addition rule, viewport-unit families), names the
  folklore it deliberately does not encode (the deleted "44pt minimum" HIG
  sentence, the non-existent "Apple 8pt grid"), and flags what is unverified (the
  16px focus-zoom rule, iOS 26 behavior). Fixes 20260803-031.
- b04aa26: `.juno-label` reads an optional `--juno-label-size`, falling back to the existing
  token, so a consumer can resize labels from an ancestor instead of cloning the
  class. The knob is never declared on the element itself — only read as a `var()`
  fallback — so it cannot shadow an ancestor's value. Fixes 20260802-025.
- e0f3765: `.juno-modal__body` is now the real scroll port the docs already promised. The
  surface caps its own height (85dvh as a bottom sheet) and sets `overflow:
hidden`, so a tall body was clipped and unreachable; `[open]` is now a flex
  column and the body carries `min-block-size: 0; overflow-y: auto`. It also gets
  `overscroll-behavior: contain`, so hitting the end of a sheet no longer chains
  the scroll to the page behind it (the rubber-band-under-the-sheet effect on
  iOS). Fixes 20260803-029.
- 4dd3ef4: Tappable primitives (`.juno-btn`, dock/pillbar/tabs/list/menu items, segmented
  options, chips, toggle buttons) now carry `touch-action: manipulation`, opting
  out of double-tap-to-zoom so a browser no longer waits after the first tap to
  see whether a second is coming — the late, mushy tap a phone UI is built on.
  Panning and pinch-zoom are preserved (never `none`, which would be an a11y
  regression), and it is applied outside the coarse-pointer query so hybrid
  touch devices that report a fine pointer still get it. Fixes 20260803-038.
- 352b9ca: Close a WCAG 2.5.8 gap on the phone-only surfaces. `.juno-menu__item` (dock
  overflow routes here on phones) and `.juno-navbar__actions > *` now hold
  `min-block-size: var(--juno-size-tap-min)`, which auto-promotes to 44px on
  coarse pointers — so nothing routed onto touch falls under the tap minimum.
  The UA tap-highlight square is now suppressed on the interactive surfaces
  (`.juno-btn`, dock/pillbar/tabs/list/menu items) under `pointer: coarse`, and
  the navbar usage example no longer recommends `.juno-btn--sm` (which is
  deliberately below the tap minimum) on a touch top bar. Fixes 20260802-020.
- d00697b: Document the `viewport-fit=cover` requirement and make the showcase honour it.
  iOS defaults `viewport-fit` to `auto` and WebKit reports every
  `env(safe-area-inset-*)` as `0` unless the page opts in with `cover` — so every
  safe-area guarantee in the library (dock, pillbar, navbar, drawer, toast,
  app-shell, and the `--juno-*-clearance` tokens) was silently a no-op for any
  consumer who did not already know the trick, including junoui's own showcase.
  Adds the meta to all 13 showcase pages, states it as a hard requirement in
  getting-started + layout docs, and adds a build test so a page cannot lose it
  again. Fixes 20260803-028.
- 53bc4cd: Fix two silent WebKit failures. `backdrop-filter` was shipped unprefixed only,
  but Safari needed `-webkit-backdrop-filter` until 18 — so the frosted glass on
  the pillbar, pill dock and modal scrim simply did not render on iOS 17 and
  earlier, on exactly the floating chrome the mobile set is built around. And
  `scrollbar-width: none` only reached Safari 18.2, so the scrollable tab strip
  still showed a bar on older iOS; it now carries the `::-webkit-scrollbar`
  fallback the other scrollers already had.

## 0.3.0

### Minor Changes

- a7fb0b8: App-shell composition primitive + nav ergonomics — all CSS, all additive:

  - `.juno-app-shell` — the standard product frame as classes instead of a
    copy-pasted `<style>` block: `__body` column, `__topbar`, and a `__main`
    scroller with a dock/pillbar pinned at its foot. Encodes `100dvh` (dock isn't
    clipped by mobile browser chrome), main-as-scroller (dock stays put with no
    `sticky`/`fixed`), and safe-area insets. Knob: `--juno-app-shell-topbar-size`.
  - `.juno-rail--responsive` — the rail self-hides below `md`, so the rail↔dock
    swap is one modifier instead of hanging `.juno-hide-below-md` yourself. rail.css
    now cross-references the dock pairing.
  - Viewport helpers extended to `sm` (640px) and `lg` (1024px), each with
    `hide-below-*` / `hide-from-*`, plus readable `show-from-*` / `show-below-*`
    inverse aliases.
  - `.juno-dock--fixed` (pins flush to the foot) / `.juno-pillbar--fixed` (fixes
    to the viewport, still floating its gap above the foot) — for
    page-scroll shells, where `position: sticky` won't pin on a non-overflowing
    column and the bar would land mid-content. Prefer `.juno-app-shell`, which
    avoids the problem entirely.
  - `.juno-icon-loader` — a nav destination's icon ringed by the spinning
    [arc](../docs/components/loader.md) while its section loads. Icon static on
    top; ring sized in `em`, pointer-transparent, kept concentric with a
    single-cell grid (never `translate`, which the arc's rotation would clobber).
  - Touch inputs hold a 16px font floor on coarse pointers, so iOS Safari no
    longer zooms the page when a text field is focused.
  - `docs/` now ships in the npm tarball, so the paths README and the CSS
    comments point at (e.g. `docs/layout.md#app-shell`) resolve inside
    `node_modules` for consumers.

## 0.2.0

### Minor Changes

- 7d8a890: Consumer-driven improvements (from the buzz chat-app integration):

  - **Fonts self-hosted, CSP-safe.** `base.css` no longer fetches Google Fonts
    cross-origin (broke strict CSP, phoned home). B612/B612 Mono ship as woff2 with
    a local `@font-face` sheet, opt-in via `import 'junoui/fonts.css'` (not bundled
    into `juno.css`). **Behavior change:** consumers that relied on junoui pulling the
    font now get a system fallback until they import `junoui/fonts.css` or load B612
    themselves.
  - **Neutral ramp extended:** new `--juno-data-dim` (faint metadata — timestamps,
    tick labels) and `--juno-border-strong` (divider heavier than the hairline
    border), across all three palettes × both modes and every platform output.
  - **Integration guide** (`docs/integration.md`): import order for app shells, the
    token-bridge recipe, fonts opt-in, "accent is semantic (not a brand hue)", and the
    extension/palette policy.

- d96b163: Field-driven components + patterns (first production consumer, a media-server web
  client — features landed generic, origin logged in `docs/roadmap.md`):

  - **Dense sizes:** `.juno-btn--sm` (toolbar-scale button; documented WCAG tap-min
    trade-off) and `.juno-switch--sm` (quiet 40×20 per-row toggle, no printed legend).
  - **Segmented control:** `.juno-seg` — exclusive-choice pill row on native radios,
    zero JS; `aria-pressed` button flavor for JS-driven apps; `--sm` size; role-colored
    checked pill.
  - **Gauge:** `.juno-gauge` — determinate metric ring (conic-gradient + registered
    `--juno-gauge-value`, no SVG); `--sm`/`--lg`; thresholds stay app policy (recipe
    documented).
  - **Spark:** `.juno-spark` — sparkline size/stroke/role contract; app supplies the
    polyline (junoui still ships no charting).
  - **Micro badge:** `.juno-badge--micro` — mono data-UI atom for provenance/kind tags
    and threshold values.
  - **Rail:** `.juno-rail` — collapsible app-shell nav; active styled via
    `aria-current`, logical edges (RTL-safe).
  - **Content density:** `--juno-tile-min` + `--juno-gap-content` archetype and
    `.juno-grid-auto--tiles`, so media walls re-densify from `data-juno-density`.
  - **Icons:** 14 media/system Phosphor glyphs (squares-four, images, hexagon,
    puzzle-piece, play, film-strip, cloud, cloud-arrow-down, arrows-clockwise, cpu,
    hard-drives, sliders, arrows-out, upload-simple).
  - **Docs:** app-shell recipe (`layout.md#app-shell`), drawer slide-over pattern,
    spark point-generator; new `.juno-sr-only` utility.

- 02a983b: Mobile adaptations — components restructure themselves on narrow viewports and
  touch devices, no extra classes for most of it:

  - `.juno-dock` — new bottom-navigation component, the phone counterpart of the
    rail (sticky, safe-area padded, `aria-current` active styling). App-shell
    swap recipe in `layout.md#app-shell`.
  - Modal becomes a bottom sheet below `bp.sm`: full-width, top corners rounded,
    slides up, footer buttons stretch, body pads past the home indicator.
  - Side drawers cap at `85vw` on phones so a sliver of scrim stays tappable;
    the bottom drawer pads for the home indicator.
  - Toast stack goes full-width along the bottom edge on phones; toasts slide up
    instead of sideways.
  - Tab strip scrolls sideways instead of overflowing — every tab stays
    reachable at any width.
  - `.juno-table--stack` (opt-in) — rows become label/value cards below a 480px
    container; give each `td` a `data-label`. Semantics stay a real `<table>`.
  - Touch ergonomics: under `pointer: coarse` the base layer raises
    `--juno-size-tap-min` to the 44px comfortable target; hover-revealed table
    row actions stay visible under `hover: none`.

- e7a117f: Mobile navigation kit — the tab + stack pattern, all CSS:

  - `.juno-pillbar` — floating pill bar (the iOS-style alternative to the dock):
    2–5 icon destinations or actions in a translucent, blurred, fully-rounded
    capsule hovering above the bottom edge; sticky + safe-area cleared. Active
    styles off `aria-current` (links) / `aria-pressed` (toggles); optional
    `__sep` divider between groups.
  - `.juno-navbar` — stack-navigation top bar: a back control **always on the
    start edge** (caret flips under RTL), centered truncating title, trailing
    actions; sticky, safe-area padded on top.
  - `.juno-list` — grouped rows for vertical data organization (the settings
    pattern): uppercase group header over an `s1` card of hairline-divided rows;
    each row = leading icon + label/support + trailing value, control, or
    drill-in chevron. Interactive rows (`<a>`/`<button>`) get hover; static rows
    don't.
  - Tab + stack shell recipe in `layout.md`: dock/pillbar switches sections,
    navbar backs out of pushed views, list rows do the drilling.

- 6eb33da: System-preference detection, all CSS:

  - **Auto color scheme** — `data-juno-mode` is now optional: without it the
    theme follows the OS via `prefers-color-scheme` (per palette, live). An
    explicit mode pins it, exactly as before. The base layer sets
    `color-scheme` so scrollbars/native form chrome match the effective mode.
  - A palette attribute without a mode now resolves to that palette's dark
    theme (previously fell back to standard's colors).
  - `prefers-contrast: more` → hairline borders step up to `border-strong`.
  - `prefers-reduced-transparency` → the pillbar drops its blur/translucency
    for a solid surface.

  Showcase: mode control gains **AUTO** (the new default); the quick flip
  button resolves the effective OS mode and pins the opposite; the header
  clock formats in the browser's preferred language.

- 9426e38: `.juno-thumb` — media thumbnail frame with a built-in unavailable placeholder.
  Muted glyph on `s2` sits under the media; the image covers it while present.
  Failed media removes itself via the optional stateless
  `onerror="this.remove()"`; known-missing media ships no element and the
  placeholder just shows. `--video` flavor (play glyph), `__label` micro-caption.
  Loading remains `.juno-skeleton`'s job. Pairs with `.juno-grid-auto--tiles`.

  Also: date & time house format documented in `design-guidelines.md`
  (`dd.mm.yyyy`, 24-hour, `05.07.2026 · 14:32`, en-dash ranges) with an
  `Intl.DateTimeFormat` recipe — content convention, no code.

- 6cb57ee: WCAG 2.2 contrast audit — dark-mode surface separation + verified AA/AAA claims.

  Full measured audit added (`scripts/audit-contrast.mjs`, run with `node`) covering every
  text / status / non-text pair across `standard` · `soft` · `colorblind` × dark · light.
  It surfaced three gaps, now fixed:

  - **Dark `label` failed AA on the `s3` (selected/overlay) surface** (≈ 4.0:1). Lifted
    dark `label` to `oklch(63% …)` across all three palettes so secondary text now clears
    **1.4.3** Contrast (Minimum), AA (≥ 4.5:1) on **every** surface `s0`–`s3` (≈ 4.6–5.9:1),
    data > label > muted hierarchy preserved.
  - **Dark blocks were imperceptible against the background.** Adjacent surface fills
    differ by only ~1.05:1, and the old dark `border`/`border-strong` sat at 1.2:1/1.7:1 vs
    the base surface — cards, panels and dividers had no visible edge. Lifted dark `border`
    and `border-strong` (standard/colorblind → 30% / 40%, soft → 31% / 41%) to ≈ 1.5:1 /
    2.2:1: a quiet-but-visible hairline. (Container boundaries are decorative and exempt
    from **1.4.11**; component-identifying edges already use `--juno-control-edge*`.)
  - **Colorblind AAA claim was overstated on `s3`** (≈ 6.97:1). Docs corrected: colorblind
    status roles meet **1.4.6** AAA on `s0`–`s2`, AA on `s3` — matching how the `data` AAA
    claim is already surface-scoped. Carbon role hues are unchanged (colorblind-safety).

  `docs/accessibility.md` Color section rewritten to state the measured, surface-scoped
  guarantees and to mark `muted`/`data-dim` as decorative / WCAG-exempt roles.

  **Breaking:** dark `--juno-color-*-label`, `-border`, `-border-strong` values change
  across `standard`, `soft`, and `colorblind`. Visual only; no API/class changes.

### Patch Changes

- 2c14c29: Menu items may be links: `a.juno-menu__item` no longer shows the browser
  underline (nav menus render `<a>`s, not only `<button>`s).
- 8dbb800: Bundle `utilities.css` last in `juno.css`: role helpers (`.juno--nominal` …) set
  `--juno-role` at the same specificity as component defaults
  (`.juno-gauge { --juno-role: … }`), so with utilities first every same-element
  role recolor silently lost the cascade to the component's own default.
  Utilities-last restores `.juno-badge.juno--warning`, `.juno-gauge.juno--caution`,
  `.juno-spark.juno--nominal`, etc. (Found by the Nexora integration.)

All notable changes to junoui are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/); the package follows
[semantic versioning](https://semver.org/). Tokens are the public contract: a
changed token value or removed token is a breaking change.

From 0.1.0 on, entries below the `[Unreleased]` heading are generated by
[Changesets](https://github.com/changesets/changesets) — add one with
`npm run changeset` rather than editing this file by hand.

## [Unreleased]

_Nothing yet — managed by Changesets._

## [0.1.0] — 2026-06-30

### Added

- DTCG token source (`tokens/`): color (3 palettes × dark/light), spacing,
  radius, border, sizing, typography, plus foundation scales — motion,
  z-index, elevation/shadow, opacity.
- Style Dictionary build → CSS, SCSS, JS/TS, JSON, Android, iOS, Flutter;
  dependency-free OKLCH → sRGB hex conversion for native/Flutter.
- Theming by attribute: `data-juno-palette` × `data-juno-mode`, with
  `data-juno-density` (comfortable/compact) and `data-juno-text`
  (type-scale via `--juno-font-scale`).
- Framework-agnostic CSS layer driven by one `--juno-role` property —
  **30+ components**: badge, button, card, readout, status dot, loaders;
  form controls (field, input, select, checkbox, radio, switch, slider);
  overlays (modal, drawer, tooltip, popover, menu); table/data-grid;
  alert + toast; tabs + accordion; **icon** (SVG sprite, Phosphor bold, MIT);
  skeleton, avatar, divider, chip/tag, breadcrumb, pagination, stepper.
- Loaders — arc, beacon, linear bar; indeterminate (CSS-only) and
  determinate (`--juno-progress`).
- Responsive layout layer: breakpoint tokens + intrinsic primitives (`stack`,
  `cluster`, `grid-auto`, `sidebar`, `switcher`, `reel`, `center`) +
  container-query reflow.
- Higher-contrast form controls: shared `--juno-control-edge-strong` on inputs,
  checkbox/radio, toggle buttons, switch, slider; lifted switch/slider knobs.
- npm packaging with `exports` for every platform (incl. `junoui/icons`);
  `prepare` builds `dist/`.
- Docs: getting-started, web, native, flutter, design-guidelines, accessibility
  (per-component ARIA contract), generated token reference, per-component specs.
- Interactive `showcase/` demo (repo-only; excluded from the package).
- Quality: stylelint + prettier, `node:test` integrity suite, Playwright
  visual-regression snapshots, Changesets-driven versioning + publish, CI gate.

### Changed

- Raised `label` and `muted` text-role contrast to legible levels across all
  three palettes (hue/chroma kept, lightness adjusted) — placeholder/helper
  text now meets contrast on page + panel surfaces.
