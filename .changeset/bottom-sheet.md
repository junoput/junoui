---
'@junoput01/junoui': minor
---

`.juno-drawer--bottom` is a real bottom sheet: rounded top corners, a decorative
grab handle (`.juno-sheet__handle`), a height knob `--juno-sheet-h` (default
`60dvh`) capped by `--juno-sheet-max` (`92dvh`), and safe-area padding moved to
`.juno-modal__body` so a scrolling sheet's last row clears the home indicator.
Docs state the contract the app still owns — `showModal()`, focus trap, `inert`
background, dismiss — and that `<dialog>` is the only supported sheet root.
Fixes 20260802-019.
