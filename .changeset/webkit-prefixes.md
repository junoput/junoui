---
'@junoput01/junoui': patch
---

Fix two silent WebKit failures. `backdrop-filter` was shipped unprefixed only,
but Safari needed `-webkit-backdrop-filter` until 18 — so the frosted glass on
the pillbar, pill dock and modal scrim simply did not render on iOS 17 and
earlier, on exactly the floating chrome the mobile set is built around. And
`scrollbar-width: none` only reached Safari 18.2, so the scrollable tab strip
still showed a bar on older iOS; it now carries the `::-webkit-scrollbar`
fallback the other scrollers already had.
