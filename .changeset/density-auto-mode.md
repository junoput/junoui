---
'@junoput01/junoui': minor
---

`data-juno-density="auto"` — an opt-in density that renders as `comfortable`
everywhere except a narrow coarse-pointer viewport, where content spacing
re-densifies to the `compact` values. It never touches `min-height` or
`--juno-size-tap-min`, so it cannot regress the WCAG tap-target guarantees.
Nothing changes for existing `comfortable` / `compact` consumers. Fixes 20260802-023.
