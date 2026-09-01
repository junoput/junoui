# Rules for UI that is painted, not laid out

junoui is CSS and DOM. Everything the conformance kit checks — the doctor, the
class manifest, the cascade resolver, the budgets — reads boxes and computed
styles, and a widget drawn into a canvas or a GPU frame has none.

The token values reach such a consumer (`juno_tokens.rs`, the Rust target). The
mechanisms do not: `text-shadow` has no painter equivalent, a media query is not
available to a render loop, and `min-block-size` is not a thing you can set on a
circle you are about to draw.

What can transfer is the reasoning. These three rules were each re-derived by
hand, correctly, by a consumer that had no way to look them up. They are written
here so the next one does not have to.

## 1. A quantity held fixed against a projected axis is degenerate at some angle

A ring drawn under camera tilt is an ellipse whose vertical semi-axis is
`sin(pitch)` times its horizontal one. It collapses toward a *line*. Anything
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

| question | predicate | what it decides |
|---|---|---|
| how big must a target be | `(pointer: coarse)` alone | tap ergonomics |
| which navigation shape | coarse **and** (narrow **or** short) | rail vs dock |
| does this text fit | the available width, measured | field lists, truncation |

A reduced field list keyed on *portrait and coarse* leaves a narrow desktop
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

And canvas ink is pinned to the dark palette in *both* light and dark mode. It
is not app chrome; its background is the picture, not the theme.

---

None of this is checked by anything. It is here because three of these were
found the expensive way on the same day, by a consumer this library had no way
to help.
