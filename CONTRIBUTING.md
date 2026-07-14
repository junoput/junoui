# Contributing to junoui

junoui is a design system: **tokens are the public contract**, components are
framework-agnostic CSS. Keep it presentational — stateful widgets belong in apps or a
sibling `junoui-<framework>` package.

## Setup

```sh
npm install        # installs deps and builds dist/ (prepare)
npm run build      # tokens (Style Dictionary) + CSS bundle
npm test           # build + node:test suite
npm run lint       # stylelint + prettier --check
npm run test:visual # Playwright screenshot diff of every showcase page
```

### Visual regression

`npm run test:visual` snapshots every showcase page (dark + light) and diffs against the
committed baselines in `test/visual/__screenshots__/`. After an **intentional** visual
change, re-record with `npm run test:visual:update` and commit the new PNGs. Baselines are
OS-scoped (filename ends `-<platform>`), since font rendering differs per platform —
generate them on the same OS you compare on. Run separate from `npm test` (needs the
Playwright browser: `npx playwright install chromium`).

## Project layout

```
tokens/        DTCG source of truth (color + core). Edit values HERE.
src/css/       authored CSS (base, utilities, layout, components/*)
scripts/       build helpers (style dictionary config is in repo root)
dist/          generated — never edit, never commit (gitignored)
docs/          guides + generated tokens-reference.md
showcase/      demo (repo-only, not published)
```

## Adding or changing a token

1. Edit the relevant file in `tokens/` (DTCG: `$value` / `$type` / `$description`).
2. `npm run build` — every platform output regenerates.
3. `npm run gen-docs` — refreshes `docs/tokens-reference.md` (CI fails if stale).
4. `npm test`.

Colors: web keeps `oklch()`; native/Flutter get build-time sRGB hex automatically.
Changing a token value or removing a token is a **breaking change** (semver major).

## Adding a component

1. Create `src/css/components/<name>.css`. It's auto-included by the bundler.
2. Reference tokens via `var(--juno-*)`. Color a component through the shared
   `--juno-role` property so one `.juno--<role>` class recolors it.
3. Use **logical properties** (`margin-inline`, `inset`, …) for RTL.
4. Use BEM-ish names: `.juno-<block>`, `__element`, `--modifier`.
5. Document it: `docs/components/<name>.md` (anatomy + states + ARIA contract) and add
   a row to `docs/components/README.md`.
6. Add it to `showcase/index.html`.
7. `npm run lint` and `npm test`.

## Conventions

- Namespace everything `juno` / `--juno-` / `JunoTokens`.
- Keep components stateless. No JS required for a component to render; tiny optional
  vanilla enhancers only, never stateful.
- Pair color with a non-color signal (see [accessibility.md](./docs/accessibility.md)).

## Releasing

Versioning + changelog are automated with [Changesets](https://github.com/changesets/changesets).

1. With your change, add a changeset describing it:

   ```sh
   npm run changeset      # pick a bump, write a one-line summary
   ```

   Choose the bump by the **token contract**: removing/renaming a token or class →
   _major_; additive tokens/components → _minor_; fixes → _patch_. (Pre-1.0, a "major"
   bump lands as the next `0.x`.) Commit the generated `.changeset/*.md` with your PR.

2. On merge to `main`, the `release` job runs [`changesets/action`](https://github.com/changesets/action):
   while changesets are pending it opens (and keeps updating) a **"Version Packages"**
   PR that consumes them and bumps `package.json` + `CHANGELOG.md` — no manual
   `npm run version` needed. (Requires the repo setting _Allow GitHub Actions to create
   and approve pull requests_, and an `NPM_TOKEN` secret with publish rights.)

3. Merge that PR. With no changesets left, the next `release` run publishes to npm
   (`npm run release` → build + `changeset publish`, with npm provenance via OIDC).

Manual fallback (no CI): `npm run version` then `npm run release`.
