# Changelog

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
