---
'@junoput01/junoui': patch
---

Accessibility: the showcase's `device/media.html` reel was keyboard-unreachable
— it scrolls 350px horizontally at phone width with no focusable children — and
now carries a tab stop and a name, like the six fixed alongside it. No CSS
changes; the showcase is not part of the published package, but the omission it
demonstrated was.
