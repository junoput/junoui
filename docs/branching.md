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

## `develop` is a trap, and it is STILL THERE

This section used to be headed _"`develop` was deleted, and this is why"_. It was
not deleted — see the correction at the end of this section. The reasoning below
stands; only the past tense was wrong.

It exists, and it is a trap:

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

### Correction, 2026-09-08: it was NOT deleted, and the heading was wrong

The section above is written in the past tense as a completed fact. It is not
one. Measured on 2026-09-08:

```
$ git ls-remote origin refs/heads/develop
214095be...  refs/heads/develop          <- still there
commits of its own:   0
behind main:          123                <- the table above says 68
```

So the branch survives, still holds nothing, and has drifted from 68 commits
behind to **123** — the trap growing exactly as this document predicted, while
this document said it was gone.

**That false claim is worse than the branch.** A reader who trusts the heading
concludes `develop` cannot be targeted, and then meets it in a branch picker.
The whole point of this page is that _a branch which looks like a valid target
and silently is not will catch someone_; asserting a deletion that did not
happen manufactures precisely that.

**The likely cause is documented one section down.**
`gh pr merge --delete-branch` fails the _local_ delete whenever a worktree holds
the branch and **reports only that failure**, leaving the remote branch alive and
unmentioned. That has happened twice on this repo in one day. A deletion recorded
from the command's output rather than from `git ls-remote` is a deletion that may
never have occurred — which is what this heading appears to be.

Nothing in junoui depends on it: the only `develop` mentions in the tree are a
comment in `ci.yml` and nexora's branches in `consumer-gate.mjs`, noted above.
So removing it is safe whenever someone chooses to; it is left standing here
rather than quietly deleted because it is shared repository state and not part of
any ticket. **Verify with `git ls-remote`, not with the heading.**

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

## `gh pr merge --delete-branch` does not delete the remote branch here

**Confirmed twice in one session, on PRs 41 and 44.** In this repo a lane
worktree almost always has the topic branch checked out, and that makes the
command fail in a way that reads like success:

```
$ gh pr merge 44 --merge --delete-branch
failed to delete local branch docs/principles-structure: failed to run git:
  error: Cannot delete branch 'docs/principles-structure' checked out at
  '/work/junoui.lanes/juno-w1a'
```

The PR **merges**. The **local** delete fails, and that is the only failure
reported. The **remote** branch survives, unmentioned — so the output looks like
a merge plus a tidy-up hiccup, when it is a merge plus a branch still on origin.

That is how stale merged branches accumulate, and a stale branch that looks live
is what lets someone later build on, or re-open a PR from, a dead one.

**So after every merge, confirm on the remote rather than trusting the command:**

```sh
git ls-remote origin <branch>          # expect EMPTY
git push origin --delete <branch>      # if it is not
```

**It depends on who opened the PR, and the first draft of this section got that
wrong.** The local delete fails only when _some other worktree_ has the branch
checked out:

| PR from         | Branch held by                       | `--delete-branch`                  |
| --------------- | ------------------------------------ | ---------------------------------- |
| a worker's lane | that lane, still                     | **fails locally, remote survives** |
| this checkout   | nobody after `gh` switches to `main` | works, both deleted                |

So it fails on **worker** PRs — which is most of them, since every worker runs
in a lane — and succeeds on one opened from `/work/junoui` directly. PRs 41 and
44 were the former and failed; PR 45, which added this very section, was the
latter and deleted cleanly. That is the counter-example, and it is recorded
because the first version of this paragraph claimed the failure was universal on
the strength of two observations that happened to share a cause.

Checking costs one command either way, so check regardless of who opened it.

The general shape is a command that partially succeeded and reported the half
that failed in a place nobody re-reads, while the summary line said done.
