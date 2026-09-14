---
'@junoput01/junoui': patch
---

Docs: `docs/inventory-elements.md`'s `Tokens read` column gains the stated method
it never had, three corrected rows, and a CI guard — the last of the census's five
columns to be checked against `src/css`.

The column had **no Method-notes bullet at all** while every other column had one,
which is why it drifted unnoticed. The rule, now written down: every `--juno-*`
name inside a `var(...)` call in the file's live CSS, comments stripped, with no
ownership filter and no cross-cutting exclusion — unlike `Local custom
properties`, which stays hand-derived because deciding what belongs in it means
deciding who owns a name.

`button`, `dock` and `toast` were undercounting by 2, 4 and 6 names, all from
changes that landed the same day and updated the sibling column while leaving this
one.
