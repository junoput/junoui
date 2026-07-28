---
'@junoput01/junoui': patch
---

Bundle `utilities.css` last in `juno.css`: role helpers (`.juno--nominal` …) set
`--juno-role` at the same specificity as component defaults
(`.juno-gauge { --juno-role: … }`), so with utilities first every same-element
role recolor silently lost the cascade to the component's own default.
Utilities-last restores `.juno-badge.juno--warning`, `.juno-gauge.juno--caution`,
`.juno-spark.juno--nominal`, etc. (Found by the Nexora integration.)
