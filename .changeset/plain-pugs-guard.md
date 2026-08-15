---
'@junoput01/junoui': minor
---

Declare the browser-support baseline, and guard the one gap that is functional.

New `docs/browser-support.md`: the supported floor (Safari/iOS 17.5, Chrome/Edge
117, Firefox 129), the hard floor below which things break (17.0 / 114 / 125),
and a per-feature audit of the built bundle with a degrade-vs-break verdict on
each. `package.json` now carries a matching `browserslist`; README and
getting-started state the floor.

`base.css` ships one `@supports not selector(:popover-open)` guard. Below Safari
17.0 the Popover API is absent, and because the UA rule that hides a closed
popover is absent with it, `.juno-menu` and `.juno-popover` were rendering as
invisible fixed panels that swallowed taps. The guard hides them instead —
absent beats invisibly-present, and apps can branch on
`CSS.supports('selector(:popover-open)')`. Guards are for functional failures
only; cosmetic gaps (missing entry animations, unanchored placement) are
documented, not wrapped.

`docs/ios-conformance.md` gains the viewport-unit decision it was missing:
`dvh` stays at both `.juno-app-shell` and `.juno-drawer`, with the reasoning,
what each option costs at the moment browser chrome retracts, and a rule for
applying the choice to a new component. It also now records the iOS Home-Screen
standalone letterbox — iOS sizes the window from the document's resting
scrollability at launch — which is why `base.css` carries the standalone unlock.

Docs and defaults only; no token or component API changed.
