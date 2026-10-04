<!-- devbox-conventions docs__GIT_WORKFLOW.md v4 BEGIN — generated; edit outside the markers -->
## How a change lands

A change is landed by merging a topic branch into the integration branch
declared in `.devbox-git-profile`. The merge is `--no-ff`, always, so the branch
survives as a readable unit: a squash makes the landed/on-origin test below
unable to see what it merged, and a project that squashes reads every
integration as something else.

    git fetch origin
    git merge --no-ff --no-commit <branch>
    <resolve, if anything conflicts>
    git commit -F -            # the reasoning, not the file list
    git push

### Gate the MERGED RESULT, not the branch

A branch green on its own and red once merged is the ordinary case, and it is
invisible to any check run before the merge. So `gate` runs on the merge result,
with the working tree clean, and its verdict NAMES the worktree path and the
commit SHA it came from. A project here can have several copies of everything —
a lane, a shared checkout, a deployment surface — and a correct result from the
wrong tree is indistinguishable from a right one.

A receipt that says the tree was DIRTY does not vouch for a commit. Do not file
a merge request whose prose says green while the receipt embedded below it says
otherwise: `tick mr` embeds the receipt faithfully and nothing compares the two
for you.

### Fetch immediately before merging, not before reviewing

On an active branch those are minutes apart, and a stale tip merges cleanly.

## How a change is verified as landed

`tick close`'s guard compares against the LOCAL integration ref, which passes
for a merge that never reached the remote. Before closing, ask the remote:

    git ls-remote origin <integration>
    git merge-base --is-ancestor origin/<branch> origin/<integration>

The second names the BRANCH TIP, not the SHA you merged. `--is-ancestor
<merged-sha>` answers *did what I merged reach origin* and says nothing about
commits the branch carried that the merge did not take. Those two questions look
identical to whoever did the merging, which is exactly when nobody asks the
second one.

## Conflicts

Resolve from each side's COMPLETE file (`git show <ref>:<path>`), not from the
interleaved conflict view: a conflict hunk shows the disagreement and hides the
surrounding agreement, and the surrounding agreement is where a whole-file
revert hides. Before resolving, enumerate by name what each side contributes,
and find those names in the resolved file before gating. Taking either side
wholesale merges clean, builds green, passes every test — the reverted code's
tests went with it — and produces a file list indistinguishable from a correct
merge.

A rebase of published work that throws a conflict is the LUCKY outcome. One that
replays cleanly rewrites published history silently and nothing goes red.

## How a release is prepared

A release is a BRANCH, not a moment. When the integration branch holds what the
next version should ship:

    git fetch origin
    git switch -c release/<x.y> origin/<integration>
    <only fixes, the version bump, release notes — NO new features>
    git switch main && git merge --no-ff release/<x.y>
    git tag -a v<x.y.0> -m "<x.y.0>"        # the TAG is what production runs
    git switch <integration> && git merge --no-ff release/<x.y>

Three things about that sequence are decisions rather than mechanics.

**The integration branch does not freeze.** It keeps taking features while the
release stabilises, which is the reason to cut a branch instead of declaring a
code freeze. A frozen integration branch stops every other agent on the box.

**The merge-back is not optional.** Fixes made on the release branch exist only
there until it happens, so skipping it loses exactly the work that was urgent
enough to do during stabilisation — and loses it silently, because `main` is
correct and nothing downstream looks at the integration branch for it.

**The release branch is KEPT.** It is that version's maintenance line. Deleting
it after tagging is what makes the next hotfix have nowhere to go but `main`'s
tip.

Promotion to `main` is operator-gated where a project says so, and this changes
how a release is PREPARED rather than who approves it.

## How production is fixed after a release

A critical production bug does NOT go through the integration branch.

    git fetch origin --tags
    git switch -c hotfix/<name> v<x.y.z>     # the TAG in production, not main's tip
    <the smallest fix that addresses it>
    git switch main && git merge --no-ff hotfix/<name>
    git tag -a v<x.y.z+1> -m "<x.y.z+1>"
    git switch <integration> && git merge --no-ff hotfix/<name>
    git switch release/<x.y> && git merge --no-ff hotfix/<name>    # if still live

**Cut from the TAG, not from `main`.** `main` may already carry a later release
than the one deployed. Branching from its tip fixes code that is not running in
production, and merging that branch back drags the newer release into what was
meant to be a patch.

**Three merge targets, and the third is the one that gets forgotten.** Into
`main` so production has the fix; into the integration branch so the next
release does not regress it; into any live `release/<x.y>` so that maintenance
line does not either. Forgetting the second is a bug that returns at the next
release with nothing in the history explaining why.

**A non-critical bug is not a hotfix.** It is a `fix/<name>` from the
integration branch and ships with the next release. The hotfix path exists to
bypass stabilisation, and bypassing it for a bug that could wait spends the
tagging and merge-back cost for nothing.

Where `main` IS the integration branch — `.devbox-git-profile` declaring
`integration=main` — the merge-back step is the same merge as the first and
collapses. Everything else holds unchanged, including cutting from the TAG:
there, every landing is a deployment, so `main`'s tip is routinely ahead of the
last tag.

## Lanes

Two agents never share a checkout. `lane new <name>` cuts an isolated worktree,
branch and port block from the integration branch.

Lanes are worktrees of ONE repository: they share one object store and one
`refs/heads`. So "does this branch hold unlanded work" is a question about the
repository and has no per-lane answer — asking it per lane multiplies one set by
the number of worktrees. Enumerate branches once, then ask which worktree holds
each.

A linked worktree's `.git` is a regular FILE containing a `gitdir:` line, so
`test -d "$d/.git"` is false for every lane. The question you meant is
`git -C "$d" rev-parse --is-inside-work-tree`.

## Before deleting a branch or a lane

`docs/BRANCHING.md` gives the two axes — landed, and on-origin — and says a
branch is irreversible only when both are false. Three things that document does
not cover, because they are about the worktree rather than the branch:

- `unpushed=0` answers NEITHER axis. It is exactly what a branch pushed to
  origin and never merged reports.
- Both axes assume the branch was pushed at least once. A branch never pushed
  has no remote-tracking ref, so it is not reported as risky — it is not
  reported at all.
- `git status --porcelain` per worktree and `git stash list` are two further
  destruction paths neither axis can see, and nobody asks the second.

Finding stranded work is not authority to publish it. Work kept local may be
kept local deliberately; file it and let its owner decide.
<!-- devbox-conventions END -->
