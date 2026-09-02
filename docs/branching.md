# Branching

**junoui has exactly one long-lived branch: `main`.** Everything else is a
short-lived topic branch that opens a PR against `main` and is deleted when it
lands.

That is not a preference, it is what the repo already does — and saying so is the
point of this document, because a branch that _looks_ like a valid target and
silently is not will catch someone.

## Why one branch

- **Releases happen on `main`.** `ci.yml`'s `release` job runs on
  `push` to `main`: changesets either opens/updates the "Version Packages" PR or,
  once that merges, publishes to npm. There is nowhere else a release can come
  from.
- **CI only runs for `main`.** `push` and `pull_request` are both filtered to
  `branches: [main]`. A PR opened against any other branch gets **no checks at
  all** — an empty list, not a red one, which looks identical to green at a
  glance.
- **An integration branch has no job to do here.** junoui is one package with one
  release train. The staging that a `develop` would provide is already provided
  by the PR itself: `gate:consumer` packs the release candidate and runs the
  consumer's suite against it before anything lands.

## `develop` was deleted, and this is why

It existed, and it was a trap:

|                                            |                                                      |
| ------------------------------------------ | ---------------------------------------------------- |
| commits of its own                         | **0**, ever                                          |
| behind `main`                              | 16 when the trap was filed, **68** a few hours later |
| PRs ever targeting it                      | **0** — all 33 merged PRs targeted `main`            |
| scripts, workflows or docs depending on it | none                                                 |
| effect of opening a PR against it          | **the PR gets no CI, and lands nowhere**             |

It was hit for real on 2026-09-01: PR 28 was opened against `develop`, showed an
empty check list, and the failure was only found because the workflow was
dispatched by hand. The branch contributed nothing and cost a round trip plus a
near-miss on merging unverified code.

> The `develop` and `ios/develop` branches named in `scripts/consumer-gate.mjs`
> are **nexora's**, not junoui's. That repo is a multi-lane application and its
> integration branches are real. Do not read those references as junoui having
> one.

## If you find yourself on another long-lived branch

Retarget the PR at `main` and **confirm a check run exists on the head SHA** —
not merely that nothing is red. `gh pr checks <n>` saying
`no checks reported` is the failure mode, and it reads like success.

Retargeting an existing PR does not appear to arm the trigger on its own; push a
commit, or dispatch `ci` by hand, and verify.

## The residual, stated rather than implied

Deleting `develop` closes the instance. It does not close the class: **any**
branch used as a PR base other than `main` still gets zero checks, because the
`pull_request` trigger is filtered. Removing that filter would make CI run on a
PR to any base, so a mis-targeted PR would still be honestly red or green.

That is a `.github` change and is the operator's call; it is filed rather than
assumed. Until it lands, this document and `test/branching.test.mjs` are what
keep the branch model and the CI triggers from disagreeing silently.
