---
'@junoput01/junoui': patch
---

Docs: `docs/components/checkbox.md` now records the behaviour a consumer trips on
with `:indeterminate` — **script assignment never clears it, a user click always
does.** Measured: `el.checked = true` and `el.checked = false` both leave
`indeterminate` **true**, while a real click sets it **false** before your
`change` handler runs.

So the state survives every assignment you make and not the one thing you did not
do. A "select all" that writes `indeterminate` only when the partial set changes
silently loses the dash the first time somebody clicks the box — re-derive it from
the child set on every change rather than tracking it.

Also states the label consequence: the dash is the only visual cue and the state
announces as **mixed**, so the label has to read correctly in all three states.
