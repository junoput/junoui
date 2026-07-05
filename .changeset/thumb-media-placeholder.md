---
'junoui': minor
---

`.juno-thumb` — media thumbnail frame with a built-in unavailable placeholder.
Muted glyph on `s2` sits under the media; the image covers it while present.
Failed media removes itself via the optional stateless
`onerror="this.remove()"`; known-missing media ships no element and the
placeholder just shows. `--video` flavor (play glyph), `__label` micro-caption.
Loading remains `.juno-skeleton`'s job. Pairs with `.juno-grid-auto--tiles`.

Also: date & time house format documented in `design-guidelines.md`
(`dd.mm.yyyy`, 24-hour, `05.07.2026 · 14:32`, en-dash ranges) with an
`Intl.DateTimeFormat` recipe — content convention, no code.
