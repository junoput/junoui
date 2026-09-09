---
'@junoput01/junoui': patch
---

Accessibility contract: `docs/accessibility.md` gains a **Scrollable regions**
section stating, once, that a region which scrolls and contains nothing
focusable needs `tabindex="0"` + `role="region"` + a name (WCAG 2.1.1), and
naming every junoui class that creates one — `.juno-table-scroll`,
`.juno-scroller`, `.juno-reel`, `.juno-app-shell__main`, `.juno-modal__body`.
`docs/layout.md` carries the same note where the scroller primitives are
documented. The rule keys on the region having no focusable content of its own,
not on whether it currently overflows, which is viewport-dependent. No CSS
changes.
