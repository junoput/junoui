# Sidebar behaviour specification

Extends [principles-density.md](./principles-density.md) (W1a),
[principles-structure.md](./principles-structure.md) (W1b) and
[inventory-elements.md](./inventory-elements.md) (W2a) — it does not
re-derive any of them. Read those first. This document answers the question
none of the three could: **given a specific composition of junoui
primitives — `.juno-sidebar` + `.juno-rail`/`.juno-dock`/`.juno-pillbar` +
`.juno-list`/`.juno-tree`/`.juno-accordion` + `.juno-splitter` +
`.juno-menu`/`.juno-popover` — how does it behave as width and height
change, and what keeps its parts in agreement with each other while it
does?**

## The complaint this exists to answer

The operator, verbatim: _"define how the sidebar should work and work on
each element individually... keeping in mind resizing, what should be
shown..., the behaviour of these elements, and how they should interact.
Everything should feel like a modular system that works unified under the
same design principles."_ And underneath it: text overflows; lines feel
random; resizing shifts and breaks everything; **many elements are linked
but act as if they were separate**; buttons are in the wrong places.

That last sentence is a systems complaint, not a styling one, so every rule
below is written as a **relationship that must hold**, not a value that
happens to hold today. Where junoui has no mechanism to make a relationship
structural — where it can only be true by two independently authored things
agreeing — that is recorded as a **gap** in its own section, not smoothed
over as a rule someone has to remember.

Scope: junoui's sidebar **contract** — which of its own primitives compose
into a sidebar, and how they must behave together. Not geovista's specific
menu structure (that is a separate application of this contract), not
appearance, not implementation. No CSS changes ship with this document.

## Verification note, read before trusting any row cited below

[inventory-elements.md](./inventory-elements.md)'s **summary** (the
fixed/free/ambiguous slot-order tally) is guarded by
`test/inventory-elements.test.mjs`, which fails when the prose drifts from
the per-component rows. Its **per-component detail — token lists, state
hooks, density flags, responsive mechanism — is not guarded by anything**;
across that census's three review rounds, nobody checked a row's content
against the CSS it claims to describe, only the summary against the rows.

Every census row this document leans on was re-checked against `src/css`
directly in writing it, not inherited from the census unverified. The
[Verification log](#verification-log-of-census-rows-relied-on) section
names exactly which rows, what was checked, and the grep/line evidence for
each — several of them turned up **more** than the census's one-line summary
says, which is exactly the kind of thing an unguarded field misses silently.

## 1. What is shown at top level, what nests, and what moves off-panel

**The rule is a decision procedure, applicable to any new element without
asking anyone**, not a list of what geovista happens to have today. For a
candidate element, ask the questions in order and stop at the first "yes":

1. **Is it needed to orient the user regardless of scroll position or
   selection** (the panel's own identity, a persistent search/filter, a
   panel-wide action)? → **Top-level chrome.** Per
   [principles-structure.md §4](./principles-structure.md#4-a-panel-level-action-and-a-per-view-action-occupy-different-depths--never-nest-one-inside-the-others-container),
   this lives structurally outside the scrolling region
   (`.juno-app-shell__topbar`, or `.juno-rail__brand` for identity) — never
   inside a row's own trailing slot "because it's still visible from
   there."
2. **Is it more detail about one specific row — the same subject, not a
   different one** (a subtitle, a byte count, a last-modified stamp)? →
   **Same depth as that row.** Per
   [principles-structure.md §3](./principles-structure.md#3-a-disclosure-shares-its-triggers-depth-only-a-real-child-steps-in--the-geovista-answer),
   it starts where the row's content starts (`.juno-list__support`,
   `.juno-tree__count`) — it does **not** earn an indent step for being
   "extra".
3. **Does it have its own identity and possible children, addressed and
   traversed separately from the row above it** (a folder, a layer group, a
   nested collection)? → **A structural child, one step in.** Per
   [principles-structure.md §2](./principles-structure.md#2-indentation-is-nesting-expressed-structurally--never-a-tracked-number),
   this is a `.juno-tree__group`, and the indent is a consequence of that
   nesting, never a level number set by hand.
4. **Does it need more space than a row can give it** — its own scroll
   region, its own set of controls, its own back-navigation? → **A detail
   page**, reached by navigating away from the sidebar, not by nesting
   further inside it. The sidebar's job stops at the row that links to it.
5. **Is it an action relevant to one row, needed rarely enough that showing
   it permanently would crowd every other row** (rename, delete, "reveal in
   Finder")? → **A menu item**, in that row's trailing slot
   (`.juno-list__value`/`.juno-tree__trail` position — §1's "Fixed" verdict
   in the census, confirmed below), disclosed through `.juno-menu` (native
   Popover API, top layer — see §4). It is not permanent chrome and it does
   not get its own top-level button.
6. **None of the above** — it does not belong in the sidebar. Off-panel
   entirely (a modal, a different screen).

A component that fails all five "yes" branches is content, not sidebar
furniture, and belongs in the main region, not the aside.

**Corollary that follows directly from step 1 and
[principles-density.md §1](./principles-density.md#1-priority-lives-in-source-order--never-in-a-reorder):**
"important" cannot mean "visually promoted while staying later in the
markup" — junoui's composition primitives place the first child first, with
no `order` escape hatch (verified again for this document: `grep -rn
"order:" src/css/layout.css` still returns only the `border-block-end`
false match W1a already noted, and the same grep against every sidebar
component file below returns nothing). An element that is genuinely
top-priority must be the first child of its container, not a later child
styled to look first.

## 2. The resize ladder

Rungs are listed in the order a sidebar actually experiences them as its
own width (not the window's) shrinks, in the same "container width, not
viewport width" framing [principles-density.md](./principles-density.md)
already assumes for `.juno-card`. Each rung names **which existing
mechanism** fires it —
container query, viewport media query, a pointer-aware media query, or none
(continuous CSS with no threshold at all) — because the ticket's exact
question, "does this respond to the sidebar's own width or the window's,"
has three different correct answers among the components below, and
conflating them is how a component that looks resize-aware in isolation
turns out not to react to the one resize that matters.

### Audit against 20260908-028, before changing anything

Every rung below was re-verified against the current CSS, not carried over
from the last edit of this table:

| Rung                          | Status                             | Evidence                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — full width                | Exists (base state)                | No code needed.                                                                                                                                                                                                                                                                                                                                                                          |
| 1 — row content overflows     | **Exists**                         | `list.css` (`__label`/`__support`) and `tree.css` (`__label`) both carry `text-overflow: ellipsis`.                                                                                                                                                                                                                                                                                      |
| 2 — card row narrows          | **Exists**                         | `src/css/components/card.css:24`, `@container (max-width: 320px)`.                                                                                                                                                                                                                                                                                                                       |
| — whole composition wraps     | **Exists, undocumented**           | `src/css/layout.css:55-100` — see the new rung below. Landed before this ticket; this table never named it.                                                                                                                                                                                                                                                                              |
| 3 — rail auto-collapse        | **Exists**                         | `rail.css` — `container-type: inline-size` + `@container (max-width: 57px)` (20260908-005).                                                                                                                                                                                                                                                                                              |
| 4 — splitter-adjustable pane  | Exists (app-owned)                 | `splitter.css:9-17`, unchanged.                                                                                                                                                                                                                                                                                                                                                          |
| 5 — coarse-pointer phone swap | **Exists**                         | `rail.css:187` / `dock-responsive.css` / `pillbar.css:206`, asserted equal by `test/pointer-first.test.mjs`.                                                                                                                                                                                                                                                                             |
| List/tree row fallback        | **Exists — partially**             | `list.css`/`tree.css` now carry `container-type: inline-size` + a derived `@container` rung each (20260908-034): chevron drops in list, the count badge drops in tree. `__value`/`__trail` (the protected/possibly-interactive elements) are untouched — see below for what's still open.                                                                                                |
| Height pressure               | **No rung — has a recipe instead** | No `@container`/`@media` keys on block-size anywhere sidebar-specific. `.juno-scroller` already solves it; documented as a recipe below, not new CSS.                                                                                                                                                                                                                                    |
| Below the rail's own floor    | **Exists (20260908-036)**          | `rail.css` — `.juno-rail:not(.juno-rail--collapsed) { inline-size: max(var(--juno-rail-width), 57px) }`, the same 57px derivation as the auto-collapse threshold (`scripts/rail-collapse-derivation.mjs`, shared). One-sided (`max()`), so a larger consumer request still resolves unchanged; scoped off `.juno-rail--collapsed` so its own smaller, already-correct 56px is untouched. |

Two things closed this table's gap between spec and CSS without touching
`rail.css`: naming the whole-composition wrap as a rung (below), and the
height-pressure recipe. The remaining two findings need coordination and
are reported, not built, in this PR.

| Rung                                                             | What changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Mechanism                                     | Verified                                                               |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------- |
| 0 — full width                                                   | Baseline: `.juno-rail` full labels, `.juno-list`/`.juno-tree` rows show icon + label + support + value/count + chevron/trail in full.                                                                                                                                                                                                                                                                                                                                                                                                                                       | — (base state)                                | —                                                                      |
| 1 — row content starts to overflow                               | `.juno-list__label`, `.juno-list__support`, `.juno-tree__label` ellipsis via `text-overflow: ellipsis; white-space: nowrap`. This is **continuous**, not a breakpoint — it activates the instant a row's own content overflows its box, at any width, with no threshold to name.                                                                                                                                                                                                                                                                                            | None — plain CSS text overflow, always active | Yes, see log                                                           |
| 2 — a card-shaped block inside the sidebar runs out of row width | `.juno-card__row` flips `flex-direction: column` under `@container (max-width: 320px)`, scoped to the card's own `container-type: inline-size` — reacts to the sidebar's width, not the window's.                                                                                                                                                                                                                                                                                                                                                                           | **Container query**                           | Yes, see log                                                           |
| 3 — the rail runs out of room for icon + label                   | `.juno-rail` collapses to icon-only (same treatment as `.juno-rail--collapsed`) at a derived `@container (max-width: 57px)` threshold, or the app can still force it earlier with the class. **This used to be app-applied only, with no threshold junoui fired on its own — closed by [Gap 1](#gap-1-the-rail-collapses-on-a-modifier-class-nothing-ties-it-to-the-sidebars-own-width--closed-20260908-005).**                                                                                                                                                             | **Container query**, derived threshold        | Yes, see log                                                           |
| 4 — the whole composition stops fitting side by side             | `.juno-sidebar` (`flex-wrap: wrap`) stacks the aside above `.juno-sidebar__main` once the available width can no longer hold the aside's reserved `--juno-sidebar-width` alongside main's `min-inline-size: var(--juno-sidebar-content-min, 60%)`. **No breakpoint number exists for this rung at all** — an even stronger form of "assert the relationship, not the value": it is pure flex arithmetic, so there is nothing that could drift out of sync with a retuned token. Existed before this ticket (`src/css/layout.css:55-100`); this table simply never named it. | None — intrinsic flex-wrap, continuous        | Yes, see [`test/sidebar-wrap.test.mjs`](../test/sidebar-wrap.test.mjs) |
| 5 — sidebar becomes a splitter-adjustable pane                   | `.juno-splitter` supplies the drag handle, hit area and ARIA contract only; **the app owns the width number and the arithmetic**, by the component's own stated design (`"junoui ships NO resize state machine here: no pointer capture, no width arithmetic... The app owns the number."`, `src/css/components/splitter.css:9-17`). Nothing here is a rung junoui fires; it is the mechanism an app uses to let a person set rung boundaries by hand.                                                                                                                      | None — app-owned                              | Yes, see log                                                           |
| 6 — the coarse-pointer, phone-shaped case                        | `.juno-rail--responsive` hides and (paired) `.juno-dock--responsive`/`.juno-pillbar--responsive` show, under the identical `(pointer: coarse) and ((width <= 767.98px) or (height <= 500px))` condition asserted equal in three places by `test/pointer-first.test.mjs`. **This is pointer- and viewport-driven, not the sidebar's own container width** — a wide sidebar on a narrow phone and a narrow sidebar on a wide desktop are different states this rung does not distinguish, by design (it answers "is this a phone," not "is this pane narrow").                | **Viewport media query, pointer-gated**       | Yes, see log                                                           |

### Height pressure — a recipe, not a missing rung

Confirmed nothing sidebar-specific keys on block-size: no `@container`
querying `block-size`/`height`, no `@media (height: ...)` outside rung 6's
pointer-gated condition (which answers "is this a phone," not "does this
pane have room"). A `.juno-rail` or a tall `.juno-list`/`.juno-tree` in a
short viewport has no default vertical scroll — it can grow past its
container.

**Not treated as a missing rung**, because junoui already ships the
primitive that answers it — `.juno-scroller` (`src/css/layout.css`, "bare
scroll-container primitive... `--x`/`--y` pick a single scroll axis") — and
per [CHARTER.md](./CHARTER.md)'s own test, whether a tall aside should
scroll independently of `.juno-sidebar__main` or move together with it is a
**layout decision the consumer makes**, not a quantity junoui can see: some
products want a pinned nav with its own scroll, some want the whole panel
to move together. Recipe: wrap the aside's content in
`.juno-scroller.juno-scroller--y` when independent scroll is wanted. This
was a documentation gap, closed by this paragraph — no CSS gap, no new
class, no rung number.

**Rungs junoui cannot currently express**, stated as gaps rather than
rounded away:

- ~~No container-query rung exists for `.juno-list`/`.juno-tree` rows at
  all~~ — **partially closed by 20260908-034**. `list.css`/`tree.css` now
  carry `container-type: inline-size` and one derived `@container` rung
  each: `.juno-list__row` drops `__chevron` below `88.25px` (2× row
  padding + icon + chevron's own fixed size + the two gaps around
  `__main` — all tokens, no typed-in pixel), `.juno-tree__row` drops
  `__count` below `64.25px` (the same shape: padding + caret + icon +
  gaps). Both are pure decoration, dropped per
  `principles-density.md §2` ("truncate the label before you ever
  consider truncating the value") — `__value` (list) and `__trail` (tree,
  may hold a live control) are never touched by either rung.
  **`menu.css`, `accordion.css`, `navbar.css` and `popover.css` are still
  untouched** — not sidebar row types this ticket's audit named, left as
  a genuinely open item.
  **Stated limitation, not silently absorbed:** both floors deliberately
  exclude `__value`'s/`__count`'s own rendered width, which is arbitrary
  app content no CSS token can predict — the same reason a container
  query cannot see a sibling's text width at all. They are lower bounds:
  a row that also carries a `__value`/`__count` starves its label at some
  _wider_ container width than these rungs fire at, which is
  undecidable from CSS alone without measuring that content — reported,
  not solved further.
- ~~No rung ties `.juno-rail--collapsed` to a measured width at all~~ —
  **closed by 20260908-005**; see Gap 1 below.
- ~~Below the rail's own collapsed floor, nothing clamps the width at
  all~~ — **closed by 20260908-036**. `.juno-rail:not(.juno-rail--collapsed)`
  now floors `inline-size` at `max(var(--juno-rail-width), 57px)` — the
  same 57px derivation as the auto-collapse threshold, shared via
  `scripts/rail-collapse-derivation.mjs` rather than re-derived. Because
  the clamp reads `--juno-rail-width` at the point `.juno-rail` consumes
  it, this also covers the Post-20260908-001 composed case (a rail
  reading `--juno-sidebar-width` through the aside): whatever
  `--juno-rail-width` ultimately resolves to, the rail's own box still
  won't render narrower than 57px. **Not established**: whether the
  ANCESTOR `.juno-sidebar__aside` flex item can still be squeezed
  narrower than the rail's floor by ordinary flex-shrink (which would
  clip the rail via the aside's own overflow, a different failure mode
  from the icon overflowing unclipped) — that is a `layout.css` question,
  outside `rail.css`'s file scope and this ticket's.

## 3. Interaction model, states, and focus order

Per element class, not per pixel — and per
[principles-density.md §1](./principles-density.md#1-priority-lives-in-source-order--never-in-a-reorder),
**focus order is DOM order**; nothing in this section may be satisfied by
moving an element visually while leaving it later in the markup, and no
component below sets `tabindex` on anything but the -1 sentinels named
explicitly.

- **`.juno-rail__item` / `.juno-list__row` (anchor or button) / one flat
  action.** States: `:hover`, `:focus-visible` (own ring, `outline:
var(--juno-border-width-2) solid var(--juno-active)`), `[aria-current]`
  (which page), `:disabled`/`opacity: var(--juno-opacity-disabled)` on
  `.juno-list__row` only — rail has no disabled state in the CSS (checked;
  see log). Focus order: DOM order, one tab stop per interactive row, no
  roving tabindex needed because there is no internal composite structure.
- **`.juno-tree__item`.** Three states junoui keeps visually and
  structurally distinct, quoting the component's own comment: _"hover is
  where the pointer is, aria-current is which page you are on,
  aria-selected is what the next action will apply to."_ **These three are
  deliberately independent and must stay that way** — this is the one place
  in this document where the rule is "do not synchronize," not "keep in
  sync": a layer stack can have a hovered row, a current row and a selected
  row that are three different rows at once, and forcing them to agree
  would be the bug, not the fix. Focus order: `.juno-tree` requires a
  **roving tabindex** (one `treeitem` in the tab sequence at a time, arrow
  keys move it) per the WAI-ARIA APG Tree View pattern already cited in
  `principles-structure.md §2` — junoui ships the CSS and ARIA slots only;
  the roving-tabindex behavior itself is either the app's own code or the
  stateless enhancer at `junoui/tree` (`tools/tree.mjs`). **A tree with
  neither is a list of buttons wearing tree roles**, in the component file's
  own words — this document does not relax that.
- **`.juno-accordion__item` (native `<details>`/`<summary>`).** States:
  `[open]`, `:hover` on the summary. Focus order and keyboard behavior are
  the browser's native disclosure semantics — zero JS, zero ARIA
  authored by junoui, because `<details>`/`<summary>` already has both.
- **`.juno-splitter`.** States: `:hover`, `:focus-visible`,
  `[data-juno-dragging]`, `[aria-valuenow='0']` (collapsed — the handle
  stays reachable, per the file's own comment, "it is the only way back").
  Focus order: one tab stop, arrow-key resize is the app's responsibility
  (junoui ships `role="separator"` + `aria-valuenow`/`min`/`max`, not the
  keydown handler).
- **`.juno-menu__item` / popover-disclosed actions.** States: native
  `:popover-open`, `[aria-haspopup]`/`[aria-expanded]` on the trigger
  (app-set). Focus order: the trigger is one tab stop; the open menu lives
  in the top layer via the native Popover API, so it is never clipped and
  never needs manual z-index — but **the app owns moving focus into the
  menu and back to the trigger on close**; junoui ships no focus trap
  (Hard rule 4 — no stateful widgets).

## 4. How linked elements stay linked

For each pair/set that must agree, the relationship, whether junoui makes
it structural or leaves it to authoring discipline, and — where it is only
authoring discipline — how that could be asserted.

### Working today — structural, not coincidental

- **Rail ↔ dock/pillbar, exhaustively.** Exactly one of `.juno-rail`,
  `.juno-dock`, `.juno-pillbar` shows at any given viewport/pointer
  combination. The relationship is not two components independently tuned
  to agree — it is **one condition**, `(pointer: coarse) and ((width <=
767.98px) or (height <= 500px))`, asserted identical in three places
  (the CSS literal in `rail.css`, the emitted `@custom-media
--juno-compact-nav` in `dist/css/juno-custom-media.css`, and the
  `COMPACT_NAV` export in `tools/pointer.mjs`) by
  `test/pointer-first.test.mjs`'s `'the CSS literal, the custom media and
the JS string are one condition'` test. This is the answer to "how could
  a linkage be asserted": **a test that fails when the strings diverge**,
  which is exactly what this document's own headline-drift bug (20260906-054)
  needed and initially lacked.
- **Tree caret rotation ↔ item's `[aria-expanded]`.** One CSS rule,
  `.juno-tree__item[aria-expanded='true'] > .juno-tree__row > .juno-tree__caret { transform: rotate(90deg); }`,
  reads the ancestor's
  own attribute. There is no second "is the caret rotated" value anywhere
  to drift out of sync with the app-set attribute — same structural pattern
  `principles-structure.md §2` already names for indentation.
- **`.juno-tree__count` ↔ `.juno-tree__trail` spacing.** The rule
  `.juno-tree__count + .juno-tree__trail { margin-inline-start: 0; }`
  conditions the trail's margin on the count's presence via a sibling
  combinator, not two independently authored numbers. A row with only a
  trail, or only a count, or both, lays out correctly with no per-row
  decision.
- **Row slot order (icon → main(label, support) → value/count → chevron/trail).**
  Fixed by normal-flow layout with no `order` override, in both
  `.juno-list__row` and `.juno-tree__row` — verified directly against
  `list.css`/`tree.css` for this document (see log), matching the census's
  `fixed` slot-order verdict for both.

### Gaps — where the linkage is only authoring discipline today

#### Gap 1: the rail collapses on a modifier class; nothing ties it to the sidebar's own width — CLOSED (20260908-005)

`rail.css` ships the **visual result** of collapse
(`.juno-rail--collapsed`, `--juno-rail-width: var(--juno-space-56)`,
labels hidden) but **no mechanism decides when to apply it**. There is no
`@container` rule anywhere in `rail.css` (confirmed — see log) keying the
collapse to the rail's own available width; the class is purely
app-toggled. Two consumers of the same `.juno-sidebar` composition can
therefore pick two different width thresholds for "collapse the rail" —
or one consumer can forget to wire a threshold at all, leaving the rail
permanently expanded in a pane too narrow for it — and nothing in junoui
would notice either way. This is the operator's complaint in miniature:
the rail and the space it's given are linked in intent and separate in
mechanism.

**Closed by ticket 20260908-005.** `.juno-rail` now opts into container
queries (`container-type: inline-size`) and a `@container (max-width:
57px)` rule applies the same icon-only treatment `.juno-rail--collapsed`
applies by hand, whenever the rail's own measured width drops below that
floor — including when it's composed inside a resizable `.juno-sidebar__aside`
(Gap 2). **57px is derived, not chosen**: `.juno-rail__label` gained the
`text-overflow: ellipsis` truncation it was missing (every other icon+label
row in junoui already had it), which removes any "minimum label width" term
from the derivation — the floor is purely the item's own inline padding (2 ×
`--juno-space-16`), its `border-inline-start` (`--juno-border-width-2`), the
icon at `1.25em` of `--juno-font-size-12`, and one `--juno-gap-control`
(comfortable density) = 57px. `test/rail-collapse-threshold.test.mjs`
recomputes this from the built token values and asserts it against the CSS
literal, mutation-tested both by moving the literal off the derived value
and by removing the `container-type` declaration — both turned the
relevant test red; reverted, green again. The compact-density exact floor
(53px) is documented but not separately implemented — see the reasoning
in `rail.css`'s own comment and `docs/components/rail.md`, which also
records the authoring-contract change: an item's `aria-label`/`title` must
now be unconditional, since collapse can happen without the app ever
toggling the class.

#### Gap 2: `--juno-rail-width` and `--juno-sidebar-width` are two independently defaulted numbers, not one — CLOSED (20260908-001)

Found while verifying rail's row for this document, not inherited from the
census (which does not cross-reference components against each other at
all). `.juno-sidebar > .juno-sidebar__aside` reserved `flex-basis:
var(--juno-sidebar-width, 280px)` (`src/css/layout.css:63`); `.juno-rail`
separately set its own `inline-size: var(--juno-rail-width, 180px)`
(`src/css/components/rail.css:19,24`). **A `.juno-rail` composed as the
content of a `.juno-sidebar__aside` — exactly the composition this ticket
specifies — had two unrelated default widths active at once: the aside
reserved 280px of flex-basis, the rail painted itself at 180px.** Nothing
connected them; each defaulted independently and each could be overridden
independently, so agreement was coincidental in exactly the sense this
document's own opening paragraph defines the complaint by.

**Closed by ticket 20260908-001** (opened option A of the two named above —
one variable, two consumers — over option B, matching the ticket's own
reasoning: "when two things must agree, prefer removing the second thing
over asserting the agreement"). `.juno-sidebar > .juno-sidebar__aside` now
declares `--juno-sidebar-width: 280px` as a real value rather than only a
`var()` fallback, and a new composition rule,
`.juno-sidebar__aside > .juno-rail:not(.juno-rail--collapsed) {
--juno-rail-width: var(--juno-sidebar-width, 280px); }`, makes a rail
composed inside a sidebar aside read that same variable — one number, not
two, in the documented composition. The `:not(.juno-rail--collapsed)`
exclusion keeps collapse (the deeper, deliberate override) winning
regardless of composition. A bare `.juno-rail` outside `.juno-sidebar`
keeps its own 180px default, unaffected. Asserted by
`test/sidebar-rail-width.test.mjs`, which checks the relationship (the
composed rule references `--juno-sidebar-width`, not a literal) rather
than a specific pixel value, and was mutation-tested both ways: reverting
the composed rule's value to a literal `180px`, and separately drifting
just its defensive fallback to `320px` while leaving the aside at `280px`,
each turned the relevant test red; restoring turned it green again.

#### Gap 3: an id-matched control and the thing it controls can drift silently, and junoui has this pattern twice

`.juno-field__label`'s `for="cs"` must match its control's `id="cs"`
(native HTML, `field.css`'s own usage comment); a menu/popover trigger's
`popovertarget="acts"` must match its target's `id="acts"` (native Popover
API, `menu.css`'s own usage comment). Both are real, working browser
mechanisms — but both are **two independently hand-authored strings**, not
one value referenced twice, so a rename on one side and not the other
breaks the link with no warning from CSS, HTML validation, or (in most
apps) a test. This is not a junoui defect — the label/control and
trigger/target pairing is how HTML and the Popover API are specified to
work — but a sidebar spec whose whole second half is about coincidental
agreement should name the two places this exact shape already exists
inside junoui's own usage examples, so an app author reaches for a
generated/shared id rather than two literals when wiring a sidebar's
disclosure menus.

#### Declared, not discovered: the splitter

`splitter.css` already states its own boundary in its header comment,
quoted rather than re-derived: _"junoui ships NO resize state machine
here: no pointer capture, no width arithmetic, no persistence, no collapse
policy... The app owns the number."_ This document treats that as a
standing gap rather than re-opening it — the ARIA contract and hit area
are structural (§3); the actual pane-width ↔ handle-position relationship
is, by explicit design, entirely the app's to keep in sync.

## What this document does not change

- **`design-guidelines.md`, `painted-ui.md`, `principles-density.md`,
  `principles-structure.md`** — linked throughout, not restated. In
  particular, this document does not re-answer the note-indent question
  (§1 above cites `principles-structure.md §3` directly) or re-derive the
  source-order/priority rule (`principles-density.md §1`).
- **`inventory-elements.md`'s summary or slot-order verdicts** — cited,
  not re-measured. Its per-component detail is treated as unverified by
  default; this document only relies on the rows named in the
  [verification log](#verification-log-of-census-rows-relied-on), each
  checked here for the first time.
- **The pointer-first rail↔dock condition itself** (`tools/pointer.mjs`,
  `test/pointer-first.test.mjs`) — cited as the working example of an
  asserted linkage, not modified.

## What this document does not cover, by design

- **Appearance** — colour, weight, balance. The gate is Linux + llvmpipe:
  geometry only. Those decisions go to the operator.
- **Per-element visual design passes** — W7, after this.
- **The databar** (`.juno-readout`) — separate, under W6.
- **Implementation.** No CSS ships with this document; the gaps above are
  named, not fixed.
- **geovista's own layout decisions.** This is junoui's sidebar contract;
  geovista applies it to its own specific panels and controls.

## Gaps found

Populated, not empty, per the ticket's own standard that an empty gaps
section on a first spec would be a claim worth checking rather than
believing:

1. **No container-query rung existed for `.juno-list`/`.juno-tree` rows**
   (§2) — the mechanism `.juno-card__row` demonstrates. **Partially closed
   by 20260908-034**: both rows now drop their purely-decorative part
   (chevron / count) at a derived floor; `__value`/`__trail` stay
   protected, and the floors are stated lower bounds that don't account
   for those elements' own arbitrary content width.
2. **`.juno-rail--collapsed` had no width-driven trigger** (§4, Gap 1) —
   collapse was an app-toggled class with no container query behind it.
   **Closed by 20260908-005**: a `@container` rule now applies the same
   treatment at a derived 57px floor.
3. **`--juno-rail-width` (180px) and `--juno-sidebar-width` (280px) were
   two independently defaulted custom properties**, not one (§4, Gap 2) —
   discovered by cross-referencing `rail.css` against `layout.css` for
   this document, not present in the census. **Closed by 20260908-001**: a
   rail composed inside a sidebar aside now reads the aside's own
   `--juno-sidebar-width`.
4. **id-matched control/target pairs (`for`/`id`, `popovertarget`/`id`)
   are two hand-authored strings, not one value referenced twice** (§4,
   Gap 3) — a native-platform pattern junoui's own usage examples use
   twice, named so a sidebar composition doesn't inherit the drift risk
   silently.
5. **The splitter's pane-width relationship is app-owned by explicit,
   declared design** (§4) — not a defect, but restated here because it is
   the same shape of gap as the other four and this document should not
   let a component's own honesty about its limits go uncounted just
   because it was already written down.
6. ~~Below the rail's own collapsed floor, nothing clamps
   `--juno-rail-width`/`--juno-sidebar-width`~~ (§2) — **closed by
   20260908-036**: `.juno-rail:not(.juno-rail--collapsed)` floors
   `inline-size` at `max(var(--juno-rail-width), 57px)`, the same
   derivation as the collapse threshold, reused via
   `scripts/rail-collapse-derivation.mjs` rather than re-derived. One
   open question this fix did not settle: see
   [What I could not establish](#what-i-could-not-establish).

## What I could not establish

- **A NEW, narrower gap this fix's own read of `layout.css` surfaced —
  reported, not fixed, same as this document's own habit.**
  `20260908-036`'s clamp guarantees `.juno-rail`'s own box wants at least
  57px; it does not guarantee the ANCESTOR gets to honour that. Checked,
  not assumed: `.juno-sidebar > .juno-sidebar__aside` (`layout.css:66-71`)
  sets `flex-grow: 1` and `flex-basis: var(--juno-sidebar-width)` with no
  `flex-shrink: 0` and no `min-inline-size` — so ordinary flex-shrink can
  still squeeze the aside narrower than the rail's 57px floor when
  `.juno-sidebar__main`'s own `flex-grow: 999` wins the contest for space.
  A rail whose OWN inline-size still wants 57px, inside an aside rendered
  narrower than that, either overflows the aside (no `overflow` set on
  `.juno-sidebar__aside` either) or gets clipped by whatever ancestor
  does have one — a different failure mode from "the icon overflows its
  own unclipped box" this ticket closed, but the same root shape: a
  measured value with nothing enforcing its floor. Fixing it means
  `layout.css`, not `rail.css`, and is outside `20260908-036`'s stated
  file scope — filed as `20260908-040` rather than folded in here
  speculatively.
- **A `.juno-list`/`.juno-tree` row fallback between rung 1 and rung 3.**
  Named since W3, not among 20260908-028's candidates, and it is a design
  decision (what a hidden trailing slot falls back to) rather than a
  mechanical one — left for the W5 resequencing decision this document
  already deferred it to.
- **Whether the wrap-stack rung (new rung 4) is what geovista specifically
  wants for its own sidebar.** This document specifies junoui's contract;
  it does not audit geovista's consumption of it. The rung exists and is
  now tested; whether geovista's own composition relies on it (or
  overrides `--juno-sidebar-content-min` to opt out) is outside this
  ticket's reach from here.

## Verification log of census rows relied on

Per the ticket's warning that the census's per-component detail is
unguarded, every row this document cites was re-checked against `src/css`
directly while writing it — not carried over from the census's prose
unverified. Command and result for each:

| Component                                | Claim relied on                                             | Check run                                                                         | Result                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `card`                                   | Container query, `@container (max-width: 320px)`            | `grep -n "@container" src/css/components/card.css`                                | `24:@container (max-width: 320px) {` — confirmed; flips `.juno-card__row` to `flex-direction: column` only, nothing else                                                                                                                                                                                                               |
| `table`                                  | Both container and viewport media queries                   | `grep -n "@media\|@container" src/css/components/table.css`                       | Three hits: `@media (hover: none)` (212), `@media (prefers-reduced-motion: reduce)` (377), `@container (max-width: 480px)` (396) — census's "both" verdict confirmed, and neither `@media` hit is a resize breakpoint (touch/motion preferences only), which the census's own three-value column can't distinguish                     |
| `rail`                                   | Viewport media query; density via `--juno-gap-control`      | `grep -n "@media\|juno-gap-control\|juno-rail-width" src/css/components/rail.css` | One `@media (pointer: coarse) and ((width <= 767.98px) or (height <= 500px))` at line 117 (the pointer-first rail↔dock swap, not a layout breakpoint); `--juno-gap-control` used at lines 35, 50 confirming density; `--juno-rail-width` defaults to `180px` at line 19                                                                |
| `dock`                                   | Viewport media query                                        | `grep -n "@media" src/css/components/dock.css`                                    | Both hits are `@media (prefers-reduced-transparency: reduce)` (255, 304) — **the census's "viewport media query" label for `dock` is technically correct but misleading for a resize document**: `dock.css` itself has no width-driven rule at all; the rail↔dock swap logic lives entirely in the separate `dock-responsive.css` file |
| `dock-responsive`                        | Viewport media query (the rail↔dock pairing)                | `grep -n "@media" src/css/components/dock-responsive.css`                         | One hit, the exact inverse condition of `rail.css`'s, confirmed by `test/pointer-first.test.mjs`                                                                                                                                                                                                                                       |
| `pillbar`                                | Viewport media query; `:has()` for free slot order          | `grep -n "@media\|:has(" src/css/components/pillbar.css`                          | `@media not (...)` at 206 (same compact-nav condition), `@media (prefers-reduced-transparency: reduce)` at 362, `:has()` confirmed for the collapsible tray                                                                                                                                                                            |
| `list`                                   | No responsive mechanism at all                              | `grep -n "@media\|@container" src/css/components/list.css`                        | No matches — confirmed `neither`; also confirms Gap 1                                                                                                                                                                                                                                                                                  |
| `tree`                                   | Viewport media query (touch target sizing only, not layout) | `grep -n "@media" src/css/components/tree.css`                                    | One hit, `@media (pointer: coarse)` at 245 — sizes the caret/handle hit area on touch, unrelated to width; no `@container` anywhere — confirms Gap 1 for tree too                                                                                                                                                                      |
| `accordion`, `menu`, `navbar`, `popover` | No responsive mechanism                                     | `grep -n "@media\|@container"` on each                                            | No matches in any of the four — confirmed `neither`                                                                                                                                                                                                                                                                                    |
| `splitter`                               | App-owned, no width arithmetic                              | Read in full                                                                      | Header comment quoted verbatim in §4                                                                                                                                                                                                                                                                                                   |
| `field`                                  | `for`/`id` label pairing                                    | Read usage comment                                                                | `for="cs"` / `id="cs"`, confirmed as written                                                                                                                                                                                                                                                                                           |

None of these checks found the census's summary tally wrong (that is
guarded separately by `test/inventory-elements.test.mjs`); two of them
(`dock`, `tree`) found that the census's true-but-coarse per-file verdict
obscures a distinction this document needed — a `@media` hit for
`prefers-reduced-transparency` or `pointer: coarse` counts identically to
a real width breakpoint in the census's one-column classification, and a
document about resize specifically has to look past that column to the
actual rule.
