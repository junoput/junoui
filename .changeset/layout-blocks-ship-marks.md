---
'@junoput01/junoui': patch
---

Docs: `README.md`'s repository map now marks which directories the npm package
publishes, and lists the three it omitted — `tools/` (the enhancers, each with its
own exports entry), `src/fonts/`, and `test/`. It showed `scripts/`, which does
**not** ship, while hiding `tools/`, which does — the same inversion behind the
`pointer-first` export that resolved in the repo and threw for every consumer.

`package.json`'s `files` is named as the authority rather than copied, so the
reminder cannot drift into a second list that must agree.
