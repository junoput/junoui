---
'@junoput01/junoui': minor
---

Pillbar publishes its geometry as custom props (`--juno-pillbar-item`, `-gap`,
`-pad`, `-edge`) so an app-side capacity planner reads real values instead of
hardcoding pixel constants in JS, and adds `.juno-pillbar__overflow` — a "more"
trigger styled like an item that anchors a `.juno-menu` through the native
Popover API, zero JS. junoui ships the dock point; which items overflow stays
app policy. Computed output for existing markup is unchanged. Fixes 20260802-012.
