---
'@junoput01/junoui': minor
---

**Colour swatch + palette.**

`classes.json` 0.7.0 had no class matching _swatch_ or _color_: no way to show a user-chosen colour or let someone pick one. For diagrams, calendars, tag and label systems, chart series colours, annotation tools, theming UIs and kanban boards.

**The hard part is not the square.** A swatch shows an arbitrary colour, so its border, its focus ring and its checked indicator all have to stay visible against a colour junoui has never seen. The border is a **pair** of hairlines that do different jobs: the inset one composites over the _swatch_ and edges it against its own fill; the outset one composites over the _panel_ and separates it from the surface. With the swatch's own contrast against that panel, the boundary has three ways to be visible and needs only one.

The alphas are measured, not chosen: at 0.45 / 0.35 a mid-grey swatch on a light panel leaves the best of the three at **2.57:1**, under the 3:1 non-text floor. At 0.65 the worst case is 3.39:1. The guard sweeps the swatch colour against both panels and keeps the old values as its control.

**Focus rings sit outside the swatch**, so their contrast is against the panel — a known surface. A ring drawn _on_ the swatch has the same unsolvable problem as the border, and a thicker ring does not fix a hue collision.

**Colour is never the only signal**, which is junoui's own rule and exactly what a bare swatch violates: every swatch carries an accessible name, the checked state is a **glyph** (with a dark halo, since it sits on the arbitrary colour) _plus_ a ring, and `--none` is a slash rather than a grey — a consumer without it paints unset as mid grey and the user cannot tell _grey_ from _none_.

`.juno-palette` is the grid that goes inside an existing `.juno-popover`; the app owns the colour list and the state.
