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
Removing or renaming a token is a **breaking change**; a token _value_ change depends
on whether it visibly shifts consumer UI — see the [versioning policy](#versioning-policy).

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

   Choose the bump with the [policy below](#versioning-policy). Commit the generated
   `.changeset/*.md` with your PR.

2. On merge to `main`, the `release` job runs [`changesets/action`](https://github.com/changesets/action):
   while changesets are pending it opens (and keeps updating) a **"Version Packages"**
   PR that consumes them and bumps `package.json` + `CHANGELOG.md` — no manual
   `npm run version` needed. (Requires the repo setting _Allow GitHub Actions to create
   and approve pull requests_, and an `NPM_TOKEN` secret with publish rights.)

3. **Before merging that PR, run the consumer gate on the candidate:**

   ```sh
   npm run gate:consumer
   ```

   It packs the candidate and builds a real consumer against the tarball. **Red blocks
   the release** — it is not a note on it. See
   [the release gate](./RELEASING.md) for what it asserts, why it packs rather
   than links, and why it is a local step rather than a CI job. Record the junoui and
   consumer SHAs it prints on the release ticket.

4. Merge that PR. With no changesets left, the next `release` run publishes to npm
   (`npm run release` → build + `changeset publish`, with npm provenance via OIDC).

Manual fallback (no CI): `npm run version` then `npm run release`.

## Versioning policy

junoui follows [semver](https://semver.org). The **public API is the contract**:
the tokens (`--juno-*`), the CSS classes (`.juno-*`), the JS/TS exports, and the
package export paths. The test: **would a consumer who upgrades _without touching
their own code_ break?** Break → major. Safe addition → minor. Invisible fix → patch.

| Bump      | Use when the change…                                                                                                                                                                                                                                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **major** | Breaks an existing consumer: **remove/rename** a token, class, JS export, or export path · change what an existing class/token _does_ (move a state, require new markup/child, change a default) · tighten required markup/ARIA structure · drop a platform output · a semantic **token value change that visibly shifts** consumer UI. |
| **minor** | Adds surface, safe to upgrade into: new component, token, modifier/variant class, icon, or export path · a new _optional_ custom prop with a fallback (old markup unaffected) · a new platform output.                                                                                                                                  |
| **patch** | No contract change: bug fix that keeps the same surface (a broken `calc()`, an a11y fix with no markup change) · docs · build tooling · internal refactor.                                                                                                                                                                              |

**Token value edits — the grey zone.** Rename/remove is unambiguously major. A pure
value tweak is a judgment call: a bug-fix nudge (a contrast miss, 1px off) is a
_patch_; a deliberate restyle that moves consumer pixels is _breaking_. When unsure,
**up-rank** — a surprise visual shift is worse than a higher version number.

**Pre-1.0 (we are `0.x`).** Under semver, a `0.x` minor is _allowed_ to break, so
while pre-1.0 we log breaking changes as **minor** (`0.1.0` → `0.2.0`) and additive
ones as **patch**, and reserve a real **major** for the intentional `1.0.0` "the API
is stable now" release. ⚠️ Changesets bumps a `major` changeset **straight to
`1.0.0`** — do not file one until you actually mean to stabilize.
