---
'@junoput01/junoui': patch
---

`.juno-modal__body` is now the real scroll port the docs already promised. The
surface caps its own height (85dvh as a bottom sheet) and sets `overflow:
hidden`, so a tall body was clipped and unreachable; `[open]` is now a flex
column and the body carries `min-block-size: 0; overflow-y: auto`. It also gets
`overscroll-behavior: contain`, so hitting the end of a sheet no longer chains
the scroll to the page behind it (the rubber-band-under-the-sheet effect on
iOS). Fixes 20260803-029.
