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

## The class is closed: a PR to any base gets checks

`ci.yml`'s `pull_request` trigger is **unfiltered**, so opening a PR against any
base runs the suite. A mis-targeted PR is honestly red or green instead of
showing an empty check list — which is the failure that made this worth fixing,
because an empty list and a green one look the same at a glance (`20260902-040`).

`push` stays filtered to `main`, which is what stops the double-run a filter
like that is usually for: a topic-branch push fires nothing, the PR covers it,
and only the merge fires `push`. No SHA is built twice, and the release job is
still gated on `push` to `refs/heads/main` so it cannot fire from a PR.

**What is still true:** a branch with **no PR open** gets no CI until one exists.
That is by design — `workflow_dispatch` covers the case where you want a run
before opening a PR — but it is the reason the visual baselines once drifted for
months without anyone seeing a red job (`20260815-011`).

`test/branching.test.mjs` keeps this document and the CI triggers from
disagreeing silently, in both directions: it fails if a workflow names a branch
this document does not, and it fails if this section claims the class is open
while the filter is gone.
