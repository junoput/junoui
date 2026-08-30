# Changelog

## 0.9.0

### Minor Changes

- 6a63629: **Geospatial and 3D-viewport icons — the sprite goes from 66 to 80 symbols.**

  The 0.7.0 sprite covered media, files, system and status with **zero spatial vocabulary**: no crosshair, no ruler, no polygon, no map pin, no globe, no layers stack, no compass, no cube. Every map, GIS, CAD or 3D consumer therefore sourced icons elsewhere — and the moment they did, half the UI stopped matching Phosphor bold, which is the cohesion junoui exists to provide.

  Added, all Phosphor bold so the set stays one family and one licence: `crosshair`, `crosshair-simple`, `ruler`, `polygon`, `path`, `map-pin`, `map-trifold`, `stack`, `globe`, `mountains`, `cube`, `compass`, `scissors`, `selection`.

  Nothing new is needed to use them — the `.juno-icon` sizing and colour contract is unchanged, and the existing subset tooling covers them. The showcase gallery renders from the sprite, so they appear there automatically.

  `test/icons-family.test.mjs` now enforces the property the ticket actually cares about, which is cohesion rather than inventory: one `0 0 256 256` canvas for every symbol, colour inherited through `currentColor`, no `<style>` blocks, classes or external references, no empty symbols, the sprite and `src/icons/` agreeing in both directions, and the MIT licence travelling with the glyphs. A test that only counted symbols would pass with a Material crosshair dropped in beside Phosphor's.

### Patch Changes

- 28d6fd1: **The consumer gate now checks that its consumer is still the consumer.**

  `gate:consumer` claims a candidate "compiles into an app that consumes it". It checks out a _lane_ by default (`ios/develop`), and a lane drifts: on 2026-08-26 it reported GATE GREEN twice against a nexora `ios/develop` that was **260 commits behind its own develop**, on which the guard that would have failed did not yet exist. The gate proved something true and much weaker than the sentence `RELEASING.md` uses to justify it.

  New stage, the same shape junoui already runs on itself one section up: assert the checked-out branch has taken its baseline back. `--baseline` (default `develop`) and `--no-baseline-check` for a consumer that genuinely has no baseline.

  It **fails closed**: if shallow history cannot support the comparison, that is not an answer and the stage is red, because a gate that cannot tell whether its consumer is current is the gate this replaces.

  Internal to the release process; no consumer-facing change.

## 0.8.0

### Minor Changes

- 584359f: **Canvas ink — a halo pair for UI drawn over arbitrary imagery.**

  junoui's contrast story assumes a controlled surface, `s0` through `s3`: every role colour's ratio is computed against a known background. Content drawn over a photo, a map, a video frame or a camera feed has no known background — in one orthophoto a black shadow and a snowfield are adjacent pixels, so no single ink colour is legible and no contrast ratio can be asserted about one.

  New `ink.canvas.ink` / `ink.canvas.halo`: a pair that spans the luminance range, applied together. Over a light backing the halo carries the contrast, over a dark one the ink does. Plus `ink.vivid.*` (role hues at raised chroma, since chrome-tuned hues wash out over a saturated backdrop) and `ink.canvas.scrim` (`0.28`, for chrome floating over live content — deliberately distinct from `opacity.scrim` at `0.62`, which suppresses a modal's background and here would grey out the content being annotated).

  Shipped as CSS you can apply, not only as tokens: `.juno-canvas-ink` (+ `--lg` and the role modifiers), `.juno-canvas-ink__halo` / `__stroke` for vector marks, and `.juno-canvas-scrim` with a reduced-transparency fallback. Every platform target carries the tokens — CSS, SCSS, JS, Swift, Dart, Android and Rust.

  **The pair is not themed**, on purpose: a satellite image does not get lighter because the user chose light mode.

  **The halo is pure black because the arithmetic requires it.** The worst backing is a mid grey where both halves are weakest; the sweep floor there is 4.61:1 against a 4.5:1 requirement, and a near-black with a blue cast measures 4.43:1 and fails. The guard sweeps all 256 grey backings rather than sampling the extremes, which are the easy cases.

  Additive: no existing token or output changes.

- 63ddc0e: **Viewport orientation gizmo — compass ring, pitch arc, snap targets.**

  The orientation widget any 3D or map viewport ships: a ring showing a heading with clickable snap targets, a secondary arc for a second angle (pitch, tilt, elevation) inside a clamped range, and a centre target that resets the view. For CAD and BIM viewers, product configurators, virtual tours, model previews, floor plans, and any map with a tilt.

  **A ring, not a cube.** An Autodesk-style ViewCube is the wrong shape for anything with a privileged up-vector — a map, a terrain, a site plan — because there is no meaningful front, right or bottom face to click. A ring degrades to that case and generalises to free orbit; a cube does not go the other way.

  **The app owns the camera.** It writes `--juno-gizmo-heading` and `--juno-gizmo-pitch`; junoui rotates the needle and the hand and never stores an angle.

  The accessibility contract is why this is upstream rather than app-local: snap targets are real `<button>`s (focusable, activate on Enter _and_ Space, announced as controls, work in a screen reader's forms mode); every mark carries a real name, because `"N"` is a letter and not one; the widget is **one focus stop** with wrapping arrow keys, not eight tab stops for eight compass points; and the bearing is announced in words through a live region, because a rotating needle announces nothing and `"37deg"` is a number the listener has to convert.

  ```js
  import { enhanceGizmo, orientationLabel, bearingLabel } from 'junoui/gizmo';
  bearingLabel(37); // → "north-east"
  ```

  **The ring's diameter is derived, not chosen:** `d ≥ tap · (1 / sin(π/N) + 1)`. The tap floor moves from 24px to 44px on a coarse pointer, so a hard-coded diameter ships eight overlapping targets to a phone.

- cc1e29d: **Rust token target — `junoui/rust`.**

  junoui compiles one DTCG source to CSS, SCSS, JS, Android XML, iOS Swift, Flutter Dart and DTCG JSON. Rust was the one mainstream native target missing, so a Rust consumer had to hand-transcribe hex values — which drift silently on the first patch release, with no lint to catch the stale copy. That is the mirrored-constant defect; this removes the reason to commit it.

  `dist/rust/juno_tokens.rs` (exported as `junoui/rust`) is a dependency-free const module for any native Rust stack — egui, iced, Slint, Bevy, Dioxus desktop, Tauri's Rust side:

  ```rust
  let bg = STANDARD_DARK.s0.to_f32_array();   // a whole theme, picked at runtime
  let accent = STANDARD_DARK_ACTIVE;          // or one role, flat
  let gap = SPACE_16;                         // f32 px
  let fade = MOTION_DURATION_BASE_MS;         // f32 milliseconds
  ```

  Colors become an `Rgba` struct with `const fn hex()`, `to_f32_array()` and `with_alpha()`; core tokens are bucketed by the **form** of their value rather than by which file they came from — `px` → `f32`, `ms` → `f32` suffixed `_MS`, whole numbers → `i32`, ratios → `f32`, and CSS-authored strings (shadows, font stacks) shipped verbatim as `&str`.

  Beyond the flat constants the Swift and Dart targets ship, there is a `Palette` struct and one const per palette/mode, because a Rust app picks a theme at runtime and wants a value it can pass around. Its fields and the constants that fill it both come from junoui's role list, so a role cannot reach one and miss the other.

  `to_f32_array()` is sRGB-encoded, not linear — convert at your boundary if your pipeline wants linear.

  Additive: no existing output changes.

- cd1dd93: **Colour swatch + palette.**

  `classes.json` 0.7.0 had no class matching _swatch_ or _color_: no way to show a user-chosen colour or let someone pick one. For diagrams, calendars, tag and label systems, chart series colours, annotation tools, theming UIs and kanban boards.

  **The hard part is not the square.** A swatch shows an arbitrary colour, so its border, its focus ring and its checked indicator all have to stay visible against a colour junoui has never seen. The border is a **pair** of hairlines that do different jobs: the inset one composites over the _swatch_ and edges it against its own fill; the outset one composites over the _panel_ and separates it from the surface. With the swatch's own contrast against that panel, the boundary has three ways to be visible and needs only one.

  The alphas are measured, not chosen: at 0.45 / 0.35 a mid-grey swatch on a light panel leaves the best of the three at **2.57:1**, under the 3:1 non-text floor. At 0.65 the worst case is 3.39:1. The guard sweeps the swatch colour against both panels and keeps the old values as its control.

  **Focus rings sit outside the swatch**, so their contrast is against the panel — a known surface. A ring drawn _on_ the swatch has the same unsolvable problem as the border, and a thicker ring does not fix a hue collision.

  **Colour is never the only signal**, which is junoui's own rule and exactly what a bare swatch violates: every swatch carries an accessible name, the checked state is a **glyph** (with a dark halo, since it sits on the arbitrary colour) _plus_ a ring, and `--none` is a slash rather than a grey — a consumer without it paints unset as mid grey and the user cannot tell _grey_ from _none_.

  `.juno-palette` is the grid that goes inside an existing `.juno-popover`; the app owns the colour list and the state.

- 671db90: **Tree / outliner — nested rows, disclosure, selection, reorder.**

  `.juno-list` is flat and `.juno-accordion` is single-level. `.juno-tree` nests to arbitrary depth and carries a selection, a count slot, the same trailing-control slot `.juno-list__row` has, and a reorder handle. For layer stacks, file browsers, settings trees, org charts, comment threads and nested navigation.

  **Zero JS for the visuals.** Indentation comes from the nested `role="group"` lists the ARIA pattern already requires, so depth is structural — no per-row custom property, no level number to keep in sync with `aria-level`. Collapse is `[aria-expanded="false"]` on the item, which the app owns, exactly like `aria-pressed` elsewhere.

  **Keyboard is not optional and is not CSS.** A tree without arrow-key traversal and a roving tabindex is a list of buttons wearing tree roles, so junoui ships a stateless enhancer at `junoui/tree`:

  ```js
  import { enhanceTree } from 'junoui/tree';
  const stop = enhanceTree(document.querySelector('.juno-tree'));
  ```

  It stores nothing — expansion and selection live on the DOM and belong to you. It moves focus and dispatches `juno-tree-toggle` / `juno-tree-select` (bubbling, cancelable, `detail.item`); it does not expand, collapse, select or reorder, because expanding a node may need to load it.

  **Three states that get conflated are painted separately:** `:hover` is where the pointer is, `aria-current` is which node you are on, `aria-selected` is what the next action applies to. A layer stack has all three at once.

  **Touch.** The row holds `--juno-size-tap-min`. The caret and handle paint small so a dense tree stays dense and grow only their _hit area_ — a 44px painted caret would swallow its row. The handle is explicit and carries `touch-action: none` on itself alone: long-press-drag is the obvious gesture and the wrong one, because a tree beside a pan surface has to let the pan win.

  Reorder _logic_ stays yours; junoui ships the affordance, its hit area, and the drop styling (`data-juno-drop="before|after|into"`, `data-juno-dragging`) — where a between-rows drop and an into-a-row drop look different, because they are different operations.

### Patch Changes

- 4f466ff: **The touch defaults are generated from one declared set — conformance kit slice 2.**

  `base.css` carried two hand-maintained `:where()` lists, and both had drifted.

  **From the classes:** `.juno-seg__option` (the shipped class is `.juno-seg__opt`) and `.juno-list__item` (it is `.juno-list__row`) sat in them. `:where()` matched nothing, the rule still parsed, every other member kept working — so every segmented control and every grouped list row in every consumer kept the ~300ms double-tap delay.

  **From each other:** the tap-highlight list was a strict subset of the touch-action one, missing `__overflow`, `__opt`, `chip` and `toggle-btn`.

  **Consumer-visible change:** `.juno-chip`, `.juno-pillbar__overflow`, `.juno-seg__opt` and `.juno-toggle-btn` now have their UA tap-highlight square suppressed on a coarse pointer, like every other tappable primitive. Verified in Chromium on both pointer types. Nothing else moves.

  `src/css/touch-surfaces.mjs` is now the source of truth; the two rules are emitted from it. Adding a component to the touch defaults is one line and gets both. `touch-action` stays outside the coarse block — a hybrid device reports a fine primary pointer while still taking touch input — and the highlight stays inside it.

## 0.7.0

### Minor Changes

- aad6351: **`.juno-btn--sm` promotes to the tap target on touch; `.juno-btn--dense` is the opt-out.**

  `--sm` names a **density**, and consumers reach for it as a **semantic**. Audited across one app: 40 call sites, nearly all `--sm --ghost` meaning "secondary", shipping a 24px target on a phone — and junoui's own showcase does it twice, in a navbar action slot.

  A size modifier should not quietly become a tap-target decision. Under `(pointer: coarse)`, `.juno-btn--sm` now holds `--juno-size-tap-min` like every other control. Type and padding still shrink, so it stays a density modifier and stops being a touch-target one. **On a fine pointer nothing changes** — still 24px, the WCAG 2.2 AA floor (2.5.8) exactly.

  `.juno-btn--dense` opts a `--sm` button back out, for a toolbar that is genuinely dense on touch (a scrubber, an editor rail). It is meaningful only in combination with `--sm`, on purpose: a dense touch target should be chosen by name, never inherited from a size.

  **This is a visual change on touch devices.** Any `--sm` button in a phone layout grows to 44px unless you add `--dense`. Audit your `--sm` call sites: the ones that meant "secondary" want `--ghost` alone and are now correct for free; the ones that meant "dense" want `--dense` added.

  The rule lives in `button.css`, not `base.css`'s coarse block — a media query adds no specificity, so a `.juno-btn--sm` there would lose to `button.css`'s own `.juno-btn--sm` later in the bundle.

- 40a5e43: **Class manifest + `junoui/testing` — conformance kit slice 1.**

  A `juno-*` class name in a consumer's source is a string that has to match something in junoui's stylesheet, and nothing checked it. When it does not match, nothing fails: the file compiles, the tests pass, and the element renders as unstyled UA defaults. One consumer shipped eleven such names in a dialog; on a phone that put the confirm button off the bottom of the screen with no way to reach it. junoui had the same defect pointing the other way — `.juno-seg__option` sat in a `touch-action` list that never matched anything, because the shipped class is `.juno-seg__opt`.

  **New: `junoui/classes.json`**, generated at build time from the bundle's own selectors — `all`, `public` (the documented subset), `roles`, `components` grouped BEM-wise, plus the other `juno-*` namespaces junoui ships and a consumer writes as bare strings: `tokens`, `keyframes`, `icons`.

  **New: `junoui/testing`**, dependency-free and framework-agnostic:

  ```js
  import { assertJunoClasses } from 'junoui/testing';
  assertJunoClasses(['src/**/*.tsx'], { allowed: ['my-own-juno-namespaced-thing'] });
  ```

  It throws with every offending `file: name`, and throws rather than passing when its globs match no files.

  **What it answers:** "junoui ships nothing by this name." **What it does not:** whether the class still does what your component assumes.

  Nothing existing changes; both entries are additive.

- 447c133: The floating bar's offset from the bottom edge is now one token,
  `--juno-dock-edge-offset`, consumed by both `.juno-dock--pill`/`--float`'s margin
  and `--juno-dock-clearance`. Plus `--juno-dock-clearance-breathing` (default
  `space-8`) for the gap between the bar and the last row.

  No default changes: the offset still resolves to `space-16 + env(safe-area-inset-bottom)`
  and the clearances to the same 86px / 78px they did at a 44px bubble.

  What it fixes: the inset FORM used to be written separately at each site, so a
  consumer whose design puts the bar flush above the home indicator —
  `max(8px, env(safe-area-inset-bottom))` — changed its margin and could not change
  the reservation, which kept adding. Measured at 16px of dead band at inset 0 and
  24px at inset 34, with no value of `--juno-dock-h` able to reconcile them because
  one side added the inset and the other maxed it. Both now follow the token, so
  they agree by construction at every inset.

- e852323: **The dock publishes its horizontal item budget.**

  `.juno-dock__item` is `flex: 1 1 0`, so the bar divides its inner width by however many items are present. A consumer deciding how many to render — and whether they still hold a tap target — had to re-derive that from the numbers in `dock.css`. Two did, in prose, twice, and both drifted the same way: they subtracted 12px of inline padding where the pill actually spends 8 (`--juno-space-4` a side), so every per-item width came out ~0.8px low.

  New custom properties on `.juno-dock`:

  | Property                    | What it is                                                                                    |
  | --------------------------- | --------------------------------------------------------------------------------------------- |
  | `--juno-dock-items`         | The item budget. You set it to what you render (default `5`).                                 |
  | `--juno-dock-item-inline`   | The width one item gets — a prediction of the flex layout, asserted against the measured box. |
  | `--juno-dock-fit-inline`    | The narrowest viewport at which every item still holds `--juno-size-tap-comfortable`.         |
  | `--juno-dock-chrome-inline` | The bar's total inline chrome. `0` full-bleed, `34px` on `--pill`/`--float`.                  |
  | `--juno-dock-avail`         | The width the budget divides (default `100vw`).                                               |

  The margin, padding and border terms are declared once and consumed by both the variant's own box and the sum, so the budget cannot disagree with the bar it describes — the same construction as `--juno-dock-edge-offset`. One consequence worth knowing: `--pill`/`--float` now paint their border from `--juno-dock-border-inline`, so overriding that term to `0` removes the hairline as well as widening the items. That is deliberate — the sum follows the paint.

  **No scale floor is published.** `44px / --juno-dock-item-inline` is a ratio of two lengths and CSS cannot divide by a length. A consumer that must scale rather than drop an item compares the two values itself.

### Patch Changes

- 770f331: **fold-slot: the fold now reaches zero when composed with a component class.**
  `.juno-fold` promises its inline-size folds to zero, and the canonical use puts it on an element that already carries the capsule chrome — `.juno-pillbar__item`, `.juno-btn`, `.juno-chip`. Composed that way it could not: `min-inline-size` (the 44px tap floor), `padding-inline` and `border-inline-width` each hold a border-box inline size open, and the folded state released none of them. Measured against the built bundle at a 390px viewport, composed with `.juno-pillbar__item`: 44px folded, 20px with the floor released, 0px with all three. A consumer's pill carried one dead 44px slot whenever the folded action was absent.

  The folded state now releases all three, and each is in the fold's transition list so nothing snaps as the fold opens or shuts.

  Also fixed, and invisible from the source: `transition` is a shorthand, `.juno-fold` was one class of specificity, and `pillbar.css` sorts after `fold-slot.css` — so `.juno-pillbar__item`'s own `transition` replaced the fold's whole list and the slot jumped shut instead of folding. The fold's declarations now sit at attribute specificity, and its transition list carries the chrome properties (`color`, `background-color`) too, since owning the shorthand means owning all of it. A component of your own that composes with `.juno-fold` and needs a third property transitioned must state it above `(0,2,0)`.

- a1f3f53: New `docs/ios-pwa.md`: a bounded statement of what junoui gives you on iOS and in
  a Home-Screen web app — what you get for free, what your app must supply, and
  what junoui explicitly does not do. `docs/ios-conformance.md` gains the
  standalone `<head>` contract and names the letterbox flag
  (`data-juno-letterboxed`, app-set, documented rather than shipped).

  Docs ship in the package, so a consumer installing this version receives both.
  Two corrections travel with them: the letterbox flag is **not** an upstream-fix
  detector (that test needs a document that cannot scroll, and the unlock makes it
  scroll), and `.juno-pagination`'s items take the coarse-pointer promotion on the
  inline axis only — 44 × 32 on touch, which clears WCAG 2.5.8 AA and not the
  44 px comfortable target the docs previously implied.

- 4568157: **Two mistyped class names in the touch-default lists, and a tap floor for the segmented pill.**

  `base.css` carries two `:where()` lists of junoui's own tappable components — one dropping double-tap-to-zoom recognition (`touch-action: manipulation`), one killing the UA tap-highlight square under `(pointer: coarse)`. Two members named classes that do not exist, so `:where()` matched nothing, the rule still parsed, every other member kept working, and the named components silently kept the defaults they were listed to opt out of:

  - `.juno-seg__option` → `.juno-seg__opt` (touch-action list)
  - `.juno-list__item` → `.juno-list__row` (**both** lists)

  Every segmented control and every grouped list row in every consumer has been carrying the ~300ms double-tap delay. No consumer change is needed — the fix lands in the shipped stylesheet.

  `.juno-seg__opt` was also the only interactive primitive with no tap floor: it computed 25.39px from its padding, which meets WCAG 2.2 AA (2.5.8, 24px) by accident and misses the comfortable touch target entirely. It now holds `--juno-size-tap-min` on the painted box, like `.juno-btn`. Measured against the built bundle: **fine pointer unchanged at 25.39px, coarse 25.39 → 44.00**, width unchanged either way — so no showcase baseline moves.

  Unlike `.juno-btn--sm`, `.juno-seg--sm` does **not** drop below that floor: it reduces type and padding only. A segmented row is routinely the only control on a whole settings section, so a sub-tap variant of it has no safe use on a phone.

## 0.6.0

### Minor Changes

- 71c069c: Two primitives stop encoding junoui's own dimensions and start exposing the
  derivation, so a consumer that parameterizes them stays correct.

  - **`junoui/icons/install`** — the sprite injector without the sprite (~1 kB).
    A consumer that subsets with `junoui/subset` can now keep the same-document
    injection Safari requires without pulling the 66-symbol payload that
    `junoui/icons/inline` carries; both share one id-guarded holder, so mixing
    them cannot produce two. `icons/inline` is unchanged for everyone else.
  - **`--juno-dock-clearance` / `--juno-pillbar-clearance` are derived**, from
    new published parts: `--juno-dock-h`, `--juno-pillbar-h` and
    `--juno-dock-clearance-scale`. They were constants that promised to track the
    dock's geometry and did not — past a 58px bubble they reserved less than the
    pill's own height plus its margin, hiding content under the dock. Values at
    the default 44px bubble change from 92px to 86px (dock) and 72px to 78px
    (pillbar), both now equal to what the control actually measures plus its
    margin and a breathing gap.

- 0ee41a8: Declare the browser-support baseline, and guard the one gap that is functional.

  New `docs/browser-support.md`: the supported floor (Safari/iOS 17.5, Chrome/Edge
  117, Firefox 129), the hard floor below which things break (17.0 / 114 / 125),
  and a per-feature audit of the built bundle with a degrade-vs-break verdict on
  each. `package.json` now carries a matching `browserslist`; README and
  getting-started state the floor.

  `base.css` ships one `@supports not selector(:popover-open)` guard. Below Safari
  17.0 the Popover API is absent, and because the UA rule that hides a closed
  popover is absent with it, `.juno-menu` and `.juno-popover` were rendering as
  invisible fixed panels that swallowed taps. The guard hides them instead —
  absent beats invisibly-present, and apps can branch on
  `CSS.supports('selector(:popover-open)')`. Guards are for functional failures
  only; cosmetic gaps (missing entry animations, unanchored placement) are
  documented, not wrapped.

  `docs/ios-conformance.md` gains the viewport-unit decision it was missing:
  `dvh` stays at both `.juno-app-shell` and `.juno-drawer`, with the reasoning,
  what each option costs at the moment browser chrome retracts, and a rule for
  applying the choice to a new component. It also now records the iOS Home-Screen
  standalone letterbox — iOS sizes the window from the document's resting
  scrollability at launch — which is why `base.css` carries the standalone unlock.

  Docs and defaults only; no token or component API changed.

### Patch Changes

- cacdb21: Fix: the 16px `.juno-input` font floor on touch never applied.

  The rule lived in `base.css`'s `@media (pointer: coarse)` block, but a media
  query adds no specificity — so `components/input.css`'s own
  `.juno-input { font-size: var(--juno-font-size-14) }`, same 0,1,0 selector and
  later in the bundle, won every time. On a coarse pointer the field measured
  14px, i.e. exactly the condition the floor exists to avoid (iOS Safari zooming
  the page onto a focused sub-16px field). The rule now lives in `input.css`,
  after the declaration it has to beat.

  Found by the new coarse-pointer visual-regression project (20260815-006): the
  suite ran only `Desktop Chrome`, where `(pointer: coarse)` never matches, so
  nothing had ever exercised the rule.

- da03666: Fix: the forced-colors (Windows High Contrast) border never applied.

  `@media (forced-colors: active) { .juno-badge, .juno-btn, .juno-card,
.juno-readout { border: 1px solid CanvasText } }` lived in `base.css`, which the
  bundler emits before `components/`. A media query adds no specificity, so each
  component's own `border` declaration won on source order alone. Measured under
  emulated forced-colors: `.juno-badge` computed a transparent border — it sets
  `forced-color-adjust: none` to keep its status fill, and that opt-out also
  disables the UA repaint that was silently rescuing `.juno-btn` and `.juno-card`.

  New `src/css/overrides.css`, bundled last, is where cross-cutting `@media` /
  `@supports` gates live now — after everything they guard. Same reasoning the
  bundler already applied to `utilities.css`.

- 2ec7cff: Stop publishing junoui's internal release process to consumers: the pre-release
  consumer gate document moves from `docs/release-gate.md` to `RELEASING.md` at
  the repo root, beside CONTRIBUTING.md, which has never shipped. `files` carries
  `docs` wholesale, so the rule is now positional — `docs/` IS the published
  manual, and contributor or process documents live at the root. The published
  surface loses one file (204 → 203) and no consumer-facing content changes.

## 0.5.0

### Minor Changes

- be974dc: New `@junoput01/junoui/subset` — build-time icon-sprite subsetting for apps
  that inline the sprite (which Safari's flaky external-`<use>` rendering
  forces): `subsetSprite(sprite, names)` returns the same sprite carrying only
  the icons an app draws, and `spriteSymbolNames(sprite)` lists what it defines.
  Pure, dependency-free Node tooling; an unknown name throws rather than
  rendering an empty `<svg>` in the consumer, symbol order is stable, and the MIT
  Phosphor notice survives the trim. Adds the `cloud-slash` icon. See
  docs/icon-subsetting.md.

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
