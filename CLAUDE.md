# CLAUDE.md

Guidance for working in this repo. Read before editing.

## What this is

`junoui` — a **design system / UI foundation**. Tokens (color, spacing, type, radius,
breakpoints…) authored once → compiled to every platform. Plus a framework-agnostic
CSS component + layout layer. It dresses skeletons built elsewhere; it is **not** an
app and ships no business logic.

Brand name in docs/showcase: junoui (was "AERO·UI" — fully renamed; `aero` survives
only inside `design/`, the original imported canvas, which is reference-only).

## Hard rules (keep the repo clean)

1. **`dist/` is generated.** Never edit or commit it (gitignored). Change `tokens/`
   (token values) or `src/css/` (styles), then rebuild.
2. **Tokens are the contract.** Edit values only in `tokens/**` (DTCG `$value`/`$type`).
   Changing/removing a token = breaking (semver major). Adding = minor.
3. **Namespace everything `juno`**: `--juno-*`, `.juno-*`, `JunoTokens`, `data-juno-*`.
   Never introduce `aero`.
4. **Presentational only.** No stateful widgets (chat/calendar logic, focus traps,
   data). Those go to apps or a sibling `junoui-<framework>` package. A component must
   render with zero JS; only tiny optional stateless enhancers allowed.
5. **Color = status via `--juno-role`.** A component reads `var(--juno-role)`; a
   `.juno--<role>` class sets it. Don't hardcode role colors per component.
6. **RTL: use logical properties** (`margin-inline`, `inset`, `min-inline-size`).
7. **Responsive: container queries > viewport media queries** (components live in
   unknown layouts). Layout primitives in `src/css/layout.css` reflow by space.

## Workflow after any change

```sh
npm run build      # tokens (Style Dictionary) → dist, then CSS bundle
npm run gen-docs   # ONLY if tokens changed — refreshes docs/tokens-reference.md
npm run lint       # stylelint (src/css) + prettier --check (js/md/json)
npm test           # build + node:test integrity suite
```

CI runs `lint` + `test` + `npm pack --dry-run`. All must pass.

## Gotchas (learned the hard way)

- **CSS `@import` must be the first rule.** `src/css/base.css` imports the fonts;
  `scripts/bundle-css.mjs` hoists all `@import` to the top of `dist/css/juno.css`.
  Don't rely on a mid-file `@import` working — browsers drop it.
- **A CSS `mask` clips children.** The arc loader's `%` label must be a _sibling_ over
  a positioned wrapper, not inside `.juno-arc`.
- **New component-local custom props** (e.g. `--juno-grid-min`) must be added to the
  `local` allowlist in `test/build.test.mjs`, or the "every var resolves" test fails.
- **New token group** → add a friendly title to `TITLES` in `scripts/gen-docs.mjs`,
  then `npm run gen-docs` (CI fails if the reference is stale).
- **prettier ignores `.css`/`.html`** (preserve compact CSS); stylelint owns CSS.
- **oklch stays for web; native/Flutter auto-convert to hex** via `scripts/color.mjs`.
  Don't hand-write native hex.

## Layout

```
tokens/        DTCG source of truth (core/ + color/)
src/css/       base.css · utilities.css · layout.css · density.css · components/*.css
scripts/       color.mjs · bundle-css.mjs · gen-docs.mjs
style-dictionary.config.mjs   token build (custom per-platform formats)
test/          node:test suite (no deps)
docs/          guides + generated tokens-reference.md
showcase/      interactive demo (repo-only, NOT published)
design/        original Claude Design canvas sources (reference)
dist/          generated outputs (gitignored)
```

## Adding things

- **Component:** new `src/css/components/<name>.css` (auto-bundled) → use tokens +
  `--juno-role` → BEM names → `docs/components/<name>.md` + catalogue row + showcase
  entry → add any local custom props to the test allowlist.
- **Token:** edit `tokens/**` → `npm run build` → `npm run gen-docs` → `npm test`.

See `CONTRIBUTING.md` (humans) and `docs/accessibility.md` (ARIA contract per component).

## Commits

Short messages, conventional-ish, **no Claude/AI co-author trailer**. Commit often in
focused chunks. Work on `main` (solo repo). Push only when asked.

## Roadmap (next, not yet built)

Full gap analysis + priorities: **[docs/roadmap.md](./docs/roadmap.md)**. Done:
foundation tokens (motion/z-index/elevation/opacity), density modes, form controls +
field, overlays (modal/drawer/tooltip/popover/menu), table/data-grid (sortable header,
cell types, row states, overflow, skeleton/empty), alert + toast (role-tinted, alert
layer), tabs + accordion (native <details>), visual-regression snapshots + changesets,
field-driven set (btn/switch --sm, segmented, gauge, spark, badge--micro, rail +
app-shell recipe, content-density tiles, media icons), mobile set (dock bottom nav,
modal→bottom sheet, drawer/toast phone fit, scrollable tabs, table--stack,
coarse-pointer tap targets), mobile nav kit (pillbar floating tab bar, navbar
stack top bar w/ back, grouped list, tab+stack recipe). junoui ships the look +
a11y spec; stateful behavior stays out.
