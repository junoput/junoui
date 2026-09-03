# Rules for UI that is painted, not laid out

junoui is CSS and DOM. Everything the conformance kit checks — the doctor, the
class manifest, the cascade resolver, the budgets — reads boxes and computed
styles, and a widget drawn into a canvas or a GPU frame has none.

The token values reach such a consumer (`juno_tokens.rs`, the Rust target). The
mechanisms do not: `text-shadow` has no painter equivalent, a media query is not
available to a render loop, and `min-block-size` is not a thing you can set on a
circle you are about to draw.

What can transfer is the reasoning — and, since `20260901-051`, the arithmetic.
Each rule below has a pure-function core, and those cores now ship:

```rust
// dist/rust/juno_rules.rs — generated, alongside juno_tokens.rs
wants_compact_nav(width, height, coarse) -> bool
tap_min(coarse) -> f32
ring_diameter_for_marks(marks, tap_px) -> f32
labels_that_clear(marks, ratio, radius_px, glyph_px) -> u32
halo_offsets(font_px, halo_width_px, reference_px) -> [(f32, f32); 4]
```

**One table, two targets — and one honest limit.** Each rule is defined once in
`scripts/rules.mjs`; `tools/pointer-first.mjs` re-exports it rather than
restating it, the Rust is generated from it, and the Rust's `#[test]` bodies are
generated from the same `CASES` table the JS tests run. Adding a case covers
both targets; there is no way to add one and miss the other.

What that does **not** buy, said plainly because it would be easy to imply
otherwise: **Node cannot check that the Rust body computes what the JS body
computes.** The JS suite verifies the table, the two bounds as numbers, the
generated-case count, and that nothing kept a second copy of the predicate. Only
`rustc` can check the Rust semantics, by running those generated tests —
`npm run test:rust`, which **refuses** rather than skips when no toolchain is
present. junoui's CI has none; wiring one touches `.github` and is the
operator's call. Mutation testing is how this was found rather than assumed: a
mutation that made the Rust predicate diverge from the JS one survived the whole
JS suite.

These three rules were each re-derived by hand, correctly, by a consumer that
had no way to look them up. They are written out below so the next one does not
have to, and so the functions above have their reasoning attached rather than
being five signatures.

## 1. A quantity held fixed against a projected axis is degenerate at some angle

A ring drawn under camera tilt is an ellipse whose vertical semi-axis is
`sin(pitch)` times its horizontal one. It collapses toward a _line_. Anything
constant against that — an inset in pixels, a count of labels, a padding — is
correct at the tilt you tested and wrong at some other tilt, and the failure is
not gradual: it is two rows of text where a compass should be.

Derive against the constraint the projection leaves you, the way junoui's gizmo
sizes its ring from `1 / sin(π / marks)` rather than from a number that looked
right at eight marks. If the constraint is per-element rather than per-set,
say so and check it per element: as an ellipse flattens, north and south walk
inward toward the centre while east and west do not, so "does this label fit"
is a question about that label.

## 2. Coarse pointer, compact navigation, and "does the text fit" are three

questions with three predicates

They are routinely conflated, and each conflation has shipped:

| question                 | predicate                            | what it decides         |
| ------------------------ | ------------------------------------ | ----------------------- |
| how big must a target be | `(pointer: coarse)` alone            | tap ergonomics          |
| which navigation shape   | coarse **and** (narrow **or** short) | rail vs dock            |
| does this text fit       | the available width, measured        | field lists, truncation |

A reduced field list keyed on _portrait and coarse_ leaves a narrow desktop
window overflowing, because width is the thing that decides whether text fits
and it was never consulted. A rail keyed on width alone vanishes on a landscape
phone at 844×390 — wider than `md`, and still a phone.

`@junoput01/junoui/pointer-first` publishes the compact-navigation condition in
both CSS and JS. A painted consumer cannot call it, but the predicate is four
lines and the numbers are the same: `NARROW_MAX_PX = 767.98`,
`SHORT_MAX_PX = 500`.

## 3. Ink over unknown backing needs its own ground

There is no colour that survives both a glacier and dark aerial imagery. Tuning
the grey is not a fix, it is a choice of which extreme to fail on.

Give the mark its own ground: a translucent plate, or a light glyph with a dark
halo. junoui ships this as `.juno-canvas-ink` and proves the pair holds at both
extremes; the tokens are in the Rust target under the same names.

Two details that cost a round each when re-derived:

- **A halo is hard offsets, not a blur.** A blurred shadow spreads the same ink
  thinner and the contrast floor moves very little.
- **Scale the offset to the glyph.** Two points of outline around a ten-point
  label closes the counters and the label reads as a smudge.

And canvas ink is pinned to the dark palette in _both_ light and dark mode. It
is not app chrome; its background is the picture, not the theme.

## What still does not transfer

Stated plainly, because five functions can read like more coverage than they
are:

- **Nothing here draws anything.** These answer sizing and placement questions;
  what you paint, and whether it looks right, is yours. See
  [appearance.md](./appearance.md).
- **No probe reaches you.** `junoui-doctor` reads the DOM. A canvas has none, so
  none of its checks apply to what you render into one.
- **The halo is offsets, not a shadow API.** `halo_offsets` tells you where to
  stamp the ink four times; your painter has to do the stamping.
- **`labels_that_clear` divides by two.** Eight falls back to four, never to
  six, because the cardinals are the set worth keeping. If your instrument wants
  a different fallback, the rule to copy is _derive it from the room the
  projection leaves_, not this function.
- **junoui's CI compiles this file.** The `build` job runs `npm run test:rust`,
  which is one `rustc --test` over the generated file — so a Rust body that
  diverges from its JS twin fails a PR. That was not always true: until
  `20260901-075` there was no toolchain in CI, and a mutation dropping the
  `or short` term from the Rust `wants_compact_nav` survived the entire JS
  suite. The runner **refuses** rather than skips when `rustc` is absent, so the
  step cannot quietly pass on a runner without one.

---

The three rules below were found the expensive way on the same day, by a
consumer this library had no way to help.
