# Structure, disclosure & navigation-depth principles

Extends [design-guidelines.md](./design-guidelines.md),
[painted-ui.md](./painted-ui.md) and
[principles-density.md](./principles-density.md) — it does not replace any of
them. Read those first; this document exists only for the ground they leave
uncovered: **how a dense panel is ORGANISED** — what sits at the top level,
what nests, and how deep that nesting is allowed to go. W1a
(`principles-density.md`) answered how a panel reads; this answers how it is
structured.

Target: instrument panels — dashboards, telemetry, control surfaces. Not
marketing pages, same restriction as W1a.

Every principle below carries three things. A principle missing any of them
does not belong in this file:

1. a citation to an accredited source, document and section named, with a URL;
2. a testable consequence naming a junoui token or class that exists today,
   verified against `src/css` (`dist/` is a gitignored build output; a
   consequence naming something junoui does not have is filed under
   [Gaps found](#gaps-found), not written up as a principle);
3. a coverage line against `design-guidelines.md`, `painted-ui.md` **and**
   `principles-density.md` — three documents, not two.

Where a principle states a relationship between two things that must stay in
sync, it is written as a relationship, not as a shared value that happens to
agree today. Two mechanisms landing on the same number by coincidence is a
defect waiting for one of them to change; a relationship that is checked, or
that cannot help but hold because there is only one mechanism, is not.

## 1. Primary navigation is flat; depth lives in content, not in nav

**Citation.** Apple Human Interface Guidelines,
[Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars):
a sidebar "lets people navigate between areas of your app or top-level
collections of content" — one level of top-level areas, not a nested
hierarchy of areas-within-areas. KDE HIG,
[Context Drawer](https://develop.kde.org/hig/components/navigation/contextdrawer/)
draws the matching line from the other side: a `GlobalDrawer` carries
app-wide, action-based navigation between those same top-level areas, while
a `ContextDrawer` carries actions "relevant only to individual items" —
KDE's own guidance keeps item-level structure out of the navigation
component entirely, rather than letting it nest inside one.

**Consequence.** junoui ships primary-navigation and content-organisation as
two separate component families, and the separation is checkable: none of
the nav primitives carry a nesting mechanism.

```
$ grep -n "aria-level\|treeitem\|padding-inline-start" \
    src/css/components/rail.css src/css/components/dock.css \
    src/css/components/dock-responsive.css src/css/components/pillbar.css \
    src/css/components/navbar.css
(no matches)
```

`.juno-rail`, `.juno-dock`, `.juno-pillbar` and `.juno-navbar` are flat by
construction — there is no per-level indent token for any of them, because
none was ever needed. Depth-of-organisation tokens exist exactly once, on
the content-side family: `--juno-tree-indent` (`.juno-tree__group`, §2
below). A consumer who wants a nested menu inside `.juno-rail` is asking for
something junoui does not model; the fix is a `.juno-tree` or
`.juno-accordion` inside the content area, not a deeper rail.

**Coverage.** Not stated in any of the three existing documents.
`painted-ui.md` rule 2 (`wants_compact_nav`) decides a different question —
**which shape** the nav takes (rail vs. dock) at a given viewport — not how
many levels it may have. `principles-density.md` doesn't mention navigation
at all. New.

## 2. Indentation is nesting, expressed structurally — never a tracked number

**Citation.** WAI-ARIA Authoring Practices Guide,
[Tree View Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/):
"Each parent node contains or owns an element with role `group`... contained
in or owned by the node that serves as the parent" — the pattern's only
depth signal is this literal containment, and modern browsers compute
`aria-level` from it automatically. Read in full: **the APG page does not
prescribe any visual indentation at all** — it specifies the accessibility
tree's structure and says nothing about how many pixels a level is worth.
That silence is itself load-bearing for §3.

**Consequence.** junoui does not compute an indent from a depth number; it
lets indentation compound through the same nesting the ARIA structure
requires, so the two cannot disagree — there is only one mechanism, not two
that must be kept in step:

```css
/* src/css/components/tree.css */
.juno-tree__group {
  padding-inline-start: var(--juno-tree-indent); /* applied per nested group */
}
```

The component's own comment states the relationship directly: "Indentation
comes from the nested `role=group` lists the ARIA pattern already requires,
so depth costs no custom property and no inline style." A tree four levels
deep is indented four times not because something computed `4 ×
--juno-tree-indent`, but because there are four nested `.juno-tree__group`
elements, each contributing its own step — the CSS cascade does the
multiplication, so there is no separate "depth" value that a future edit
could drift out of sync with the actual nesting. This is the general form of
the coincidental-agreement failure named at the top of this document,
avoided by construction rather than by test.

**Coverage.** Not stated in any of the three existing documents.
`principles-density.md` §1 is the nearest neighbour and is a different
claim: it says priority among **siblings** is source order (no `order`, no
`grid-auto-flow`); this principle says depth between **ancestor and
descendant** is structural nesting. Sequence and depth are independent axes
— getting sibling order right says nothing about indent, and vice versa.
New.

## 3. A disclosure shares its trigger's depth; only a real child steps in — the geovista answer

**The question.** geovista asked: should a note start where its row's
content starts, or one step inside it? Equivalently: does a panel-level
action sit at the same depth as a per-view action?

**Citation.** WAI-ARIA APG,
[Disclosure (Show/Hide) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/):
"a disclosure... has two elements: a disclosure button and a section of
content whose visibility is controlled by the button." The pattern defines
only a visibility relationship — controlled show/hide of content belonging
to the same subject — and, like the Tree View pattern in §2, does not
require or imply that the revealed content sits at a deeper structural
level than its trigger. That is the same silence noted in §2, and it is
exactly what separates a disclosure from a tree: a tree's nested `group` is
a **different node** one level down; a disclosure's revealed content is
**more of the same node**.

Where the _visual_ alignment is stated explicitly is one level up, in
content-design guidance rather than in ARIA: Apple HIG,
[Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables)
— for the subtitle cell style, "a left-aligned title appears on one line
with a left-aligned subtitle on the next" — both left-aligned, i.e. the same
start, with the subtitle read as more detail about the same row, not a
child row. GNOME HIG,
[Boxed Lists](https://developer.gnome.org/hig/patterns/containers/boxed-lists.html)
agrees from the toolkit side: action, switch and combo rows all pair a
title with a subtitle differentiated by font size and weight, never by
position — GNOME's own follow-on guidance is to "adjust the font size and
weight to differentiate each element," not to indent it.

**Answer.** A note is descriptive content about its row — the same subject,
more detail — not a nested child of it. By both cited sources, it starts
**where its row's content starts**, not one step inside. It earns an
indent step only if it stops being a note and becomes an actual child node
in the structural sense of §2 — something with its own identity, its own
possible children, addressed and traversed separately from the row it sits
under. The test is structural, not visual: ask whether the thing is a
`group` (§2) or a controlled-visibility region of the same node (this
principle) — the answer follows from which one it structurally is, not from
how it looks once placed. A panel-level action is a third case again, and
§4 gives it its own rule rather than folding it in here.

**Consequence.** junoui already draws exactly this line in two components,
checkably:

```
$ grep -n "pad-surface-inline" src/css/components/accordion.css
36:  padding: var(--juno-pad-control-block) var(--juno-pad-surface-inline);   # __summary
70:  padding: var(--juno-space-12) var(--juno-pad-surface-inline) ...;        # __body
```

`.juno-accordion__summary` (the trigger) and `.juno-accordion__body` (the
disclosed content) share the same `--juno-pad-surface-inline` — same start,
by construction, not by two numbers that happen to match. `.juno-list__main`
does the same for label and support text: both are direct children of one
flex column with no per-child `padding-inline-start`, so `.juno-list__label`
and `.juno-list__support` start at the same edge. Contrast `.juno-tree__group`
(§2), which is the one place junoui _does_ add a step — because a tree
child is structurally a different node, not a description of the row above
it.

Bonus alignment, not the basis for the answer: WCAG 2.2
[Success Criterion 2.4.3, Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)
requires that revealed content's focus order match its visual/reading
order. Because junoui's accordion and list keep the note/body adjacent in
the DOM rather than relocating it, this holds for free — there is no
tabindex reordering to keep in sync with the visual placement either.

**Coverage.** Not stated in any of the three existing documents. New — and
this is the principle the geovista ticket is blocked on.

## 4. A panel-level action and a per-view action occupy different depths — never nest one inside the other's container

**Citation.** KDE HIG,
[Context Drawer](https://develop.kde.org/hig/components/navigation/contextdrawer/):
a `GlobalDrawer` carries "action-based navigation" for the whole
application; a `ContextDrawer` carries actions "relevant only to individual
items." The two are documented as separate components with separate
containers — KDE's guidance does not describe a global action ever living
inside an item's own row.

**Consequence.** junoui's app-shell recipe already places the two at
different structural depths, not just different visual styles:

```
$ grep -n "app-shell__topbar\|app-shell__main\|app-shell__body" src/css/layout.css
```

`.juno-app-shell__topbar` is a sibling of `.juno-app-shell__main` inside
`.juno-app-shell__body` (see the usage comment at `layout.css:131-138`) —
structurally outside the scrolling content region entirely. A per-view
action such as `.juno-list__value` or `.juno-tree__trail` is nested many
levels inside that same `__main` region, inside a specific `.juno-list__row`
or `.juno-tree__item`. The two are not merely styled differently; they are
not siblings and were never going to collide, because a panel-level action
has no path in the markup that would put it inside a single row's own
container. The rule for a consumer is: if an action affects the whole
panel, it belongs in `.juno-app-shell__topbar` (or an equivalent
shell-level slot) — never inside a `.juno-list__row`/`.juno-tree__item`
trailing slot on the theory that "it's still visible from there."

**Coverage.** Not stated in any of the three existing documents. New.

## What this document does not change

- **Color encodes status, hierarchy via contrast** (`design-guidelines.md`,
  "First principle" and "More principles") — appearance judgments, out of
  scope here for the same reason as W1a.
- **Z-index / elevation layering** (`design-guidelines.md`, "Foundation
  tokens (motion, layering, depth, opacity)") — this document also uses the
  word "depth" throughout, for a different axis entirely.
  `design-guidelines.md`'s depth is a **paint-order** stack (`surface` <
  `raised` < `anchored` < `overlay` < `alert`, a z-axis question: what
  covers what). This document's depth is **hierarchical nesting** (an
  x/y-axis question: what contains what, and how far in). A modal sits at
  z-index `overlay` regardless of how many tree levels are open behind it;
  the two scales don't interact and this document does not touch the
  z-index one.
- **Readability and density** (`principles-density.md`, all four
  principles) — linked, not restated. In particular, §1 above is deliberately
  a different claim from that document's §1 (sibling order vs. ancestor
  depth — spelled out in §2's coverage line).
- **The three painted-UI rules** (`painted-ui.md`) — a canvas has no DOM, so
  the structural claims here (which are all about nesting containers) don't
  apply to it. Rule 2's `wants_compact_nav` decides nav **shape** per
  viewport, which §1 above explicitly does not restate or override.
- **Which specific geovista control belongs at which depth.** §3 gives
  geovista the rule and the answer for the note question specifically; it
  does not enumerate geovista's other controls. That is W3, once the W2
  inventory exists.

## What this document does not cover, by design

- **Colour, weight and balance.** The gate here is Linux + llvmpipe:
  rendered frames establish geometry, not appearance. Those judgments go to
  the operator.
- **Resize and overflow behaviour.** That is W6.
- **Readability and density.** That is W1a, already landed — linked above,
  not restated.

## Gaps found

None. Every consequence above cites a class, custom property, or file/line
that exists in `src/css` today (`--juno-tree-indent`,
`.juno-tree__group`/`__item`, `.juno-accordion__summary`/`__body`,
`.juno-list__main`/`__label`/`__support`/`__value`,
`.juno-app-shell__topbar`/`__main`/`__body`, `.juno-tree__trail`, and the
absence of any indent mechanism in `.juno-rail`/`.juno-dock`/
`.juno-pillbar`/`.juno-navbar`). Nothing here needed a token junoui lacks.
