<!-- devbox-conventions docs__BRANCHING.md v5 BEGIN — generated; edit outside the markers -->
## Branch policy

Every branch name matches `<type>/<kebab-case>`, where type is one of:

    feat feature fix hotfix chore docs refactor perf test release

This is not a style preference. `lane pr` refuses a name that does not match,
at the one moment renaming is free — before the branch is pushed. `gate run
--review` reports it afterwards but does not block, because by merge time the
branch has been reviewed under that name and renaming it helps nobody.

### What each type branches FROM and merges INTO

Most types are ordinary topic branches: cut from the integration branch, merged
back into it, deleted after landing. `feat` `fix` `chore` `docs` `refactor`
`perf` `test` are all this shape. A non-critical bug is a `fix` and ships with
the next release — it is not a hotfix.

Two types are not that shape, and the difference is the whole reason this
section exists:

    release/<x.y>   cut from the integration branch.
                    Merges into `main` (--no-ff, the merge commit TAGGED
                    v<x.y.0>) and BACK into the integration branch.
                    KEPT after release — it is that version's maintenance line.

    hotfix/<name>   cut from the production TAG on `main`, never from the
                    integration branch.
                    Merges into `main` (tagged v<x.y.z+1>), into the integration
                    branch, and into the matching `release/<x.y>` if one is live.

A release branch takes only fixes, the version bump and release notes. NO new
features: the integration branch keeps taking those in parallel, which is the
point of cutting the release at all.

A hotfix is cut from the TAG rather than from `main`'s tip because `main` may
already carry a later release. Branching from the tip fixes a bug in code that
is not the code running in production, and the resulting merge drags the newer
release into the patch.

### Where the merge-back does and does not apply

The two shapes above assume `main` and the integration branch are DIFFERENT
branches. Where they are the same — `.devbox-git-profile` declares
`integration=main`, as a repo whose `main` is both the integration branch and
the deployment surface does — then:

- there is no separate merge-back step, because the branch a release or hotfix
  merges into IS the integration branch;
- a release branch is cut from `main`, since that is the integration branch;
- a hotfix is still cut from the production TAG rather than from `main`'s tip,
  and that distinction matters MORE here, not less: on such a repo every merge
  to the integration branch is a deployment, so `main`'s tip is routinely ahead
  of what was last tagged.

Read the rules above as being about the integration branch, and collapse the
duplicate step when the two names resolve to one branch. A document that
instructs a merge into a branch the repo does not have is drift, and this
section exists so the fleet-wide template does not create it.

### The integration branch is DECLARED, never guessed

`.devbox-git-profile` at the repo root carries `integration=<branch>`. Tools
read it to answer questions they otherwise answer by inference, and a wrong
inference here is expensive: it decides which branch a lane is cut from, what
"behind" means, and which remote ref is quoted as evidence that work landed.

A project without the file gets whatever the inference guesses. That has been
measured wrong in both directions on this box — a status column printing `0`
where the truth was 67, and `132` where the truth was 0 — so there is no safe
default, only the declaration.

### What the branch is compared against

`base-fresh`, `pr-size` and the landed/on-origin checks all diff against the
integration branch. Two axes decide whether a branch is safe to delete, and
they are independent:

    landed     git merge-base --is-ancestor <branch> origin/<integration>
    on-origin  is the branch's TIP COMMIT on any remote ref?

Neither alone is sufficient. A branch that is neither is the only irreversible
case; a dirty worktree and a stash are two further destruction paths that
neither axis can see.

### on-origin is a question about a COMMIT, not about a name

It is tempting to write the second axis as `git ls-remote origin <branch>`. That
spelling has been wrong in both directions, and the second one was found by the
remediation the axis itself prompts:

- **`ls-remote origin <branch>` matches by SUFFIX.** `ls-remote origin develop`
  returns `refs/heads/develop` AND `refs/heads/iosphotos/develop`, so consumed as
  `| wc -l` a suffix match is byte-identical to a real one. That errs
  REASSURING: it reports work as recoverable when nothing of that name is on the
  remote.
- **`ls-remote --exit-code origin refs/heads/<branch>` fixes the suffix match and
  introduces a false NEGATIVE.** Archive a stranded branch to
  `refs/heads/archive/<date>/<name>` — which is what you do once the axis flags
  it — and the exact form reports it not-on-origin while the same SHA sits on the
  remote under the archive name. A safety signal that flips when its subject did
  not.

Both fail for one reason: the axis is written as a question about a NAME and
means a question about a COMMIT. A name-keyed check cannot survive the work being
renamed, moved, or archived under a prefix.

The form that asks the question it means, after a fetch:

    git branch -r --contains "$(git rev-parse <branch>)"

Materialise that rather than piping it into `grep -q`: an early-closing consumer
under `set -o pipefail` reports failure for a successful match at volume, which
would call published work unpublished — the reassuring direction, and the one
this axis exists to avoid.

`lane` already asks it this way. Its on-origin state tries the exact ref first
and then falls back to the commit, reporting `yes:<ref>` so a reader sees the
work is safe AND that it is living under another name.
<!-- devbox-conventions END -->
