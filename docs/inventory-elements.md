# junoui element capability inventory

Read-only census of the 52 files in `src/css/components/` as they exist on this
branch, measured from the CSS itself rather than from `docs/components/*.md`. Where the
two disagree, the disagreement is recorded as its own finding rather than picked between.

**This document makes no judgement.** It does not say whether any component is fit,
well-designed, or suitable for anything — that is W2b (the geovista gap map), which this
census exists to be checked against. It does not cover appearance (colour/weight/balance),
the JS enhancers in `tools/`, or anything under `design/` (the imported reference canvas,
not shipped).

## Headline count

**52 component files**, not 51 — the ticket's count was written before `dot.css`,
`gizmo.css`, `load-state.css`, `reload.css`, `swatch.css` and others landed; count them,
don't trust the number written down elsewhere, including in this repo's own CLAUDE.md
roadmap section. Re-run `ls src/css/components | wc -l` before trusting this number too.

**Slot order — the number W5 is waiting on:** **23 of 52 have a fixed slot order,
25 do not, 4 are ambiguous.**

- **Fixed (23)** — a non-CSS implementation would have to reproduce a specific part
  sequence, either because the CSS structurally requires it (a sibling combinator, a native
  HTML element order) or because normal-flow layout with no reordering mechanism makes DOM
  order the visual order.
- **Free (25)** — includes both the 13 components with no BEM parts at all
  (0-part case, trivially free) and the 12 multi-part components where every part is
  either independently positioned (absolute, pinned by its own class/custom property) or
  explicitly documented as order-independent in the source.
- **Ambiguous (4)** — `gizmo`, `loader`, `range`, `table`. Each mixes a fixed-order
  region with a free-order or data-driven region; see each row's reasoning below. These are
  real ambiguity, not rounding — do not fold them into either other bucket.

## Spot checks (hand-verified against the scripted output)

Five components were read in full and checked against the script's output before trusting
it, per the vacuity floor below. Chosen to cover the two structural hooks named in the
ticket (`:has()`, `@container`) plus a spread of slot-order verdicts:

- **`button`** — 0 parts, `n/a` slot order. Confirms the parser correctly returns an empty
  part list rather than a false positive on `.juno-btn--ghost`/`--sm` (modifiers, not parts).
- **`switch`** — `fixed`. `.juno-switch__input:checked + .juno-switch__track` is a real CSS
  constraint: `__input` must be the immediately preceding sibling of `__track`, not a
  convention.
- **`card`** — has the `@container (max-width: 320px)` query. `fixed`: normal-flow flex
  column (head before body); the container query only flips `__row`'s internal direction,
  it doesn't touch part order.
- **`pillbar`** — has `:has()`. `free`, and unusually this one didn't need inference: the
  source comment says so outright — "the bar reads it via `:has()`, so DOM order of toggle
  vs. tray is free (toggle-first for a left-anchored pill, toggle-last for right-anchored)".
- **`table`** — has both `@container` and a viewport `@media` query. `ambiguous`: the
  `__toolbar`/table/`__foot` wrapper order is fixed, but roughly twenty cell-content-type
  modifiers (`__num`, `__mono`, `__trend`, `__meter`, ...) are column classes whose order is
  entirely app/data-driven — not a junoui-fixed sequence at all.

## Vacuity floor

The script asserts at least 45 component files parsed (52 found — floor met) and at
least one `var(--juno-*)` token found in `button.css` (25 found — floor met, not vacuous).
Every one of the 52 files below produced at least one measured field; none came back empty,
which is itself worth stating rather than assuming.

## Method notes

- **Parts** are the distinct `__part` BEM segments found via regex over the comment-stripped
  CSS text; a modifier suffix on a part (e.g. `__thumb--hi`) is folded into its base part
  (`thumb`) and counted once, with the modifier listed separately in the Modifiers column.
- **Local custom properties** are filtered against the exact allowlist in
  `test/build.test.mjs`'s "every var() is defined" test — the authoritative list of
  runtime/component-local props — with the shared cross-cutting ones (`--juno-role`,
  `--juno-motion*`, `--juno-safe-*`, `--juno-touch-action`, and the seven density-layer vars)
  excluded, since those are not one component's own configuration surface.
- **Density** is "yes" if the file reads one of the seven `src/css/density.css` variables
  (`--juno-pad-control-*`, `--juno-pad-surface-*`, `--juno-gap-control`, `--juno-gap-content`,
  `--juno-tile-min`) or matches `[data-juno-density]` directly.
- **Responsive mechanism** is reported as `container query`, `viewport media query`, `both`,
  or `neither`, based on the presence of `@container` / `@media` anywhere in the file — a media
  query for `prefers-reduced-motion` or `pointer: coarse` still counts as a viewport media
  query here even when it isn't about breakpoints, since the column is about the mechanism
  used, not its purpose.

## Per-component census

### `accordion`

- **BEM parts** (3): `__body`, `__item`, `__summary`
- **Modifiers** (0): _none_
- **States/hooks** (2): `:hover`, `[open]`
- **Tokens read** (21): `--juno-border`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-data`, `--juno-font-family-sans`, `--juno-font-lineHeight-relaxed`, `--juno-font-size-13`, `--juno-font-weight-medium`, `--juno-label`, `--juno-motion-duration-quick`, `--juno-motion-ease-standard`, `--juno-muted`, `--juno-pad-control-block`, `--juno-pad-surface-block`, `--juno-pad-surface-inline`, `--juno-radius-5`, `--juno-s0`, `--juno-s1`, `--juno-s2`, `--juno-space-12`, `--juno-space-8`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: yes (`--juno-pad-control-block`, `--juno-pad-surface-block`, `--juno-pad-surface-inline`)
- **Slot order**: **fixed** — native `<details>`/`<summary>` element order

### `alert`

- **BEM parts** (6): `__actions`, `__body`, `__close`, `__icon`, `__text`, `__title`
- **Modifiers** (1): `--solid`
- **States/hooks** (1): `:hover`
- **Tokens read** (20): `--juno-active`, `--juno-border-width-1`, `--juno-border-width-3`, `--juno-data`, `--juno-font-family-sans`, `--juno-font-lineHeight-none`, `--juno-font-lineHeight-relaxed`, `--juno-font-size-13`, `--juno-font-size-16`, `--juno-font-weight-semibold`, `--juno-label`, `--juno-muted`, `--juno-pad-surface-block`, `--juno-pad-surface-inline`, `--juno-radius-5`, `--juno-role`, `--juno-s0`, `--juno-space-12`, `--juno-space-2`, `--juno-space-8`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: yes (`--juno-pad-surface-block`, `--juno-pad-surface-inline`)
- **Slot order**: **fixed** — flex row, normal flow (icon, body, close)

### `avatar`

- **BEM parts** (0): _none_
- **Modifiers** (5): `--lg`, `--ring`, `--sm`, `--square`, `--xl`
- **States/hooks** (0): _none_
- **Tokens read** (16): `--juno-avatar-size`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-control-edge-strong`, `--juno-control-surface`, `--juno-font-family-sans`, `--juno-font-tracking-tight`, `--juno-font-weight-semibold`, `--juno-label`, `--juno-radius-4`, `--juno-role`, `--juno-s0`, `--juno-space-24`, `--juno-space-32`, `--juno-space-40`, `--juno-space-56`
- **Local custom properties** (1): `--juno-avatar-size`
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **n/a** — no BEM parts

### `badge`

- **BEM parts** (0): _none_
- **Modifiers** (3): `--micro`, `--outline`, `--soft`
- **States/hooks** (0): _none_
- **Tokens read** (17): `--juno-border-width-1`, `--juno-font-family-mono`, `--juno-font-family-sans`, `--juno-font-size-10`, `--juno-font-size-11`, `--juno-font-tracking-caps`, `--juno-font-tracking-normal`, `--juno-font-weight-bold`, `--juno-font-weight-semibold`, `--juno-muted`, `--juno-radius-2`, `--juno-radius-3`, `--juno-role`, `--juno-s0`, `--juno-space-10`, `--juno-space-2`, `--juno-space-4`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **n/a** — no BEM parts

### `breadcrumb`

- **BEM parts** (0): _none_
- **Modifiers** (0): _none_
- **States/hooks** (3): `:hover`, `:focus-visible`, `[aria-current]`
- **Tokens read** (13): `--juno-active`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-data`, `--juno-font-family-sans`, `--juno-font-size-13`, `--juno-font-weight-semibold`, `--juno-label`, `--juno-muted`, `--juno-radius-2`, `--juno-space-2`, `--juno-space-4`, `--juno-space-8`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **n/a** — no BEM parts

### `button`

- **BEM parts** (0): _none_
- **Modifiers** (3): `--dense`, `--ghost`, `--sm`
- **States/hooks** (3): `:hover`, `:active`, `:disabled`
- **Tokens read** (25): `--juno-active`, `--juno-border`, `--juno-border-width-1`, `--juno-data`, `--juno-font-family-sans`, `--juno-font-size-11`, `--juno-font-size-13`, `--juno-font-tracking-caps`, `--juno-font-tracking-wide`, `--juno-font-weight-bold`, `--juno-font-weight-semibold`, `--juno-gap-control`, `--juno-label`, `--juno-muted`, `--juno-pad-control-block`, `--juno-pad-control-inline`, `--juno-radius-3`, `--juno-radius-4`, `--juno-role`, `--juno-s0`, `--juno-s2`, `--juno-size-tap-min`, `--juno-space-10`, `--juno-space-24`, `--juno-space-4`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: viewport media query
- **Density-aware**: yes (`--juno-gap-control`, `--juno-pad-control-block`, `--juno-pad-control-inline`)
- **Slot order**: **n/a** — no BEM parts

### `canvas-ink`

- **BEM parts** (2): `__halo`, `__stroke`
- **Modifiers** (6): `--active`, `--caution`, `--lg`, `--nominal`, `--target`, `--warning`
- **States/hooks** (0): _none_
- **Tokens read** (11): `--juno-ink-canvas-halo`, `--juno-ink-canvas-halo-width`, `--juno-ink-canvas-halo-width-lg`, `--juno-ink-canvas-ink`, `--juno-ink-canvas-scrim`, `--juno-ink-vivid-active`, `--juno-ink-vivid-caution`, `--juno-ink-vivid-nominal`, `--juno-ink-vivid-target`, `--juno-ink-vivid-warning`, `--juno-s0`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: viewport media query
- **Density-aware**: no
- **Slot order**: **free** — `__stroke` is an alternate SVG treatment, not a sibling slot of the text-halo base class

### `card`

- **BEM parts** (3): `__body`, `__head`, `__row`
- **Modifiers** (2): `--accent`, `--alert`
- **States/hooks** (0): _none_
- **Tokens read** (18): `--juno-active`, `--juno-border`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-data`, `--juno-font-size-12`, `--juno-font-tracking-wide`, `--juno-font-weight-semibold`, `--juno-pad-surface-block`, `--juno-pad-surface-inline`, `--juno-radius-8`, `--juno-role`, `--juno-s1`, `--juno-s2`, `--juno-space-12`, `--juno-space-16`, `--juno-space-2`, `--juno-space-8`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: container query
- **Density-aware**: yes (`--juno-pad-surface-block`, `--juno-pad-surface-inline`)
- **Slot order**: **fixed** — flex column, normal flow (head before body); the container query only flips `__row`’s internal direction

### `checkbox`

- **BEM parts** (0): _none_
- **Modifiers** (0): _none_
- **States/hooks** (3): `:disabled`, `:has()`, `:checked`
- **Tokens read** (19): `--juno-active`, `--juno-border-width-1`, `--juno-border-width-3`, `--juno-control-edge-strong`, `--juno-control-surface`, `--juno-data`, `--juno-font-family-sans`, `--juno-font-size-13`, `--juno-gap-control`, `--juno-motion-duration-quick`, `--juno-motion-ease-spring`, `--juno-motion-ease-standard`, `--juno-muted`, `--juno-opacity-disabled`, `--juno-radius-2`, `--juno-role`, `--juno-s1`, `--juno-space-16`, `--juno-space-8`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: yes (`--juno-gap-control`)
- **Slot order**: **n/a** — no BEM parts

### `chip`

- **BEM parts** (1): `__remove`
- **Modifiers** (1): `--toggle`
- **States/hooks** (5): `:hover`, `:focus-visible`, `:disabled`, `[aria-disabled]`, `[aria-pressed]`
- **Tokens read** (20): `--juno-active`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-control-edge-strong`, `--juno-control-surface`, `--juno-data`, `--juno-font-family-sans`, `--juno-font-size-12`, `--juno-font-tracking-tight`, `--juno-label`, `--juno-motion-duration-quick`, `--juno-motion-ease-standard`, `--juno-opacity-disabled`, `--juno-opacity-muted`, `--juno-role`, `--juno-space-12`, `--juno-space-2`, `--juno-space-24`, `--juno-space-4`, `--juno-space-8`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **free** — single optional part (`__remove`), no sequence to fix

### `divider`

- **BEM parts** (0): _none_
- **Modifiers** (2): `--label`, `--vertical`
- **States/hooks** (0): _none_
- **Tokens read** (8): `--juno-border`, `--juno-border-width-1`, `--juno-font-family-sans`, `--juno-font-size-11`, `--juno-font-tracking-label`, `--juno-label`, `--juno-space-12`, `--juno-space-16`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **n/a** — no BEM parts

### `dock`

- **BEM parts** (5): `__bubble`, `__item`, `__knob`, `__label`, `__tray`
- **Modifiers** (5): `--collapsible`, `--fixed`, `--float`, `--icon`, `--pill`
- **States/hooks** (4): `:hover`, `:focus-visible`, `[aria-current]`, `[data-juno-collapsed]`
- **Tokens read** (41): `--juno-active`, `--juno-border`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-data`, `--juno-dock-avail`, `--juno-dock-border-inline`, `--juno-dock-chrome-inline`, `--juno-dock-collapsed-size`, `--juno-dock-edge-gap`, `--juno-dock-edge-offset`, `--juno-dock-fold`, `--juno-dock-fold-scale`, `--juno-dock-fold-shrink`, `--juno-dock-fold-slide`, `--juno-dock-fold-smoothing`, `--juno-dock-fold-split`, `--juno-dock-items`, `--juno-dock-margin-inline`, `--juno-dock-pad-inline`, `--juno-dock-scale`, `--juno-font-family-sans`, `--juno-font-size-10`, `--juno-font-tracking-label`, `--juno-font-weight-semibold`, `--juno-label`, `--juno-motion-duration-quick`, `--juno-motion-ease-standard`, `--juno-motion-scale`, `--juno-role`, `--juno-s1`, `--juno-s2`, `--juno-s3`, `--juno-safe-bottom`, `--juno-shadow-2`, `--juno-size-tap-comfortable`, `--juno-space-12`, `--juno-space-2`, `--juno-space-32`, `--juno-space-4`, `--juno-z-raised`
- **Local custom properties** (19): `--juno-dock-avail`, `--juno-dock-border-inline`, `--juno-dock-chrome-inline`, `--juno-dock-collapsed-size`, `--juno-dock-edge-gap`, `--juno-dock-fit-inline`, `--juno-dock-fold-scale`, `--juno-dock-fold-shrink`, `--juno-dock-fold-slide`, `--juno-dock-fold-smoothing`, `--juno-dock-fold-split`, `--juno-dock-item-inline`, `--juno-dock-items`, `--juno-dock-margin-inline`, `--juno-dock-pad-inline`, `--juno-dock-scale`, `--juno-icon-loader-ring`, `--juno-icon-loader-ring-width`, `--juno-icon-size`
- **Responsive mechanism**: viewport media query
- **Density-aware**: no
- **Slot order**: **fixed** — flex row of nav items in document order; `__bubble`/`__label` are alternates within one item, not a cross-item sequence

### `dock-responsive`

- **BEM parts** (0): _none_
- **Modifiers** (1): `--responsive`
- **States/hooks** (0): _none_
- **Tokens read** (0): _none_
- **Local custom properties** (0): _none_
- **Responsive mechanism**: viewport media query
- **Density-aware**: no
- **Slot order**: **n/a** — no BEM parts

### `dot`

- **BEM parts** (1): `__dot`
- **Modifiers** (2): `--lg`, `--live`
- **States/hooks** (0): _none_
- **Tokens read** (7): `--juno-font-size-12`, `--juno-font-tracking-label`, `--juno-nominal`, `--juno-role`, `--juno-size-dot-md`, `--juno-size-dot-sm`, `--juno-space-8`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **free** — single part, no sequence to fix

### `drawer`

- **BEM parts** (2): `__body`, `__handle`
- **Modifiers** (2): `--bottom`, `--start`
- **States/hooks** (1): `[open]`
- **Tokens read** (13): `--juno-border`, `--juno-border-strong`, `--juno-border-width-1`, `--juno-motion-duration-base`, `--juno-motion-ease-decel`, `--juno-pad-surface-inline`, `--juno-radius-8`, `--juno-safe-bottom`, `--juno-sheet-h`, `--juno-sheet-max`, `--juno-space-4`, `--juno-space-40`, `--juno-space-8`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: viewport media query
- **Density-aware**: yes (`--juno-pad-surface-inline`)
- **Slot order**: **fixed** — `__handle` must precede `__body` in normal flow to render as the top grab strip

### `field`

- **BEM parts** (4): `__error`, `__help`, `__label`, `__req`
- **Modifiers** (0): _none_
- **States/hooks** (0): _none_
- **Tokens read** (8): `--juno-font-family-sans`, `--juno-font-size-10`, `--juno-font-size-11`, `--juno-font-tracking-wider`, `--juno-label`, `--juno-space-2`, `--juno-space-4`, `--juno-warning`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **fixed** — flex column, normal flow (label -> control -> help/error)

### `fold-slot`

- **BEM parts** (0): _none_
- **Modifiers** (0): _none_
- **States/hooks** (1): `[data-juno-in]`
- **Tokens read** (6): `--juno-fold-gap`, `--juno-fold-size`, `--juno-motion-duration-base`, `--juno-motion-duration-quick`, `--juno-motion-ease-standard`, `--juno-size-tap-comfortable`
- **Local custom properties** (2): `--juno-fold-gap`, `--juno-fold-size`
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **free** — repeated single part type; order is the app’s data order, not a junoui-fixed sequence

### `gauge`

- **BEM parts** (2): `__label`, `__value`
- **Modifiers** (2): `--lg`, `--sm`
- **States/hooks** (0): _none_
- **Tokens read** (17): `--juno-active`, `--juno-border`, `--juno-font-family-mono`, `--juno-font-family-sans`, `--juno-font-size-10`, `--juno-font-size-11`, `--juno-font-size-13`, `--juno-font-size-20`, `--juno-font-tracking-caps`, `--juno-font-weight-bold`, `--juno-gauge-size`, `--juno-gauge-value`, `--juno-gauge-width`, `--juno-label`, `--juno-motion-duration-base`, `--juno-motion-ease-standard`, `--juno-role`
- **Local custom properties** (2): `--juno-gauge-size`, `--juno-gauge-width`
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **free** — `__value` is absolutely centered inside the ring; `__label` is typically a separate external sibling with no positional dependency

### `gizmo`

- **BEM parts** (7): `__arc`, `__arc-hand`, `__center`, `__mark`, `__needle`, `__readout`, `__ring`
- **Modifiers** (0): _none_
- **States/hooks** (3): `:hover`, `:focus-visible`, `[aria-current]`
- **Tokens read** (28): `--juno-active`, `--juno-border`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-data`, `--juno-font-family-sans`, `--juno-font-size-11`, `--juno-font-tracking-label`, `--juno-font-weight-bold`, `--juno-gizmo-at`, `--juno-gizmo-heading`, `--juno-gizmo-marks`, `--juno-gizmo-pitch`, `--juno-gizmo-pitch-max`, `--juno-gizmo-pitch-min`, `--juno-gizmo-size`, `--juno-label`, `--juno-motion-duration-base`, `--juno-motion-ease-standard`, `--juno-motion-scale`, `--juno-role`, `--juno-s1`, `--juno-s2`, `--juno-s3`, `--juno-size-tap-min`, `--juno-space-2`, `--juno-space-4`, `--juno-space-8`
- **Local custom properties** (6): `--juno-gizmo-heading`, `--juno-gizmo-marks`, `--juno-gizmo-pitch`, `--juno-gizmo-pitch-max`, `--juno-gizmo-pitch-min`, `--juno-gizmo-size`
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **ambiguous** — `__readout` is fixed before the dial (normal flow), but `__needle`/`__mark`/`__center`/`__arc-hand` are each absolutely positioned by their own custom-property angle, independent of DOM order

### `icon`

- **BEM parts** (0): _none_
- **Modifiers** (4): `--lg`, `--role`, `--sm`, `--xl`
- **States/hooks** (0): _none_
- **Tokens read** (2): `--juno-icon-size`, `--juno-role`
- **Local custom properties** (1): `--juno-icon-size`
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **free** — single optional part (`__chevron`), no sequence to fix

### `icon-loader`

- **BEM parts** (0): _none_
- **Modifiers** (0): _none_
- **States/hooks** (0): _none_
- **Tokens read** (3): `--juno-active`, `--juno-icon-loader-ring`, `--juno-icon-loader-ring-width`
- **Local custom properties** (2): `--juno-arc-size`, `--juno-arc-width`
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **n/a** — no BEM parts

### `input`

- **BEM parts** (0): _none_
- **Modifiers** (1): `--sans`
- **States/hooks** (3): `:focus-visible`, `:disabled`, `[aria-invalid]`
- **Tokens read** (19): `--juno-active`, `--juno-border`, `--juno-border-width-1`, `--juno-control-edge-strong`, `--juno-control-surface`, `--juno-data`, `--juno-font-family-mono`, `--juno-font-family-sans`, `--juno-font-lineHeight-loose`, `--juno-font-size-14`, `--juno-font-size-16`, `--juno-muted`, `--juno-pad-control-block`, `--juno-radius-4`, `--juno-role`, `--juno-s1`, `--juno-size-tap-min`, `--juno-space-12`, `--juno-warning`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: viewport media query
- **Density-aware**: yes (`--juno-pad-control-block`)
- **Slot order**: **n/a** — no BEM parts

### `list`

- **BEM parts** (9): `__chevron`, `__group`, `__header`, `__icon`, `__label`, `__main`, `__row`, `__support`, `__value`
- **Modifiers** (0): _none_
- **States/hooks** (3): `:hover`, `:focus-visible`, `:disabled`
- **Tokens read** (24): `--juno-active`, `--juno-border`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-data`, `--juno-font-family-mono`, `--juno-font-family-sans`, `--juno-font-size-11`, `--juno-font-size-12`, `--juno-font-size-13`, `--juno-font-tracking-label`, `--juno-font-weight-bold`, `--juno-label`, `--juno-muted`, `--juno-opacity-disabled`, `--juno-radius-8`, `--juno-s1`, `--juno-s2`, `--juno-size-tap-comfortable`, `--juno-space-12`, `--juno-space-16`, `--juno-space-2`, `--juno-space-20`, `--juno-space-8`
- **Local custom properties** (1): `--juno-icon-size`
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **fixed** — flex, normal flow throughout (header, group, row internals)

### `load-state`

- **BEM parts** (1): `__icon`
- **Modifiers** (0): _none_
- **States/hooks** (2): `[data-juno-state]`, `[data-juno-when]`
- **Tokens read** (18): `--juno-border-width-1`, `--juno-caution`, `--juno-control-edge`, `--juno-font-family-mono`, `--juno-font-size-18`, `--juno-label`, `--juno-muted`, `--juno-radius-3`, `--juno-radius-8`, `--juno-role`, `--juno-s2`, `--juno-s3`, `--juno-shimmer-dur`, `--juno-space-12`, `--juno-space-24`, `--juno-space-40`, `--juno-space-56`, `--juno-space-8`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **fixed** — flex row, normal flow (icon before text) in both `__fault`/`__empty` treatments

### `loader`

- **BEM parts** (5): `__core`, `__fill`, `__hub`, `__label`, `__track`
- **Modifiers** (3): `--determinate`, `--indeterminate`, `--smooth`
- **States/hooks** (0): _none_
- **Tokens read** (17): `--juno-active`, `--juno-arc-size`, `--juno-arc-width`, `--juno-beacon-fill-stop`, `--juno-beacon-size`, `--juno-border`, `--juno-data`, `--juno-font-family-mono`, `--juno-font-size-13`, `--juno-font-weight-bold`, `--juno-motion-duration-quick`, `--juno-progress`, `--juno-radius-3`, `--juno-role`, `--juno-s1`, `--juno-s2`, `--juno-s3`
- **Local custom properties** (4): `--juno-arc-size`, `--juno-arc-width`, `--juno-beacon-fill-stop`, `--juno-beacon-size`
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **ambiguous** — `.juno-arc__label` is normal-flow text but `.juno-beacon`’s core/track/fill/hub are absolutely-stacked layers with no explicit z-index override, so paint order rides on DOM order without being documented as load-bearing

### `menu`

- **BEM parts** (4): `__icon`, `__item`, `__kbd`, `__sep`
- **Modifiers** (0): _none_
- **States/hooks** (4): `:hover`, `:focus-visible`, `:disabled`, `[aria-disabled]`
- **Tokens read** (25): `--juno-border`, `--juno-border-width-1`, `--juno-data`, `--juno-font-family-mono`, `--juno-font-family-sans`, `--juno-font-size-10`, `--juno-font-size-11`, `--juno-font-size-13`, `--juno-gap-control`, `--juno-label`, `--juno-motion-duration-quick`, `--juno-motion-ease-decel`, `--juno-muted`, `--juno-opacity-disabled`, `--juno-radius-4`, `--juno-radius-5`, `--juno-role`, `--juno-s2`, `--juno-s3`, `--juno-shadow-2`, `--juno-size-tap-min`, `--juno-space-10`, `--juno-space-16`, `--juno-space-4`, `--juno-space-8`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: yes (`--juno-gap-control`)
- **Slot order**: **fixed** — flex column list; icon/kbd order fixed relative to each item, matches the header usage example

### `modal`

- **BEM parts** (8): `__body`, `__close`, `__foot`, `__head`, `__stripe`, `__tag`, `__text`, `__title`
- **Modifiers** (0): _none_
- **States/hooks** (2): `:hover`, `[open]`
- **Tokens read** (32): `--juno-active`, `--juno-border`, `--juno-border-width-1`, `--juno-border-width-3`, `--juno-data`, `--juno-font-family-mono`, `--juno-font-family-sans`, `--juno-font-lineHeight-loose`, `--juno-font-lineHeight-snug`, `--juno-font-size-10`, `--juno-font-size-13`, `--juno-font-size-20`, `--juno-font-tracking-wider`, `--juno-font-weight-light`, `--juno-gap-control`, `--juno-label`, `--juno-motion-duration-deliberate`, `--juno-motion-ease-decel`, `--juno-opacity-scrim`, `--juno-pad-surface-inline`, `--juno-radius-4`, `--juno-radius-8`, `--juno-role`, `--juno-s1`, `--juno-s2`, `--juno-safe-bottom`, `--juno-shadow-3`, `--juno-size-tap-min`, `--juno-space-12`, `--juno-space-16`, `--juno-space-24`, `--juno-space-8`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: viewport media query
- **Density-aware**: yes (`--juno-gap-control`, `--juno-pad-surface-inline`)
- **Slot order**: **fixed** — flex column throughout (stripe, head, body; head’s tag/close and body’s title/text/foot all normal flow)

### `navbar`

- **BEM parts** (4): `__actions`, `__back`, `__back-label`, `__title`
- **Modifiers** (0): _none_
- **States/hooks** (2): `:hover`, `:focus-visible`
- **Tokens read** (18): `--juno-active`, `--juno-border`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-data`, `--juno-font-family-sans`, `--juno-font-size-11`, `--juno-font-size-14`, `--juno-font-tracking-label`, `--juno-font-weight-semibold`, `--juno-s1`, `--juno-safe-top`, `--juno-size-tap-comfortable`, `--juno-size-tap-min`, `--juno-space-2`, `--juno-space-4`, `--juno-space-8`, `--juno-z-raised`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **fixed** — CSS Grid with 3 explicit `grid-template-columns` but no `grid-template-areas` — auto-placement follows DOM order

### `pagination`

- **BEM parts** (2): `__gap`, `__item`
- **Modifiers** (0): _none_
- **States/hooks** (4): `:hover`, `:focus-visible`, `:disabled`, `[aria-current]`
- **Tokens read** (19): `--juno-active`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-control-edge-strong`, `--juno-control-surface`, `--juno-data`, `--juno-font-family-mono`, `--juno-font-size-13`, `--juno-motion-duration-quick`, `--juno-motion-ease-standard`, `--juno-muted`, `--juno-opacity-disabled`, `--juno-radius-4`, `--juno-size-tap-min`, `--juno-space-2`, `--juno-space-20`, `--juno-space-32`, `--juno-space-4`, `--juno-space-8`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **fixed** — inline flow sequence of items/gaps in given order; nothing reorders them

### `pillbar`

- **BEM parts** (7): `__input`, `__item`, `__label`, `__overflow`, `__sep`, `__toggle`, `__tray`
- **Modifiers** (7): `--bottom-left`, `--bottom-right`, `--collapsible`, `--fixed`, `--responsive`, `--top-left`, `--top-right`
- **States/hooks** (7): `:hover`, `:focus-visible`, `:disabled`, `[aria-current]`, `[aria-expanded]`, `[aria-pressed]`, `:has()`
- **Tokens read** (42): `--juno-active`, `--juno-border`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-data`, `--juno-font-family-sans`, `--juno-font-size-10`, `--juno-font-size-16`, `--juno-font-tracking-label`, `--juno-font-weight-semibold`, `--juno-label`, `--juno-motion-duration-deliberate`, `--juno-motion-duration-quick`, `--juno-motion-ease-standard`, `--juno-muted`, `--juno-opacity-disabled`, `--juno-pillbar-chrome-inline`, `--juno-pillbar-edge`, `--juno-pillbar-edge-offset`, `--juno-pillbar-gap`, `--juno-pillbar-inline`, `--juno-pillbar-item`, `--juno-pillbar-items`, `--juno-pillbar-pad`, `--juno-role`, `--juno-s1`, `--juno-s3`, `--juno-safe-bottom`, `--juno-safe-left`, `--juno-safe-right`, `--juno-safe-top`, `--juno-shadow-2`, `--juno-size-tap-comfortable`, `--juno-space-10`, `--juno-space-12`, `--juno-space-16`, `--juno-space-2`, `--juno-space-20`, `--juno-space-4`, `--juno-space-8`, `--juno-z-anchored`, `--juno-z-raised`
- **Local custom properties** (9): `--juno-pillbar-chrome-inline`, `--juno-pillbar-edge`, `--juno-pillbar-edge-offset`, `--juno-pillbar-fit-inline`, `--juno-pillbar-gap`, `--juno-pillbar-inline`, `--juno-pillbar-item`, `--juno-pillbar-items`, `--juno-pillbar-pad`
- **Responsive mechanism**: viewport media query
- **Density-aware**: no
- **Slot order**: **free** — explicitly documented in the source: the tray is read via `:has()`, so "DOM order of toggle vs. tray is free (toggle-first for a left-anchored pill, toggle-last for right-anchored)"

### `popover`

- **BEM parts** (1): `__arrow`
- **Modifiers** (0): _none_
- **States/hooks** (0): _none_
- **Tokens read** (14): `--juno-border`, `--juno-border-width-1`, `--juno-data`, `--juno-motion-duration-quick`, `--juno-motion-ease-decel`, `--juno-pad-surface-block`, `--juno-pad-surface-inline`, `--juno-radius-5`, `--juno-s2`, `--juno-shadow-2`, `--juno-space-12`, `--juno-space-24`, `--juno-space-4`, `--juno-space-8`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: yes (`--juno-pad-surface-block`, `--juno-pad-surface-inline`)
- **Slot order**: **free** — single part (`__arrow`), absolutely positioned, no sequence to fix

### `rail`

- **BEM parts** (3): `__brand`, `__item`, `__label`
- **Modifiers** (2): `--collapsed`, `--responsive`
- **States/hooks** (3): `:hover`, `:focus-visible`, `[aria-current]`
- **Tokens read** (26): `--juno-active`, `--juno-border`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-data`, `--juno-font-family-mono`, `--juno-font-family-sans`, `--juno-font-size-12`, `--juno-font-size-13`, `--juno-font-tracking-label`, `--juno-font-tracking-wide`, `--juno-font-weight-bold`, `--juno-font-weight-semibold`, `--juno-gap-control`, `--juno-label`, `--juno-motion-duration-base`, `--juno-motion-ease-standard`, `--juno-rail-width`, `--juno-role`, `--juno-s1`, `--juno-s2`, `--juno-s3`, `--juno-space-16`, `--juno-space-2`, `--juno-space-56`, `--juno-space-8`
- **Local custom properties** (1): `--juno-rail-width`
- **Responsive mechanism**: viewport media query
- **Density-aware**: yes (`--juno-gap-control`)
- **Slot order**: **fixed** — flex column, normal flow (brand before items)

### `range`

- **BEM parts** (3): `__fill`, `__thumb`, `__track`
- **Modifiers** (2): `--hi`, `--lo`
- **States/hooks** (3): `:focus-visible`, `[aria-disabled]`, `[data-juno-dragging]`
- **Tokens read** (15): `--juno-active`, `--juno-border-width-2`, `--juno-control-edge-strong`, `--juno-motion-duration-quick`, `--juno-motion-ease-standard`, `--juno-opacity-disabled`, `--juno-range-grip`, `--juno-range-hi`, `--juno-range-lo`, `--juno-range-track`, `--juno-role`, `--juno-s0`, `--juno-size-tap-min`, `--juno-space-16`, `--juno-space-4`
- **Local custom properties** (4): `--juno-range-grip`, `--juno-range-hi`, `--juno-range-lo`, `--juno-range-track`
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **ambiguous** — track/fill/thumb are all absolutely positioned; default stacking follows DOM order, but the interactive/dragging case explicitly overrides it with `z-index: 1` rather than relying on order

### `readout`

- **BEM parts** (3): `__label`, `__unit`, `__value`
- **Modifiers** (1): `--alert`
- **States/hooks** (0): _none_
- **Tokens read** (17): `--juno-border-width-1`, `--juno-data`, `--juno-font-family-mono`, `--juno-font-lineHeight-none`, `--juno-font-size-10`, `--juno-font-size-11`, `--juno-font-size-38`, `--juno-font-tracking-wider`, `--juno-font-weight-bold`, `--juno-label`, `--juno-radius-5`, `--juno-role`, `--juno-s2`, `--juno-space-16`, `--juno-space-20`, `--juno-space-4`, `--juno-space-8`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **fixed** — flex, normal flow (label -> value -> unit), matches usage example

### `reload`

- **BEM parts** (1): `__dot`
- **Modifiers** (0): _none_
- **States/hooks** (0): _none_
- **Tokens read** (5): `--juno-active`, `--juno-role`, `--juno-space-16`, `--juno-space-8`, `--juno-z-anchored`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **free** — single part, no sequence to fix

### `scrubber`

- **BEM parts** (9): `__head`, `__loaded`, `__mark`, `__played`, `__preview`, `__range`, `__tick`, `__ticks`, `__track`
- **Modifiers** (2): `--in`, `--out`
- **States/hooks** (2): `:focus-visible`, `[aria-disabled]`
- **Tokens read** (21): `--juno-active`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-control-edge-strong`, `--juno-muted`, `--juno-opacity-disabled`, `--juno-radius-4`, `--juno-role`, `--juno-s0`, `--juno-scrubber-head`, `--juno-scrubber-in`, `--juno-scrubber-loaded`, `--juno-scrubber-mark`, `--juno-scrubber-out`, `--juno-scrubber-played`, `--juno-scrubber-preview-at`, `--juno-scrubber-track`, `--juno-size-tap-min`, `--juno-space-12`, `--juno-space-2`, `--juno-space-4`
- **Local custom properties** (7): `--juno-scrubber-head`, `--juno-scrubber-in`, `--juno-scrubber-loaded`, `--juno-scrubber-mark`, `--juno-scrubber-out`, `--juno-scrubber-played`, `--juno-scrubber-track`
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **fixed** — all parts are absolutely positioned, but no z-index overrides exist — correct layering (loaded under played, marks over track) depends on the documented DOM order to paint correctly

### `segmented`

- **BEM parts** (1): `__opt`
- **Modifiers** (1): `--sm`
- **States/hooks** (6): `:hover`, `:focus-visible`, `:disabled`, `[aria-pressed]`, `:has()`, `:checked`
- **Tokens read** (25): `--juno-active`, `--juno-border`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-data`, `--juno-font-family-sans`, `--juno-font-size-10`, `--juno-font-size-11`, `--juno-font-tracking-label`, `--juno-font-tracking-wide`, `--juno-font-weight-bold`, `--juno-gap-control`, `--juno-label`, `--juno-motion-duration-quick`, `--juno-motion-ease-standard`, `--juno-opacity-disabled`, `--juno-radius-3`, `--juno-role`, `--juno-s2`, `--juno-s3`, `--juno-size-tap-min`, `--juno-space-10`, `--juno-space-2`, `--juno-space-4`, `--juno-space-8`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: yes (`--juno-gap-control`)
- **Slot order**: **free** — repeated single part type (`__opt`); order is the app’s data order

### `select`

- **BEM parts** (0): _none_
- **Modifiers** (0): _none_
- **States/hooks** (0): _none_
- **Tokens read** (5): `--juno-font-family-sans`, `--juno-label`, `--juno-space-12`, `--juno-space-32`, `--juno-space-4`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **n/a** — no BEM parts

### `skeleton`

- **BEM parts** (0): _none_
- **Modifiers** (4): `--block`, `--circle`, `--text`, `--tile`
- **States/hooks** (0): _none_
- **Tokens read** (9): `--juno-radius-2`, `--juno-radius-3`, `--juno-radius-4`, `--juno-s2`, `--juno-s3`, `--juno-skeleton-h`, `--juno-skeleton-ratio`, `--juno-space-16`, `--juno-space-56`
- **Local custom properties** (2): `--juno-skeleton-h`, `--juno-skeleton-ratio`
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **n/a** — no BEM parts

### `slider`

- **BEM parts** (2): `__channel`, `__lever`
- **Modifiers** (1): `--compact`
- **States/hooks** (4): `:hover`, `:focus-visible`, `:active`, `[aria-disabled]`
- **Tokens read** (16): `--juno-active`, `--juno-border-width-1`, `--juno-control-edge-strong`, `--juno-knob-edge`, `--juno-knob-face-hi`, `--juno-knob-face-lo`, `--juno-knob-grip`, `--juno-motion-duration-base`, `--juno-muted`, `--juno-opacity-disabled`, `--juno-radius-3`, `--juno-radius-4`, `--juno-role`, `--juno-s0`, `--juno-slider-pct`, `--juno-space-20`
- **Local custom properties** (1): `--juno-slider-pct`
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **fixed** — `__lever` is absolutely positioned after `__channel` with no z-index override, so DOM order is what makes the knob paint over the track

### `spark`

- **BEM parts** (0): _none_
- **Modifiers** (0): _none_
- **States/hooks** (0): _none_
- **Tokens read** (3): `--juno-active`, `--juno-role`, `--juno-space-24`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **n/a** — no BEM parts

### `splitter`

- **BEM parts** (0): _none_
- **Modifiers** (0): _none_
- **States/hooks** (7): `:hover`, `:focus-visible`, `:disabled`, `[aria-disabled]`, `[aria-orientation]`, `[aria-valuenow]`, `[data-juno-dragging]`
- **Tokens read** (11): `--juno-active`, `--juno-border`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-motion-duration-quick`, `--juno-motion-ease-standard`, `--juno-opacity-disabled`, `--juno-role`, `--juno-size-tap-min`, `--juno-splitter-hit`, `--juno-splitter-line`
- **Local custom properties** (2): `--juno-splitter-hit`, `--juno-splitter-line`
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **n/a** — no BEM parts

### `stepper`

- **BEM parts** (3): `__label`, `__marker`, `__step`
- **Modifiers** (1): `--vertical`
- **States/hooks** (0): _none_
- **Tokens read** (18): `--juno-active`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-control-edge-strong`, `--juno-control-surface`, `--juno-data`, `--juno-font-family-mono`, `--juno-font-family-sans`, `--juno-font-size-12`, `--juno-font-weight-bold`, `--juno-label`, `--juno-muted`, `--juno-role`, `--juno-space-12`, `--juno-space-16`, `--juno-space-28`, `--juno-space-8`, `--juno-stepper-marker`
- **Local custom properties** (1): `--juno-stepper-marker`
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **fixed** — flex/ordered-list, normal flow (marker before label per step)

### `swatch`

- **BEM parts** (2): `__check`, `__option`
- **Modifiers** (5): `--button`, `--circle`, `--lg`, `--none`, `--sm`
- **States/hooks** (3): `:focus-visible`, `[aria-checked]`, `[aria-selected]`
- **Tokens read** (15): `--juno-active`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-muted`, `--juno-palette-columns`, `--juno-radius-3`, `--juno-s1`, `--juno-size-tap-comfortable`, `--juno-size-tap-min`, `--juno-space-16`, `--juno-space-4`, `--juno-space-8`, `--juno-swatch-color`, `--juno-swatch-size`, `--juno-warning`
- **Local custom properties** (2): `--juno-swatch-color`, `--juno-swatch-size`
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **fixed** — `__check` nests inside each `__option`; simple normal-flow 2-part pattern

### `switch`

- **BEM parts** (2): `__input`, `__track`
- **Modifiers** (1): `--sm`
- **States/hooks** (3): `:focus-visible`, `:disabled`, `:checked`
- **Tokens read** (31): `--juno-active`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-control-edge-strong`, `--juno-control-surface`, `--juno-data`, `--juno-font-family-mono`, `--juno-font-family-sans`, `--juno-font-size-10`, `--juno-font-size-13`, `--juno-font-tracking-wide`, `--juno-font-weight-bold`, `--juno-gap-control`, `--juno-knob-edge`, `--juno-knob-face-hi`, `--juno-knob-face-lo`, `--juno-knob-grip`, `--juno-motion-duration-quick`, `--juno-motion-ease-standard`, `--juno-muted`, `--juno-nominal`, `--juno-opacity-disabled`, `--juno-radius-4`, `--juno-role`, `--juno-space-12`, `--juno-space-16`, `--juno-space-2`, `--juno-space-20`, `--juno-space-28`, `--juno-space-40`, `--juno-space-8`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: yes (`--juno-gap-control`)
- **Slot order**: **fixed** — CSS-enforced: `.juno-switch__input:checked + .juno-switch__track` requires `__input` to immediately precede `__track` in the DOM

### `table`

- **BEM parts** (26): `__action`, `__actions`, `__bulk`, `__bulk-count`, `__check`, `__clamp`, `__clamp-text`, `__edit-input`, `__editable`, `__empty`, `__empty-icon`, `__foot`, `__id`, `__mark`, `__meter`, `__meter-fill`, `__meter-track`, `__meter-val`, `__mono`, `__num`, `__skeleton`, `__time`, `__toolbar`, `__trend`, `__truncate`, `__wrap`
- **Modifiers** (4): `--compact`, `--stack`, `--sticky`, `--zebra`
- **States/hooks** (6): `:hover`, `:focus`, `[aria-selected]`, `[aria-sort]`, `[data-juno-mode]`, `[hidden]`
- **Tokens read** (41): `--juno-active`, `--juno-border`, `--juno-border-width-1`, `--juno-border-width-3`, `--juno-cell-max`, `--juno-control-edge`, `--juno-control-surface`, `--juno-data`, `--juno-font-family-mono`, `--juno-font-family-sans`, `--juno-font-size-10`, `--juno-font-size-12`, `--juno-font-size-13`, `--juno-font-size-18`, `--juno-font-tracking-caps`, `--juno-font-weight-bold`, `--juno-font-weight-medium`, `--juno-label`, `--juno-motion-duration-quick`, `--juno-motion-ease-standard`, `--juno-muted`, `--juno-nominal`, `--juno-radius-3`, `--juno-radius-5`, `--juno-radius-8`, `--juno-role`, `--juno-s1`, `--juno-s2`, `--juno-s3`, `--juno-space-10`, `--juno-space-12`, `--juno-space-16`, `--juno-space-2`, `--juno-space-24`, `--juno-space-32`, `--juno-space-4`, `--juno-space-40`, `--juno-space-56`, `--juno-space-8`, `--juno-table-fill`, `--juno-z-raised`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: both
- **Density-aware**: no
- **Slot order**: **ambiguous** — `__toolbar`/table/`__foot` wrapper order is fixed, but the ~20 cell-content-type modifiers (`__num`, `__mono`, `__trend`, etc.) are column classes whose sequence is entirely app/data-driven, not fixed by junoui

### `tabs`

- **BEM parts** (3): `__list`, `__panel`, `__tab`
- **Modifiers** (0): _none_
- **States/hooks** (4): `:hover`, `:disabled`, `[aria-selected]`, `[hidden]`
- **Tokens read** (17): `--juno-active`, `--juno-border`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-data`, `--juno-font-family-sans`, `--juno-font-size-13`, `--juno-font-tracking-label`, `--juno-font-weight-medium`, `--juno-label`, `--juno-motion-duration-quick`, `--juno-motion-ease-standard`, `--juno-opacity-disabled`, `--juno-space-10`, `--juno-space-16`, `--juno-space-2`, `--juno-space-20`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **fixed** — flex column, normal flow (`__list` before `__panel`(s)), matches ARIA + usage

### `thumb`

- **BEM parts** (2): `__corner`, `__label`
- **Modifiers** (7): `--bottom-end`, `--bottom-start`, `--flush`, `--selected`, `--top-end`, `--top-start`, `--video`
- **States/hooks** (0): _none_
- **Tokens read** (15): `--juno-active`, `--juno-border`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-font-family-sans`, `--juno-font-size-10`, `--juno-font-tracking-caps`, `--juno-font-weight-bold`, `--juno-muted`, `--juno-radius-3`, `--juno-s2`, `--juno-space-32`, `--juno-space-4`, `--juno-thumb-glyph`, `--juno-thumb-ratio`
- **Local custom properties** (1): `--juno-thumb-glyph`
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **free** — each `__corner--*` variant self-positions via its own modifier class at explicit `z-index: 1`; `__label` is a separate absolute overlay — no part depends on another’s DOM position

### `toast`

- **BEM parts** (3): `__close`, `__icon`, `__text`
- **Modifiers** (3): `--leaving`, `--start`, `--top`
- **States/hooks** (1): `:hover`
- **Tokens read** (22): `--juno-active`, `--juno-border`, `--juno-border-width-1`, `--juno-border-width-3`, `--juno-data`, `--juno-font-lineHeight-none`, `--juno-font-size-13`, `--juno-font-size-16`, `--juno-motion-duration-quick`, `--juno-motion-ease-decel`, `--juno-muted`, `--juno-radius-5`, `--juno-role`, `--juno-s2`, `--juno-safe-bottom`, `--juno-shadow-2`, `--juno-space-12`, `--juno-space-16`, `--juno-space-24`, `--juno-space-32`, `--juno-toast-edge-offset`, `--juno-z-alert`
- **Local custom properties** (1): `--juno-toast-edge-offset`
- **Responsive mechanism**: viewport media query
- **Density-aware**: no
- **Slot order**: **fixed** — flex row, normal flow (icon, text, close), matches usage

### `toggle-button`

- **BEM parts** (6): `__desc`, `__legend`, `__row`, `__status`, `__strip`, `__text`
- **Modifiers** (0): _none_
- **States/hooks** (2): `:disabled`, `[aria-pressed]`
- **Tokens read** (25): `--juno-border-width-1`, `--juno-control-edge-strong`, `--juno-control-surface`, `--juno-data`, `--juno-font-family-mono`, `--juno-font-size-10`, `--juno-font-size-11`, `--juno-font-size-13`, `--juno-font-tracking-caps`, `--juno-font-tracking-tight`, `--juno-font-weight-bold`, `--juno-label`, `--juno-motion-duration-quick`, `--juno-motion-ease-standard`, `--juno-muted`, `--juno-nominal`, `--juno-opacity-disabled`, `--juno-pad-control-block`, `--juno-radius-4`, `--juno-role`, `--juno-s3`, `--juno-space-12`, `--juno-space-16`, `--juno-space-2`, `--juno-space-4`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: yes (`--juno-pad-control-block`)
- **Slot order**: **fixed** — flex, normal flow (strip -> row(text(legend, desc), status)), matches usage

### `tooltip`

- **BEM parts** (2): `__arrow`, `__bubble`
- **Modifiers** (3): `--bottom`, `--left`, `--right`
- **States/hooks** (2): `:hover`, `:focus`
- **Tokens read** (14): `--juno-border`, `--juno-border-width-1`, `--juno-data`, `--juno-font-family-mono`, `--juno-font-size-11`, `--juno-motion-duration-quick`, `--juno-motion-ease-decel`, `--juno-radius-4`, `--juno-s3`, `--juno-shadow-2`, `--juno-space-10`, `--juno-space-4`, `--juno-space-8`, `--juno-z-anchored`
- **Local custom properties** (0): _none_
- **Responsive mechanism**: neither
- **Density-aware**: no
- **Slot order**: **free** — `__bubble` and its nested `__arrow` are both absolutely positioned relative to the trigger; the arrow’s position is set by CSS regardless of where it sits in the bubble’s DOM

### `tree`

- **BEM parts** (9): `__caret`, `__count`, `__group`, `__handle`, `__icon`, `__item`, `__label`, `__row`, `__trail`
- **Modifiers** (0): _none_
- **States/hooks** (8): `:hover`, `:focus-visible`, `:active`, `[aria-current]`, `[aria-expanded]`, `[aria-selected]`, `[data-juno-dragging]`, `[data-juno-drop]`
- **Tokens read** (23): `--juno-active`, `--juno-border-width-1`, `--juno-border-width-2`, `--juno-data`, `--juno-font-family-sans`, `--juno-font-size-11`, `--juno-font-size-13`, `--juno-label`, `--juno-motion-duration-quick`, `--juno-motion-ease-standard`, `--juno-muted`, `--juno-opacity-muted`, `--juno-radius-3`, `--juno-role`, `--juno-s2`, `--juno-s3`, `--juno-size-tap-comfortable`, `--juno-size-tap-min`, `--juno-space-10`, `--juno-space-16`, `--juno-space-4`, `--juno-space-8`, `--juno-tree-indent`
- **Local custom properties** (1): `--juno-tree-indent`
- **Responsive mechanism**: viewport media query
- **Density-aware**: no
- **Slot order**: **fixed** — flex row, normal flow (caret, icon, label, ..., count+trail enforced via `+` sibling combinator); `__group` nests after `__row`

## Disagreements between this census and `docs/components/*.md`

Not systematically diffed part-by-part against every doc page (that is a larger job than
this ticket scopes), but the five hand-read files above matched their doc pages in the parts
and states that mattered for the spot check. No disagreement was found in those five. A full
cross-check of the remaining 47 against `docs/components/*.md` is unestablished by this
ticket and would need its own pass.
