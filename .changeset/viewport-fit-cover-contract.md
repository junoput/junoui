---
'@junoput01/junoui': patch
---

Document the `viewport-fit=cover` requirement and make the showcase honour it.
iOS defaults `viewport-fit` to `auto` and WebKit reports every
`env(safe-area-inset-*)` as `0` unless the page opts in with `cover` — so every
safe-area guarantee in the library (dock, pillbar, navbar, drawer, toast,
app-shell, and the `--juno-*-clearance` tokens) was silently a no-op for any
consumer who did not already know the trick, including junoui's own showcase.
Adds the meta to all 13 showcase pages, states it as a hard requirement in
getting-started + layout docs, and adds a build test so a page cannot lose it
again. Fixes 20260803-028.
