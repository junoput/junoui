---
'@junoput01/junoui': patch
---

New `docs/ios-pwa.md`: a bounded statement of what junoui gives you on iOS and in
a Home-Screen web app — what you get for free, what your app must supply, and
what junoui explicitly does not do. `docs/ios-conformance.md` gains the
standalone `<head>` contract and names the letterbox flag
(`data-juno-letterboxed`, app-set, documented rather than shipped).

Docs ship in the package, so a consumer installing this version receives both.
Two corrections travel with them: the letterbox flag is **not** an upstream-fix
detector (that test needs a document that cannot scroll, and the unlock makes it
scroll), and `.juno-pagination`'s items take the coarse-pointer promotion on the
inline axis only — 44 × 32 on touch, which clears WCAG 2.5.8 AA and not the
44 px comfortable target the docs previously implied.
