---
'@junoput01/junoui': patch
---

`.juno-label` reads an optional `--juno-label-size`, falling back to the existing
token, so a consumer can resize labels from an ancestor instead of cloning the
class. The knob is never declared on the element itself — only read as a `var()`
fallback — so it cannot shadow an ancestor's value. Fixes 20260802-025.
