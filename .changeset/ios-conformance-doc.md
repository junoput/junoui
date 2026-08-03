---
'@junoput01/junoui': patch
---

Add `docs/ios-conformance.md` — the sourced iOS metric contract. Records what
junoui encodes and why (Apple pt = 1 CSS px, the WCAG 24/44 split, safe-area
opt-in, the `max()`-vs-addition rule, viewport-unit families), names the
folklore it deliberately does not encode (the deleted "44pt minimum" HIG
sentence, the non-existent "Apple 8pt grid"), and flags what is unverified (the
16px focus-zoom rule, iOS 26 behavior). Fixes 20260803-031.
