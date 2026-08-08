---
'@junoput01/junoui': minor
---

Ship a JS-readable motion contract. `prefers-reduced-motion` is a CSS media
query, so imperative JS (smooth-scroll choices, rAF-driven transforms) could
never see it without its own `matchMedia` listener. The base layer now exposes
`--juno-motion` (`auto` | `none`) and `--juno-motion-scale` (`1` | `0`) on
`:root`, flipped inside the existing reduced-motion query — one
`getComputedStyle` read decides. `--juno-motion-scale` also lets CSS author a
duration as `calc(var(--juno-motion-duration-base) * var(--juno-motion-scale))`
instead of repeating a per-component media query. Additive. Closes 20260802-011.
