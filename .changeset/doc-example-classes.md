---
'@junoput01/junoui': patch
---

Docs: `docs/components/icon-loader.md`'s "40px circular icon button" example used
`.juno-btn--icon`, a modifier that exists nowhere in the CSS — `button.css`
declares `--dense`, `--ghost` and `--sm`. Now uses `--ghost`, matching the repo's
own precedent for an icon-only button. `docs/` ships, so a consumer copying that
example got a plain button where the caption promised a variant.

Adds a test requiring every `__part` and `--modifier` named in a doc example to
exist in the CSS. Bare BEM blocks are deliberately exempt: `.juno-tabs` is a
wrapper whose parts carry every rule, and requiring it to exist would push a
meaningless declaration into the stylesheet.
