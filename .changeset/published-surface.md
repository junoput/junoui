---
'@junoput01/junoui': patch
---

Stop publishing junoui's internal release process to consumers: the pre-release
consumer gate document moves from `docs/release-gate.md` to `RELEASING.md` at
the repo root, beside CONTRIBUTING.md, which has never shipped. `files` carries
`docs` wholesale, so the rule is now positional — `docs/` IS the published
manual, and contributor or process documents live at the root. The published
surface loses one file (204 → 203) and no consumer-facing content changes.
