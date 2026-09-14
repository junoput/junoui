---
'@junoput01/junoui': patch
---

**`docs/components/popover.md` documents how to observe the panel's resolved
placement after a fallback flip.** It previously said the panel "flips to stay
on-screen" without saying that following the flip needs script — a consumer
can read the resolved placement via `getComputedStyle(panel).positionArea` to
flip an arrow to match, but there is no CSS selector for it; this is JS-only,
same shape as the tooltip's top-layer mode.

Advises comparing against a baseline reading rather than a hardcoded string:
Chromium serializes the authored logical `block-end span-inline-start` back as
a physical value, not the logical spelling that was written, so a consumer
matching a literal never matches. Also notes the resolved value names the
area, not which fallback fired (two crowding conditions can read back
identically), and that this was only measured in Chromium — other engines may
serialize differently or not support the property at all. Docs only, no CSS
behaviour change.
