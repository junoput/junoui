---
'@junoput01/junoui': minor
---

**`readout` now compacts with every other surface.** `.juno-readout` reads the
density archetype (`--juno-pad-surface-block`/`-inline`) instead of raw
`--juno-space-*`. It was the only padded surface still spending raw tokens, so
`[data-juno-density="compact"]` compacted every surface in the library except
this one.

Its block padding moves **20px → 16px** at comfortable density. That is the
visible shift, and it is why this is a `minor` rather than a `patch` under the
pre-1.0 mapping: the versioning policy calls "change what an existing class
does" breaking, and says to up-rank when unsure because a surprise visual shift
is worse than a higher version number. The inline axis does not move —
`--juno-space-16` already _was_ what `--juno-pad-surface-inline` resolves to at
comfortable, so the two agreed by coincidence and now agree by construction.

**New tokens** `--juno-brightness-hover` (1.08) and `--juno-brightness-press`
(0.94), reaching every platform output. These were literals inside `button.css`
— the library's entire interaction-feedback vocabulary, readable by nothing
else. Same values in and out, so nothing shifts; additive on its own, which is a
`patch` pre-1.0.

**Shipped documentation fixes.** `docs/` is part of the published package, so
these reached consumers:

- `docs/components/rail.md` told you to pair `.juno-rail--responsive` with a
  dock carrying `.juno-hide-from-md`. Following it leaves a **landscape phone
  (844×390) with no primary navigation at all** — the rail hides because the
  pointer is coarse and the viewport is short, and the dock hides because it
  measures width alone. `docs/layout.md` already forbade that pairing; the two
  documents disagreed and `rail.md` is the one a component author opens. Now
  points at `.juno-dock--responsive` / `.juno-pillbar--responsive`.
- `docs/components/dock-responsive.md` is new — the variant had no
  documentation anywhere, only a CSS comment.
- `docs/accessibility.md`'s per-component ARIA contract table covered 38 of 52
  components. It now covers all 52. `tree` was absent while a filename search
  reported it present, because the only occurrence of the word in that document
  is "the hidden one leaves the tree via `display:none`" — the _accessibility
  tree_.
- `docs/components/README.md` was missing seven components, and
  `docs/design-guidelines.md` claimed density "swaps the internal padding of
  every component underneath it", which was true of the components that read the
  aliases and false of six others.
