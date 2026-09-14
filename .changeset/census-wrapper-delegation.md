---
'@junoput01/junoui': patch
---

`docs/inventory-elements.md` now says that a wrapper component's zero in the States/hooks
column is delegation rather than a coverage gap. `select` and `field` declare no states
because both wrap a native control carrying `.juno-input`, whose file declares `:disabled`,
`:focus-visible`, `[aria-invalid='true']` and `:placeholder-shown`. That zero had been read
as a missing-states gap five times; a new test pins the delegation so the zero stays
truthful rather than merely true. Docs only — no CSS, token or behaviour change.
