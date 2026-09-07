# Readability-first & information-density principles

Extends [design-guidelines.md](./design-guidelines.md) and
[painted-ui.md](./painted-ui.md) — it does not replace either. Read those
first; this document exists only for the ground they leave uncovered:
**which content a dense, information-first panel puts first, and how it stays
readable while doing it.**

Target: instrument panels — dashboards, telemetry, control surfaces. Not
marketing pages. A principle derived from a landing-page source is out of
scope here even when well cited.

Every principle below carries three things. A principle missing any of them
does not belong in this file:

1. a citation to an accredited source, document and section named;
2. a testable consequence naming a junoui token or class that exists today
   (verified against `src/css` — `dist/` is a gitignored build output and
   isn't present in a clean checkout, so `tokens/**` stands in for it here);
3. a coverage line — does `design-guidelines.md` or `painted-ui.md` already
   say this? If yes, it is not repeated as a principle in this file; it is
   named in [What this document does not change](#what-this-document-does-not-change)
   instead.

## 1. Priority lives in source order — never in a reorder

**Citation.** W3C WAI, [Understanding Success Criterion 1.3.2: Meaningful
Sequence](https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html)
(WCAG 2.2, Level A): "the meaningful order of content shall be able to be
programmatically determined" — the DOM order **is** the reading order for
assistive tech and for keyboard traversal, whatever the visual order looks
like.

**Consequence.** junoui's composition primitives lay out children in source
order and none of them sets the CSS `order` property or `grid-auto-flow:
dense`:

```
$ grep -n "order:" src/css/layout.css
163:  border-block-end: var(--juno-border-width-1) solid var(--juno-border);   # only "border", no "order"
$ grep -rn "grid-auto-flow" src/css
(no matches)
```

`.juno-stack`, `.juno-cluster`, `.juno-grid-auto`, `.juno-grid-auto--tiles`,
`.juno-switcher`, and `.juno-sidebar` all place their **first child first**,
visually and in the accessibility tree, with no mechanism to fake a different
priority without moving the markup. "Important data shown first" is
therefore a markup decision an app makes when it writes the children of one
of these primitives, not a CSS knob junoui exposes — and a consumer who
reaches for `order` to visually promote something without moving it in the
DOM has broken this contract, not used a feature.

**Coverage.** Not stated in either existing document. `design-guidelines.md`
covers _how_ a promoted item should look (contrast, not scale — see
[What this document does not change](#what-this-document-does-not-change));
it does not say what determines _which_ item comes first. New.

## 2. Truncate the label before you ever consider truncating the value

**Citation.** Material Design 3, Foundations → Writing → [Text
truncation](https://m3.material.io/foundations/writing/text-truncation):
truncated text must still leave the full content reachable somewhere, which
in practice means truncation is a tool for the metadata around a value, not
for the value itself — a truncated number or identifier is data loss, not a
layout convenience. GNOME HIG's
[Typography](https://developer.gnome.org/hig/guidelines/typography.html)
guidance points the same way: ellipsizing (`PANGO_ELLIPSIZE_END`) is a
documented technique for labels that may overflow, never for the datum a
label is attached to.

**Consequence.** junoui already draws this line and the split is checkable.
Secondary/metadata text carries `text-overflow: ellipsis; white-space:
nowrap`:

```
$ grep -rln "text-overflow: ellipsis" src/css/components
components/list.css      (.juno-list__label, .juno-list__support)
components/dock.css      (.juno-dock__label)
components/pillbar.css   (.juno-pillbar__label)
components/tree.css      (.juno-tree row label)
```

The primary-value classes never appear in that list:

```
$ grep -n "juno-value\|juno-readout__value" src/css/utilities.css src/css/components/readout.css
utilities.css:35:.juno-value { ... }                 # no overflow rule
components/readout.css:32:.juno-readout__value { ... } # no overflow rule
```

`.juno-value` and `.juno-readout__value` are sized by `font-size-38` /
`--juno-font-size-*` and left to overflow their box if the container is too
small — by design, there is no ellipsis path for them. A component that
finds its primary datum clipping has an undersized container, which is a
layout bug to fix at the call site, not a case for adding truncation to
`.juno-value`.

**Coverage.** Neither document mentions truncation. `design-guidelines.md`'s
Typography section says numbers are mono + `tabular-nums`; it says nothing
about what happens when a value doesn't fit. New.

## 3. Bound the reading measure for prose; a dense grid is not prose

**Citation.** WCAG 2.2, [Success Criterion 1.4.8: Visual
Presentation](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html)
(Level AAA) — for blocks of text, "width is no more than 80 characters or
glyphs (40 if CJK)". The rationale given is specific to _continuous text_:
long lines cost readers with tracking difficulties their place in the
paragraph. The criterion is explicitly scoped to prose blocks, not to
tabular or label/value data.

**Consequence.** junoui's `.juno-center` (`src/css/layout.css:14-19`) is the
one primitive that caps a region's width, and its default is not a reading
measure:

```
max-width: var(--juno-measure, var(--juno-bp-xl));   /* --juno-bp-xl = 1280px */
```

1280px of B612 body text is far past 80 characters — `--juno-measure`'s
fallback is a page gutter, not a prose bound. For an actual block of prose
inside a panel (a doc page, an empty-state paragraph, a modal body), a
consumer must set `--juno-measure` to a character-based value (e.g. `65ch`)
on the ancestor; `.juno-center` does not do this on its own. Instrument
grids of short labels and numbers are exempt from 1.4.8 by the criterion's
own scope (it names blocks of text, not tabular data) — this bound applies
to prose regions inside a panel, not to the panel's data grid.

**Coverage.** Neither document mentions `.juno-center` or a measure bound.
New.

## 4. Group related fields into meaningful, labelled chunks

**Citation.** Nielsen Norman Group, [How Chunking Helps Content
Processing](https://www.nngroup.com/articles/chunking/): short-term memory
holds a fixed number of _chunks_, not a fixed number of _items_ — "people
could remember 7 individual letters, or 28 letters if they were grouped into
7 four-letter words." The article explicitly warns against the common
misreading that this caps how many items may appear at once; the actionable
rule is to group by meaning, not to enforce an item ceiling.

**Consequence.** `.juno-list__group` (`src/css/components/list.css:44-52`)
already is that boundary — a bordered, radius-cornered, `--juno-s1`
container around one related set of rows — paired with an optional
`.juno-list__header` (line 33) that names the chunk. The principle for a
consumer authoring a long settings or telemetry list is to reach for that
existing pairing — multiple `<section class="juno-list">` blocks, each with
its own header, rather than one `.juno-list__group` holding every row in the
screen undifferentiated. This is a placement rule for existing markup, not a
new primitive: nothing here asks for a row-count cap, since NN/g's own
article rejects that reading.

**Coverage.** `design-guidelines.md`'s "Density is intentional" bullet says
spacing must be deliberate; it does not say how to group rows by meaning.
Not covered. New.

## What this document does not change

Enumerated so the omission is a decision, not an oversight — a version
missing this section is incomplete.

- **Color encodes status** (`design-guidelines.md`, "First principle: color
  encodes status, never decoration") — an appearance judgment. Out of scope
  here by the ticket that produced this file; appearance goes to the
  operator, not to a document a Linux + llvmpipe gate can check.
- **Hierarchy via contrast, not scale** (`design-guidelines.md`, "More
  principles") — also a weight/contrast judgment, same reason.
- **Density is intentional / `data-juno-density`** (`design-guidelines.md`,
  "More principles" and "Density") — the density mechanism itself is
  untouched; §4 above only says how to place existing markup inside it.
- **Typography** (`design-guidelines.md`, "Typography") — mono + tabular
  figures for values, sans for UI text. Assumed, not restated.
- **Date & time** (`design-guidelines.md`, "Date & time") — the house
  format is orthogonal to what this document covers.
- **Foundation tokens** (`design-guidelines.md`, "Foundation tokens (motion,
  layering, depth, opacity)") — untouched.
- **Accessibility specifics already cited** (`design-guidelines.md`,
  "Accessibility") — WCAG 1.4.6, 1.4.1, 2.5.8, 2.5.5, 2.4.7, 2.4.11. This
  document's citations (1.3.2, 1.4.8) are a disjoint set from those; check
  the numbers if auditing for duplication.
- **The three painted-UI rules** (`painted-ui.md`) — a canvas has no DOM, so
  none of the four principles above (all DOM/CSS mechanisms) apply to it.
  Note in particular that painted-ui.md's rule 2 ("does the text fit" as its
  own predicate, `labels_that_clear`) answers a _different_ question — how
  many labels a projected ring can paint before glyphs collide — from §2
  above, which is about which DOM text node gets `text-overflow: ellipsis`.
  The two are easy to conflate because both are called "truncation"; only
  one of them is CSS.

## What this document does not cover, by design

- **Colour, weight and balance judgements.** The project's gate is Linux +
  llvmpipe: rendered frames establish geometry and say nothing about
  appearance. Those decisions go to the operator, not into a principles
  document a build can check.
- **Structure, disclosure and navigation depth.** That is a separate
  workstream (W1b) with its own ticket.
- **Which specific geovista control belongs where.** That is W3, and it
  needs the W2 inventory first — this document is source material for that
  decision, not the decision.

## No token gaps found

Every consequence above cites a class or custom property that exists in
`src/css` today (`.juno-stack`/`.juno-cluster`/`.juno-grid-auto`/
`.juno-switcher`/`.juno-sidebar`, `.juno-value`, `.juno-readout__value`,
`--juno-measure`, `.juno-list__group`, `.juno-list__header`). None of the
four principles needed a token junoui doesn't have, so there is nothing to
file as a separate bug report from this pass.
