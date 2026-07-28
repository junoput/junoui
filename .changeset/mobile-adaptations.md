---
'@junoput01/junoui': minor
---

Mobile adaptations — components restructure themselves on narrow viewports and
touch devices, no extra classes for most of it:

- `.juno-dock` — new bottom-navigation component, the phone counterpart of the
  rail (sticky, safe-area padded, `aria-current` active styling). App-shell
  swap recipe in `layout.md#app-shell`.
- Modal becomes a bottom sheet below `bp.sm`: full-width, top corners rounded,
  slides up, footer buttons stretch, body pads past the home indicator.
- Side drawers cap at `85vw` on phones so a sliver of scrim stays tappable;
  the bottom drawer pads for the home indicator.
- Toast stack goes full-width along the bottom edge on phones; toasts slide up
  instead of sideways.
- Tab strip scrolls sideways instead of overflowing — every tab stays
  reachable at any width.
- `.juno-table--stack` (opt-in) — rows become label/value cards below a 480px
  container; give each `td` a `data-label`. Semantics stay a real `<table>`.
- Touch ergonomics: under `pointer: coarse` the base layer raises
  `--juno-size-tap-min` to the 44px comfortable target; hover-revealed table
  row actions stay visible under `hover: none`.
