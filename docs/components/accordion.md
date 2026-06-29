# Accordion / disclosure

Stacked, expandable sections built on the native `<details>` / `<summary>` — keyboard and
screen-reader native, **zero JS**. A chevron rotates on open. Use a lone `<details>` for a
single disclosure, or group them in `.juno-accordion` for a bordered set.

## Web

```html
<div class="juno-accordion">
  <details class="juno-accordion__item" open>
    <summary class="juno-accordion__summary">Region · us-east-1</summary>
    <div class="juno-accordion__body">Primary region. 3 replicas, auto-scaling on.</div>
  </details>
  <details class="juno-accordion__item">
    <summary class="juno-accordion__summary">Region · eu-west-1</summary>
    <div class="juno-accordion__body">Failover armed. 1 of 3 replicas reporting.</div>
  </details>
</div>

<!-- lone disclosure (frames itself) -->
<details class="juno-accordion__item">
  <summary class="juno-accordion__summary">Advanced options</summary>
  <div class="juno-accordion__body">…</div>
</details>
```

| Class                      | Effect                                                         |
| -------------------------- | -------------------------------------------------------------- |
| `.juno-accordion`          | Bordered group; clips its items' corners.                      |
| `.juno-accordion__item`    | A `<details>`; row rule between items. `[open]` to start open. |
| `.juno-accordion__summary` | The `<summary>` header; native marker hidden, chevron added.   |
| `.juno-accordion__body`    | The revealed content (`s0`, `label` text).                     |

## Anatomy (any platform)

- Summary: `s1` row, `data` label, control-padding; hover → `s2`. A chevron (a rotated
  corner) flips from ▸ to ▾ via `[open]`, `motion.duration.quick`.
- Body: `s0` panel under a 1px rule. Native open/close (no height animation by default).
- A lone `details.juno-accordion__item:only-child` draws its own border + radius.

## Usage

- **Zero JS** — `<details>` toggles itself; `<summary>` is focusable and Enter/Space work.
  For "only one open at a time", give the `<details>` a shared `name` attribute (native
  exclusive accordion) — no script needed.
- Keep the summary a short label; put detail in the body.
- To animate open/close, progressively enhance with `::details-content` +
  `interpolate-size` where supported; the component stays correct without it.
