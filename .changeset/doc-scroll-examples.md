---
'@junoput01/junoui': patch
---

Documentation: the scroll-container examples in `docs/components/table.md` now
show `tabindex="0"` + `role="region"` + a name, matching the rule the same file
states. `docs/layout.md`'s generic scroller and reel examples carry a comment
naming the condition instead, because blanket-adding a tab stop to a
placeholder example would teach "always add one" — which the rule forbids.
No CSS changes.
