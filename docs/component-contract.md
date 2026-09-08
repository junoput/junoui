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

## The contract

Same rule as any other published export: once a shape ships on `main`,
removing or renaming a field is a breaking change under semver, exactly
like removing a token or a component class (`docs/CHARTER.md`). This
section says which parts of the shape are that promise and which are not
— worth stating explicitly here because `junoui/component-contract-rust`
is a compiled struct, not a JSON blob a consumer can shrug off a rename
in: a field renamed here is a downstream `cargo build` failure for
whoever vendors it, not a warning.

**JSON (`junoui/component-contract.json`) — promised:**

- Top-level keys `covered`, `excluded`, `counts`, `totalComponentFiles`
  exist, with those names and those types (`covered`/`excluded` are
  objects keyed by component name; `counts` is an object of numbers;
  `totalComponentFiles` is a number).
- Each `covered.<name>` entry has `order` (array of strings), `states`
  (array of strings), `tapFloor` (array of strings), `indentStep` (string
  or `null`).
- Each `excluded.<name>` entry has `reason` (string) and `detail` (string).
  The STRUCTURE is promised; the SET of possible `reason` values is not
  closed — a new exclusion reason may be added in a minor release as this
  generator's detection improves, the way a new token is a minor. An
  existing reason will not be silently repurposed to mean something
  different without a major.

**JSON — NOT promised, and must not be parsed as if it were:**

- `$comment` — a human-readable string. Its wording changes freely; never
  match against it.
- `covered.<name>.root` and `covered.<name>.combinatorEvidence` — internal
  diagnostic fields from how the generator reached its answer, not part of
  what a consumer should build logic on. They may change shape or be
  removed without notice.
- **Which specific components appear, and their exact field values** —
  this is content, not shape. A component's `order` changing because its
  CSS genuinely changed is the export doing its job, not a breaking
  change; a component moving from `covered` to `excluded` (or the reverse)
  as its CSS evolves is expected and correct, the same way a token's
  VALUE is free to move in a minor while the token's NAME is not
  (`docs/CHARTER.md`'s token-contract boundary, applied here to
  components).

**Rust (`junoui/component-contract-rust`) — promised:** the `ComponentContract`
struct's five field names and types (`name: &str`, `order: &[&str]`,
`states: &[&str]`, `tap_floor: &[&str]`, `indent_step: Option<&str>`) and
the `COMPONENTS: &[ComponentContract]` const's name and type. Field
ORDER within the struct and the ORDER of entries in `COMPONENTS` are not
promised — `COMPONENTS` is sorted by name today, and a consumer that
depends on iteration order rather than looking up by `name` is depending
on something this file does not commit to.

**Neither target promises `21 covered` as a number**, or any other count
— those are today's content, read from `dist/json/component-contract.json`'s
own `counts` at build time if a number is needed, never hardcoded by a
consumer.

## What "covered" means, and why it is narrower than the census's fixed-22

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

**The result: 21 of 52 covered**, not 22. The full breakdown, generated —
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

**`navbar` is not a divergence — it found a real error in the census.**
This generator excluded it for an explicit `grid-column` placement on
`__title`/`__actions`; the census's row said `fixed`, reasoning "no
`grid-template-areas` — auto-placement follows DOM order," which was
false — those two parts place themselves on explicit tracks regardless of
DOM order, an actual reordering mechanism by the census's own definition
of `fixed`. Caught in review of this ticket and corrected in
`docs/inventory-elements.md` (its `fixed 23 of 37` headline is now
`fixed 22 of 37`, `free` gaining the one navbar left) — the census and
this generator agree on `navbar` as of that fix.

**Where this diverges from the census, on purpose:** `alert`, `card`,
`dock`, `drawer`, `field`, `load-state`, `scrubber` are census
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
