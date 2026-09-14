---
'@junoput01/junoui': patch
---

**`docs/components/popover.md` documents how to observe the panel's resolved
placement after a fallback flip.** It previously said the panel "flips to stay
on-screen" without saying that following the flip needs script — a consumer
can read the resolved placement via `getComputedStyle(panel).positionArea`
(e.g. `end span-inline-start` becomes `end span-inline-end` once crowded) to
flip an arrow to match, but there is no CSS selector for it; this is JS-only,
same shape as the tooltip's top-layer mode. Also notes the resolved value
names the area, not which fallback fired — two different crowding conditions
can read back identically. Docs only, no CSS behaviour change.
