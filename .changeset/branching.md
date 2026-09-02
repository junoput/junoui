---
'@junoput01/junoui': patch
---

Document the branch model, and guard it against the CI triggers (`20260901-057`).

junoui has exactly one long-lived branch, `main`. `develop` existed anyway, and it was a trap: a PR opened against it got **no checks at all** — an empty list, not a red one, which looks identical to green — and landed nowhere. It was hit for real, and only caught by dispatching the workflow by hand.

The evidence for deleting it rather than syncing it: **zero** commits of its own, ever; **zero** of 33 merged PRs targeted it; nothing in the repo depends on it; and it went from 16 commits behind to 68 in a few hours. An integration branch has no job here — releases run on push to `main`, and the staging a `develop` would provide is already provided by `gate:consumer`, which packs the release candidate and runs the consumer's suite before anything lands.

`docs/branching.md` states that, with the numbers, and `test/branching.test.mjs` keeps the documented model and the workflow triggers from disagreeing silently: any branch CI _names_ must be `main`, no other workflow may act on a branch the doc does not name, and the doc's stated residual must match whether the `pull_request` trigger is still filtered.
