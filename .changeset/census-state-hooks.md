---
'@junoput01/junoui': patch
---

Docs: `docs/inventory-elements.md`'s `States/hooks` column is corrected in eight
of 52 rows and is now verified against `src/css` on every CI run.

The census says of itself "measured from the CSS itself", and its `checkbox` row
read `:disabled, :has(), :checked` while `checkbox.css` had styled
`:indeterminate` since 2026-06-29 — making this the fifth place that state was
invisible. Also corrected: `popover` and `stepper` claimed **no** states at all
(`:popover-open`; `[data-state]`, which is stepper's primary documented
mechanism), `table` and `tooltip` said `:focus` where the CSS has
`:focus-within`, and `menu`, `tooltip`, `breadcrumb` and `navbar` each omitted a
hook.

The document now also states **which of its columns are checked** — three are, and
`Tokens read` and `Local custom properties` are a snapshot from 2026-09-06 that
nothing has compared to the CSS since.
