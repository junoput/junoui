---
'@junoput01/junoui': minor
---

New `@junoput01/junoui/subset` — build-time icon-sprite subsetting for apps
that inline the sprite (which Safari's flaky external-`<use>` rendering
forces): `subsetSprite(sprite, names)` returns the same sprite carrying only
the icons an app draws, and `spriteSymbolNames(sprite)` lists what it defines.
Pure, dependency-free Node tooling; an unknown name throws rather than
rendering an empty `<svg>` in the consumer, symbol order is stable, and the MIT
Phosphor notice survives the trim. Adds the `cloud-slash` icon. See
docs/icon-subsetting.md.
