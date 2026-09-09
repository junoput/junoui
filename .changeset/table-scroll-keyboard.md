---
'@junoput01/junoui': patch
---

Accessibility contract: `docs/accessibility.md` and `docs/components/table.md`
now state that a `.juno-table-scroll` viewport needs `tabindex="0"` plus
`role="region"` and a name. It scrolls, and a table of static cells contains
nothing focusable, so without a tab stop a keyboard-only user cannot reach the
rows below the fold (WCAG 2.1.1). The requirement is keyed on the region having
no focusable content of its own — not on whether it currently overflows, which
depends on the viewport. No CSS changes.
