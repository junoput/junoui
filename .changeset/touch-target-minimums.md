---
'@junoput01/junoui': patch
---

Close a WCAG 2.5.8 gap on the phone-only surfaces. `.juno-menu__item` (dock
overflow routes here on phones) and `.juno-navbar__actions > *` now hold
`min-block-size: var(--juno-size-tap-min)`, which auto-promotes to 44px on
coarse pointers — so nothing routed onto touch falls under the tap minimum.
The UA tap-highlight square is now suppressed on the interactive surfaces
(`.juno-btn`, dock/pillbar/tabs/list/menu items) under `pointer: coarse`, and
the navbar usage example no longer recommends `.juno-btn--sm` (which is
deliberately below the tap minimum) on a touch top bar. Fixes 20260802-020.
