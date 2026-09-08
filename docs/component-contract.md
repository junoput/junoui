# Component structural contract

`20260908-019` (W5). `docs/inventory-elements.md` is a **read-only census** —
a human read 52 CSS files and recorded a verdict per component. This is the
opposite kind of artifact: a **generated export**, built from the same CSS
files by `scripts/build-component-contract.mjs`, that a non-browser target
can consume instead of re-deriving.

## Why this exists

`20260906-056`: Android's colour emitter silently dropped seven colours that
iOS, Flutter and Rust all carried, because nothing asserted the targets
agreed — ninety colours had matched a classifier by naming coincidence, and
nothing went red when the ninety-first didn't. junoui generates for Android,
iOS, Flutter, Rust, CSS, SCSS, JS and JSON, and every one of the non-CSS
targets gets **tokens and rules — no component structure**. A native
consumer re-derives a component's part order, its state hooks, its tap
floor, from reading the CSS by eye, and nothing anywhere checks that
re-derivation against the source. This is the analogous export for
structure, and the test suite (`test/component-contract.test.mjs`) is the
analogous check.

## What it exports

`dist/json/component-contract.json` (`junoui/component-contract.json`) and
`dist/rust/juno_component_contract.rs` (`junoui/component-contract-rust`),
per covered component:

- **`order`** — the BEM part sequence, e.g. `["input", "track"]` for
  `switch`.
- **`states`** — the pseudo-classes and ARIA/data attribute selectors found
  on the component's own rules (`:checked`, `[aria-expanded='true']`, …).
- **`tapFloor`** — which `--juno-size-tap-*` token(s) the component reads,
  if any.
- **`indentStep`** — the component-local indent custom property, if the
  component has one (only `tree`, today: `--juno-tree-indent`).

## What "covered" means, and why it is narrower than the census's fixed-23

`docs/inventory-elements.md` calls a component `fixed` when a human reading
the file concludes DOM order is the only order — either a sibling
combinator requires it, or nothing in the file reorders normal flow. The
second half of that is a judgement about an **absence** (no `order:`, no
reordering mechanism, applied to a whole file), and this generator will not
certify an absence — the switch's own `__input` sets `position: absolute`
for the ordinary visually-hidden-input pattern, which is not a reorder
mechanism in the sense that matters, but nothing short of judgement tells
that apart from one that is.

So a component is **covered** only when BOTH hold:

1. Its file's leading doc comment has a `Usage:` example whose classes cover
   **every** BEM part the CSS itself declares (not a partial example — see
   `table`, excluded, whose example shows 6 of its ~26 declared parts).
2. No explicit CSS reorder mechanism was found on the component's own
   rules: an `order:` declaration, an explicit `grid-row`/`grid-column`
   placement, a reversed root `flex-direction`, or a position property
   (`top`/`left`/`inset*`/`transform`) driven by a custom property the
   component's **own Usage example sets inline, per instance** — the
   gizmo's `__mark` rotated by `--juno-gizmo-at`, the range's `__thumb`
   offset by `--juno-range-lo`/`--juno-range-hi`, both set inline in their
   own examples. A component-local custom property that is never
   set inline (the stepper's `--juno-stepper-marker`, a fixed geometric
   constant sizing a connector line) does not trigger this — see the
   generator's own header comment for the false-exclusion this
   distinction fixed.

A component with an explicit sibling/child combinator between two of its
own parts (`switch`: `__input:checked + __track`) gets that recorded as
supporting evidence and cross-checked against the Usage order. A genuine
disagreement between the two — the Usage example says one order, the
combinator requires the other — is a **build-time exclusion**
(`combinator-disagrees`), not a silent pick of one over the other. Proven
by mutation: temporarily reversing switch's Usage example while leaving its
`:checked + __track` combinator in place moves it from `covered` to
`excluded`, and the test that reads `contract.covered.switch` fails loudly
rather than silently reading a stale order. Restored before landing.

**The result: 21 of 52 covered**, not 23. The full breakdown, generated —
see `dist/json/component-contract.json`'s own `$comment` and `counts` for
the current numbers, since this file is prose and that one rebuilds:

| Exclusion reason       | Meaning                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `zero-parts`           | no `__part` class at all — matches the census's `n/a` bucket exactly, by name, not just count (asserted in the test)                                                           |
| `multi-namespace`      | file bundles ≥2 independent component prefixes (`drawer`: sheet + modal; `load-state`: fault + empty; `loader`: arc + beacon + bar)                                            |
| `no-usage-example`     | no Usage example in the file's **leading** doc comment (`dock` documents three per-variant examples further down the file — no single canonical one to pick without judgement) |
| `usage-incomplete`     | the Usage example doesn't show every CSS-declared part (`alert`, `card`, `canvas-ink`, `field`, `pillbar`, `scrubber`, `table`, `thumb`)                                       |
| `reorder-mechanism`    | an explicit CSS reorder mechanism found (`navbar`'s explicit grid-column placement; `gizmo`/`range`/`slider`'s app-supplied position)                                          |
| `combinator-disagrees` | (not currently triggered by any shipped file — proven reachable by the mutation test above)                                                                                    |

**Where this diverges from the census, on purpose:** `alert`, `card`,
`dock`, `drawer`, `field`, `load-state`, `navbar`, `scrubber` are census
`fixed` but excluded here — each for a stated, mechanical reason above, not
a disagreement with the census's reasoning, a narrower standard of proof.
`chip`, `dot`, `gauge`, `popover`, `reload`, `segmented`, `tooltip` are
census `free` but covered here — the census's `free` means "no CSS requires
this exact order," which is a different (weaker) claim than this file
makes ("this order works, and nothing found would render it wrong"); a
free component's Usage-documented order is still a real, correct order,
just not the _only_ one. `slider` is covered by neither this file nor the
census's 4 named-ambiguous rows, yet is excluded here for the identical
mechanical reason as `gizmo`/`range` (a value-driven position) — a real,
stated divergence from the hand census that the census's own five spot
checks did not happen to cover.

## What this does not cover

- Redesigning any component — this exports what exists.
- Appearance — colour, weight, balance are the operator's call.
- Making a native consumer use the contract — that is geovista's call and a
  separate cross-project request, the same boundary `20260904-092`'s answer
  drew for the token exports.

## Landing

`package.json` gained two new `exports` entries and a `build:component-contract`
step in `build` — outside the sub's merge grant, so this lands with
authorisation above the sub, same as `20260906-056`.
