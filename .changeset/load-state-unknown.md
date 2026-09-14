---
'@junoput01/junoui': patch
---

New `.juno-empty--unknown` modifier: the load-state vocabulary had no way to say
_"not determined yet"_. `.juno-empty` is documented as terminal — the load
resolved and found nothing — so consumers with a measurement to report had to
use it for "nobody has looked", which says the opposite. Additive: no existing
class or token changes. The distinction is carried by the icon's border style
(solid = settled, dashed = not settled) rather than by colour, per
`docs/accessibility.md`.
