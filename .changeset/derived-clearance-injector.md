---
'@junoput01/junoui': minor
---

Two primitives stop encoding junoui's own dimensions and start exposing the
derivation, so a consumer that parameterizes them stays correct.

- **`junoui/icons/install`** — the sprite injector without the sprite (~1 kB).
  A consumer that subsets with `junoui/subset` can now keep the same-document
  injection Safari requires without pulling the 66-symbol payload that
  `junoui/icons/inline` carries; both share one id-guarded holder, so mixing
  them cannot produce two. `icons/inline` is unchanged for everyone else.
- **`--juno-dock-clearance` / `--juno-pillbar-clearance` are derived**, from
  new published parts: `--juno-dock-h`, `--juno-pillbar-h` and
  `--juno-dock-clearance-scale`. They were constants that promised to track the
  dock's geometry and did not — past a 58px bubble they reserved less than the
  pill's own height plus its margin, hiding content under the dock. Values at
  the default 44px bubble change from 92px to 86px (dock) and 72px to 78px
  (pillbar), both now equal to what the control actually measures plus its
  margin and a breathing gap.
