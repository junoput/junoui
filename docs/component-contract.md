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

**Neither target promises a specific covered count as a number**, or any other count
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
   **every** BEM part the CSS itself declares. Not a partial example — a
   Usage/CSS disagreement is `usage-incomplete`, fixed one component at a
   time in `20260908-050` (5 of the original 8 turned out to be exactly
   that: a missing part, not a design decision).
2. No explicit CSS reorder mechanism was found on the component's own
   rules: an `order:` declaration, an explicit `grid-row`/`grid-column`
   placement, a reversed root `flex-direction`, a position property
   (`top`/`left`/`inset*`/`transform`) driven by a custom property the
   component's **own Usage example sets inline, per instance** — the
   gizmo's `__mark` rotated by `--juno-gizmo-at`, the range's `__thumb`
   offset by `--juno-range-lo`/`--juno-range-hi`, the scrubber's
   `__range`/`__head`/`__mark--in`/`__mark--out` offset by
   `--juno-scrubber-in`/`-out`/`-played` — or a `:has()` rule conditioning
   on a SIBLING part's state, the way `.juno-pillbar--collapsible:has(>
.juno-pillbar__toggle[aria-expanded='false'])` reads `__toggle`'s state
   rather than its position, which is exactly why the file's own comment
   says `__toggle`/`__tray` order is free. A component-local custom
   property that is never set inline (the stepper's
   `--juno-stepper-marker`, a fixed geometric constant sizing a connector
   line) does not trigger the position-property check — see the
   generator's own header comment for the false-exclusion this
   distinction fixed.
3. It is not the one named, explicitly-commented exception
   (`DATA_DRIVEN_PARTS` in the generator) for a component whose parts are
   an open-ended, app/data-defined set no Usage example could canonically
   show — `table`'s ~20 cell-content-type column classes, decided by a
   human once and checked, not detected mechanically. See
   `data-driven-parts`, described below.

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

**The result: 26 of 52 covered**, up from 21 as of `20260908-050` — the 5
components whose Usage example was genuinely incomplete (a missing part,
not a design decision). The full breakdown, generated — see
`dist/json/component-contract.json`'s own `$comment` and `counts` for the
current numbers, since this file is prose and that one rebuilds:

| Exclusion reason       | Meaning                                                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `zero-parts`           | no `__part` class at all — matches the census's `n/a` bucket exactly, by name, not just count (asserted in the test)                                                                                         |
| `multi-namespace`      | file bundles ≥2 independent component prefixes (`drawer`: sheet + modal; `load-state`: fault + empty; `loader`: arc + beacon + bar)                                                                          |
| `no-usage-example`     | no Usage example in the file's **leading** doc comment (`dock` documents three per-variant examples further down the file — no single canonical one to pick without judgement)                               |
| `usage-incomplete`     | the Usage example doesn't show every CSS-declared part — 0 today; all 8 original instances were fixed or reclassified in `20260908-050`                                                                      |
| `reorder-mechanism`    | an explicit CSS reorder mechanism found: `navbar`'s explicit grid-column placement; `gizmo`/`range`/`slider`/`scrubber`'s app-supplied position; `pillbar`'s `:has()` conditioning on a sibling part's state |
| `combinator-disagrees` | (not currently triggered by any shipped file — proven reachable by the mutation test above)                                                                                                                  |
| `data-driven-parts`    | one named exception (`table`) — see below                                                                                                                                                                    |

### `table` is not `usage-incomplete` — it has no fixed schema

`table`'s Usage example shows 6 parts; the CSS declares ~26. Padding the
example to the full count would have been **writing documentation to move
a number**: roughly 20 of the missing parts (`__num`, `__mono`, `__time`,
`__trend`, `__meter`, …) are cell-content-type COLUMN classes an app picks
per table, per column, from its own data schema — there is no fixed set of
them a canonical example could show, which is exactly what got `table`
its `ambiguous` verdict in `docs/inventory-elements.md` in the first
place.

Nothing in CSS syntax marks a class as "app-chosen per data schema" the
way `order:` or `:has()` mark a reorder mechanism, so this is not
detected — it is one named, explicitly-commented exception
(`DATA_DRIVEN_PARTS` in `scripts/build-component-contract.mjs`), checked
**before** the Usage-completeness test so `table` gets the honest reason
instead of a symptom of it. If a future component turns out to have the
same shape, its name belongs in that same explicit set — the alternative,
a heuristic guessing at "many similarly-named short parts," would be an
unprincipled threshold standing in for the same judgement call, with none
of the traceability.

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

**Where this diverges from the census, on purpose:** `dock`, `drawer`,
`load-state`, `scrubber` are census `fixed` but excluded here — each for a
stated, mechanical reason above, not a disagreement with the census's
reasoning, a narrower standard of proof. (`alert`, `card` and `field` were
in this list too until `20260908-050` completed their Usage examples —
they were census-correct all along; this generator was the one that
hadn't been given enough to prove it.)

`chip`, `dot`, `gauge`, `popover`, `reload`, `segmented`, `tooltip` are
census `free` but covered here — the census's `free` means "no CSS requires
this exact order," which is a different (weaker) claim than this file
makes ("this order works, and nothing found would render it wrong"); a
free component's Usage-documented order is still a real, correct order,
just not the _only_ one. `pillbar` is ALSO census `free`, but excluded
here rather than covered: unlike the seven above, its file's own CSS
contains actual mechanical evidence of the freedom (`:has()` conditioning
on `__toggle`'s state), so this generator does not certify even a
"works today" order for the two parts that evidence names — the census's
`free` was right in both directions, and this generator can now tell the
difference between "free, and I have no evidence either way" and "free,
and I can see why."

`slider` is covered by neither this file nor the
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
