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
committed baselines in `test/visual/__screenshots__/`. Run separate from `npm test` (needs
the Playwright browser: `npx playwright install chromium`).

**Two projects, and they must stay two.** `chromium` is a fine pointer with no touch;
`chromium-coarse` sets `hasTouch` + `isMobile`, which is what makes `(pointer: coarse)`
and `(hover: none)` match. Resizing a desktop context to a phone viewport changes the
width and nothing else, so before the second project the entire touch layer — the 44px tap
promotion, the 16px input font floor, the hover fallbacks — was never exercised (and one of
the three turned out to be broken). Each project owns its own spec file, because the
snapshot path keys on the name, not the project; `tap-targets.spec.mjs` runs under both and
asserts the promotion as **numbers**, not pixels.

**The pixel budget is zero.** Not a style preference: a 1% ratio budget on a full-page shot
was a ~29,700-px licence to change anything, and measurably hid a whole-component restyle
(6,291 px) and a system-wide button-radius change (worst case 66 px). With the record env
equal to the check env the honest diff is 0. If a case ever needs slack, give it to that
case, not to the global.

**Record Linux baselines on CI, never locally.** A Linux dev box is not a valid check env —
different freetype, hundreds of pixels of text-rendering drift, and at a zero budget that is
loud. After an **intentional** visual change:
`gh workflow run visual-baselines.yml --ref <branch>`, then download the `linux-baselines`
artifact and commit the PNGs. macOS baselines (`-darwin`) are recorded locally with
`npm run test:visual:update` — but see below before doing so. To iterate locally, record a
throwaway local set first and diff against that.

**`-darwin` baselines are not gated by CI and should be assumed stale.** `ci.yml`'s
`visual` job runs `ubuntu-24.04` only — nothing regenerates or checks the `-darwin`
set on any PR, so recording them is a step a contributor has to remember and do by
hand, and most changes since 2026-07-13 did not (20260909-038). As of that ticket:
64 Linux baselines exist, 32 `-darwin` ones do, and every snapshot added after that
date (every overlay dialog, every coarse-pointer variant, every section-level shot)
has **no** `-darwin` file at all — not stale, absent. If you run
`npm run test:visual` on macOS, expect a wall of failures unrelated to your change;
that is the known state, not a sign your change broke something. Do not spend time
regenerating `-darwin` baselines as part of an unrelated PR — that would let one
change's diff quietly include another's drift. Whether `-darwin` should be actively
maintained (needs a macOS runner or a named local step) or removed is an open
operator decision tracked on that ticket.

## Project layout

**`*` marks what the npm tarball publishes.** `package.json`'s `files` is the
authority; this column is a reminder, not a second copy of it.

```
  tokens/        DTCG source of truth (color + core). Edit values HERE.
* src/css/       authored CSS (base, utilities, layout, components/*)
* src/icons/     icon sprite sources (built into dist/icons/juno-icons.svg)
* src/fonts/     the four self-hosted B612 woff2 faces + LICENSE
* tools/         the optional stateless enhancers, and rules.mjs — a real
                 JavaScript surface with its own exports entries. Anything here
                 may only import from tools/ or dist/, because scripts/ does
                 NOT ship and a re-export across that line throws for every
                 consumer while resolving fine in this repo.
  scripts/       build helpers, NOT published (style dictionary config is in
                 the repo root)
  test/          node:test suite — no dependencies, run with `npm test`
* dist/          generated — never edit, never commit (gitignored in the repo,
                 published in the tarball)
* docs/          guides + generated tokens-reference.md
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
3. **Internal padding comes from the density archetypes, not raw `--juno-space-*`**:
   `--juno-pad-control-block`/`-inline` for interactive controls,
   `--juno-pad-surface-block`/`-inline` for surfaces (anything with its own
   background and padding), `--juno-gap-control` / `--juno-gap-content` for gaps.
   A component that spends raw `--juno-space-*` on its own padding does not
   respond to `data-juno-density` at all — it stays comfortable while the rest of
   the UI compacts. Inline chips (`badge`, `tooltip`) legitimately take neither;
   say so in the component doc rather than leaving it implied. Apply an archetype
   to **both axes or neither**: compact removes more block padding than inline, so
   a half-migration inverts that contract.
4. Use **logical properties** (`margin-inline`, `inset`, …) for RTL.
5. Use BEM-ish names: `.juno-<block>`, `__element`, `--modifier`.
6. Document it: `docs/components/<name>.md` (anatomy + states + ARIA contract) and add
   a row to `docs/components/README.md`.
7. Add it to `showcase/index.html`.
8. Add a row to `docs/inventory-elements.md`. `test/census-matches-css.test.mjs`
   checks the `Responsive mechanism` and `Density-aware` columns against your
   stylesheet, so a wrong answer there fails `npm test`.
9. `npm run lint` and `npm test`.

## Conventions

- Namespace everything `juno` / `--juno-` / `JunoTokens`.
- Keep components stateless. No JS required for a component to render; tiny optional
  vanilla enhancers only, never stateful.
- Pair color with a non-color signal (see [accessibility.md](./docs/accessibility.md)).
- **When you report a measurement, state what you HELD CONSTANT, not only what you
  varied.** A varied factor is part of the design and gets written down; a held one
  lives in the environment, so it is invisible to the person who chose it. One line
  beside the numbers — `held constant: X, Y, Z` — is the whole convention.

  It is in here because it cost a week (`20260918-002`). A crash was reported on a
  page with an `<input type="date">`; a 2×2 crossing navigation method against
  browser binary could not reproduce it, and the arms disagreed because
  `FONTCONFIG_FILE` was exported in one environment and not the other. It was never
  a candidate for being reasoned about — it came from a 54-day-old setup note and
  was in every command. The published 2×2 could not have been re-run by the person
  who disagreed, because the half that mattered was not in the specification.

  So the second reason is reproducibility rather than rigour: **a null is only
  re-runnable by someone other than its author if the held half is written down.**

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

   **The Version PR itself will show no checks — that is expected, not a fault.**
   It is opened by the Actions bot, so its workflow runs sit at `action_required`
   until someone approves them, and `gh pr checks` reports
   _"no checks reported"_ with a merge state of `UNSTABLE`. The consumer gate
   above is the substantive check: it exercises the packed candidate inside a
   real consumer, which is a stronger question than junoui's own CI answers.

   If you want that PR's `build` + `visual` anyway, run them yourself:

   ```sh
   gh workflow run ci.yml --ref changeset-release/main
   ```

   **This cannot publish.** The `release` job is gated on a push to `main`
   (`github.event_name == 'push'`), so a `workflow_dispatch` runs build and
   visual and skips release.

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

<!-- devbox-conventions CONTRIBUTING.md v5 BEGIN — generated; edit outside the markers -->
## Before you write anything, the work has a ticket

`tick` is the shared board across every project on this box. Claim before you
work — `tick list --status in_progress` to see what is taken, then
`tick start <id>` — because two agents on one ticket is the cost this exists to
avoid. Notice a defect outside your current task? `tick new bug "<title>"` and
move on; park it rather than chasing it.

Close with the REASONING, not with "done". The close is the report: it is what
the next person reads when they hit the same thing, and it is the only record of
what you decided not to do.

**A ticket is a hypothesis, not a specification.** An implementer who measures
before building is doing the job, not resisting it. More than one ticket here
has asked for a test that could not fail; the right response was to say so on
the ticket.

## What a change has to come with

### Assertions that could have failed

A test that cannot fail differently is not a test. Before believing a green,
flip something you know should change the answer and confirm it does — and do it
with the mutant asserted PRESENT before the run, because a patch that silently
fails to apply produces a green identical to a healthy control arm.

Beware the assertion that runs, on real data, and means less than it says:
`is_some()`, `is_ok()`, `!= null`, `len() > 0`, `contains(x)` on a set nobody
bounded. Each asserts the machinery produced SOMETHING. Whether it produced the
RIGHT something is the question, and making the wrong something is the cheap way
to find out.

### A vacuity floor wherever something is counted

A walker that silently finds nothing passes forever. Require a floor — at least
N suites parsed, at least N files matched — and report VACUOUS rather than a
verdict when the floor is not met. A selector that matches PARTIALLY is worse
than one that matches nothing: the empty set announces itself, a partial set
wears the shape of a pass.

### The quiet side of every switch and threshold

Asserting a warning fires proves the code can print. Only asserting it stays
SILENT when it should proves the condition is read at all. An unconditional
warning and a working detector are indistinguishable from the loud side alone.

## Reporting a result

**Name the tree and the commit.** A confident, correct result from the wrong
copy of the repository is indistinguishable from a right one.

**State the window, or do not report the null.** `--since`, `head`, `tail`, a
result cap, a page size, a retention policy, an index that only covers one
branch: each converts "absent" into "absent within a boundary you did not
mention". Say the boundary in the same sentence as the finding.

**Report a pass only when the instrument says it FINISHED.** Grep for the
terminal verdict line, not for the absence of a failure — a killed run and a
passing one look the same if you read for failures.

**Quote the line, not the exit code.** Two rules can share a status and mean
entirely different things. And `$?` after a pipeline is the LAST command's
status, so `| tail` tells you about `tail`.

## Reviewing

Read the diff, not the commit message. Read the gate output, not the merge
request's gate section. A commit can announce work its own diff does not
contain, and git says nothing when a staged path has nothing to add.

For any change to a shared predicate or helper, enumerate its consumers BEFORE
reading the diff. Reviewing the logic is not reviewing the blast radius.

When fixing a class of defect, say which instances you did NOT change, and why.
The exceptions are where the next one hides, and enumerating the untouched set
is what turns a sweep into an audit.

## Gaps

A stated gap is an assignment, not a footnote. "I could not demonstrate X"
becomes a ticket with an owner — and nobody manufactures the demonstration to
close it. Leaving a gap stated is worth more than filling it with something
built to fit.

A carve-out written inside a blocked ticket inherits that ticket's status in
everyone's head, including its author's. File it as its own ticket at the moment
you write it down.
<!-- devbox-conventions END -->
