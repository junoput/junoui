---
'@junoput01/junoui': minor
---

`.juno-thumb` gains an aspect-locked frame (`--juno-thumb-ratio`, default
square) so a media wall's scroll height is stable before anything loads, a
`--selected` state drawn as an inset outline (never a border — a border would
reflow the frame), a `--flush` variant for full-bleed tiles, and four
`__corner` slots for badges/duration chips. Corner modifiers are named
`--top-start` / `--top-end` / `--bottom-start` / `--bottom-end`, matching the
logical insets they use, so they flip correctly under `dir="rtl"`. Additive:
existing markup sets `aspect-ratio` inline, which still wins. Fixes 20260802-018.
