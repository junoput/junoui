---
'@junoput01/junoui': patch
---

**Two mistyped class names in the touch-default lists, and a tap floor for the segmented pill.**

`base.css` carries two `:where()` lists of junoui's own tappable components — one dropping double-tap-to-zoom recognition (`touch-action: manipulation`), one killing the UA tap-highlight square under `(pointer: coarse)`. Two members named classes that do not exist, so `:where()` matched nothing, the rule still parsed, every other member kept working, and the named components silently kept the defaults they were listed to opt out of:

- `.juno-seg__option` → `.juno-seg__opt` (touch-action list)
- `.juno-list__item` → `.juno-list__row` (**both** lists)

Every segmented control and every grouped list row in every consumer has been carrying the ~300ms double-tap delay. No consumer change is needed — the fix lands in the shipped stylesheet.

`.juno-seg__opt` was also the only interactive primitive with no tap floor: it computed 25.39px from its padding, which meets WCAG 2.2 AA (2.5.8, 24px) by accident and misses the comfortable touch target entirely. It now holds `--juno-size-tap-min` on the painted box, like `.juno-btn`. Measured against the built bundle: **fine pointer unchanged at 25.39px, coarse 25.39 → 44.00**, width unchanged either way — so no showcase baseline moves.

Unlike `.juno-btn--sm`, `.juno-seg--sm` does **not** drop below that floor: it reduces type and padding only. A segmented row is routinely the only control on a whole settings section, so a sub-tap variant of it has no safe use on a phone.
