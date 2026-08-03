---
'@junoput01/junoui': patch
---

`.juno-icon` no longer pins `--juno-icon-size` on the element itself; the
`1.25em` default now lives in the `var()` fallback. An ancestor that sets
`--juno-icon-size` for contextual sizing (e.g. `.juno-list__chevron`) is no
longer shadowed, so it actually reaches the glyph. Explicit `--sm/--lg/--xl`
modifiers are unaffected. Fixes the footgun in 20260727-011.
