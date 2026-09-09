---
'@junoput01/junoui': patch
---

Documentation: `docs/components/README.md`'s Class column now lists six public
block classes it had omitted — `.juno-avatar-group`, `.juno-choice`,
`.juno-state`, `.juno-popover-anchor`, `.juno-table-scroll`,
`.juno-toast-stack`. Each is defined by its component's stylesheet and usable
by consumers; none was listed in the catalogue a consumer reads. No CSS
changes and no behaviour changes — the classes already shipped.
