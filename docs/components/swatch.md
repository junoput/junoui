# Colour swatch & palette

Showing a user-chosen colour, and letting someone pick one. Diagrams, calendars,
tag and label systems, chart series colours, annotation tools, theming UIs,
kanban boards.

## The hard part is not the square

A swatch shows an **arbitrary** colour, so every piece of chrome on it — its
border, its focus ring, its checked indicator — has to stay visible against a
colour junoui has never seen. A single hairline fails at one end of the range: a
dark border vanishes on near-black, a light one vanishes on near-white, and the
swatch that loses its border is the one that has merged with the panel behind it.

So the border is a **pair** of hairlines, one dark (inset) and one light
(outset). Whatever the swatch, one of them contrasts; the other is the one you
do not notice. `test/swatch.test.mjs` sweeps the swatch colour and asserts one
ring always clears 3:1, rather than asserting a border value.

**Focus rings sit outside the swatch, with an offset**, so their contrast is
against the panel — a known surface — rather than against a hue junoui cannot
predict. A ring drawn _on_ the swatch has the same unsolvable problem, and a
thicker ring does not fix a hue collision.

## Web

```html
<span
  class="juno-swatch"
  style="--juno-swatch-color:#C41E3A"
  role="img"
  aria-label="Crimson"
></span>

<button
  class="juno-swatch juno-swatch--button"
  style="--juno-swatch-color:#1F6FEB"
  aria-label="Annotation colour: Azure"
  popovertarget="palette"
></button>

<div class="juno-popover" popover id="palette">
  <div class="juno-palette" role="listbox" aria-label="Annotation colour">
    <button
      class="juno-palette__option"
      role="option"
      aria-selected="true"
      style="--juno-swatch-color:#1F6FEB"
      aria-label="Azure"
    >
      <svg class="juno-icon juno-palette__check" aria-hidden="true">
        <use href="…#juno-i-check" />
      </svg>
    </button>
  </div>
</div>
```

| Class / prop                  | Effect                                                  |
| ----------------------------- | ------------------------------------------------------- |
| `.juno-swatch`                | The square. Two-tone ring, sized off the control scale. |
| `.juno-swatch--circle`        | Round rather than square.                               |
| `.juno-swatch--sm`            | `space.16` — inline with body text.                     |
| `.juno-swatch--lg`            | `size.tap.comfortable` — a primary trigger.             |
| `.juno-swatch--button`        | Swatch used as a trigger.                               |
| `.juno-swatch--none`          | "No colour" — a slash, not a grey.                      |
| `.juno-palette__option--none` | The same, as a choice in the grid.                      |
| `.juno-palette`               | The grid inside a `.juno-popover`.                      |
| `.juno-palette__option`       | One choice. Selected shows a glyph **and** a ring.      |
| `--juno-swatch-color`         | **The app writes this.**                                |
| `--juno-swatch-size`          | Defaults to `size.tap.min`.                             |
| `--juno-palette-columns`      | Grid width (default `6`).                               |

The app owns the colour list and which one is chosen.

## Colour is never the only signal

junoui's standing rule, and a bare swatch is exactly what violates it.

- **Every swatch carries an accessible name.** `aria-label="Crimson"`, not a bare
  square. A decorative swatch beside its own visible label can be `aria-hidden`,
  but a swatch that _is_ the information needs the name.
- **The checked state is a glyph**, not a hue. "The chosen one looks slightly
  different" is invisible to anyone who cannot separate the two hues — and to
  anyone reading a screenshot. The selected option also grows a ring in the
  active role, so there are two non-colour cues.
- **The check itself sits on an arbitrary colour**, so it gets a light glyph with
  a dark halo — the canvas-ink pair at glyph scale.
- **"No colour" is a slash, not a grey.** A consumer without this paints unset as
  a mid grey and the user cannot tell _grey_ from _none_, which is a different
  thing to know.

`role="listbox"` + `role="option"` + `aria-selected` is the contract for a
single-choice palette. The popover, its trigger and the open/close behaviour are
`.juno-popover`'s — this is the grid that goes inside it.
