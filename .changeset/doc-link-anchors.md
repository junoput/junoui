---
'@junoput01/junoui': patch
---

Docs: fixes a dead anchor in `docs/components/icon-loader.md`, which pointed at
`./loader.md#arc` while the heading is `## Arc — circular ring`
(`arc--circular-ring`). `docs/` ships, so that link resolved inside consumers'
`node_modules` and went nowhere.

Adds a test covering all 282 relative links and 73 anchors in the shipped docs,
which nothing checked before.
