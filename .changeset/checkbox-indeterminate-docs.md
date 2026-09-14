---
'@junoput01/junoui': patch
---

**Shipped documentation fix.** `.juno-checkbox:indeterminate` has been styled
since 2026-06-29 — border/glow matching `:checked`, core drawn as a flat dash
instead of the full square — and no document mentioned it. Worse than a
missing row: `docs/accessibility.md`'s ARIA contract said "State is native
`checked`", actively telling a consumer there were only two states.

That state cannot be set from markup — `el.indeterminate = true` in JS is the
only way, there is no HTML attribute — so a consumer following the old
contract would write `<input type="checkbox" indeterminate>`, get nothing,
and have no reason to look further. It also announces as **mixed**, a third
value the contract never named.

`docs/components/checkbox.md`'s class table and Usage section now cover the
state and the one-line JS that sets it; `docs/accessibility.md`'s checkbox row
now says it announces as mixed and cannot be expressed in markup. No CSS
changed — the styling was already correct and shipped.
