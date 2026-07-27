# Accessibility

Accessibility is a primary goal of junoui, not an afterthought. The design system
ships the **look and the accessibility contract**; the _interaction behavior_ (focus
trapping, ARIA state updates, keyboard handlers) lives in your app or a sibling
`junoui-<framework>` package — but this page states exactly what junoui guarantees, to
which published standard, and what you must wire up.

## Standards we build to

junoui targets the international web accessibility standards and references the
specific criteria it meets — so a claim can be checked, not just trusted:

- **[WCAG 2.2](https://www.w3.org/TR/WCAG22/)** (W3C Recommendation) — **AA across the
  board, AAA where it matters** (see the specific success criteria cited below).
- **[WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/)** roles/states/properties, and
  the **[ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/)**
  for the keyboard/interaction patterns in [the contract table](#the-aria-contract-per-component).

Criteria referenced on this page, by number:

| SC         | Name                        | Level | Where                             |
| ---------- | --------------------------- | ----- | --------------------------------- |
| **1.4.1**  | Use of Color                | A     | [Color](#color)                   |
| **1.4.3**  | Contrast (Minimum)          | AA    | [Color](#color)                   |
| **1.4.6**  | Contrast (Enhanced)         | AAA   | [Color](#color)                   |
| **1.4.11** | Non-text Contrast           | AA    | [Focus](#focus)                   |
| **2.4.7**  | Focus Visible               | AA    | [Focus](#focus)                   |
| **2.4.11** | Focus Appearance            | AA    | [Focus](#focus)                   |
| **2.2.2**  | Pause, Stop, Hide           | A     | [Motion](#motion)                 |
| **2.3.3**  | Animation from Interactions | AAA   | [Motion](#motion)                 |
| **2.5.8**  | Target Size (Minimum)       | AA    | [Targets](#targets)               |
| **2.5.5**  | Target Size (Enhanced)      | AAA   | [Targets](#targets)               |
| **1.4.12** | Text Spacing                | AA    | [Density](#density--text-spacing) |

This coverage is expected to grow: junoui adds standards references as components and
tokens land, and never removes a guarantee without a semver-major note.

## Color

- **Never make color the only signal** (WCAG **1.4.1** Use of Color, A). Every status
  pairs color with a text label, icon, or shape. A badge says `WARNING`; a dot sits
  beside its word.
- The **colorblind** palette (IBM Carbon universal set) is distinguishable across
  deuteranopia, protanopia, and tritanopia, and passes WCAG **1.4.6** Contrast
  (Enhanced), AAA (≥ 7:1) on dark surfaces. Use it for accessibility-critical or
  universal audiences.
- Contrast: `data` on `s0`–`s2` meets **1.4.6** (AAA, ≥ 7:1) for body text; `label`
  meets **1.4.3** Contrast (Minimum), AA (≥ 4.5:1). Exact values:
  [tokens-reference.md](./tokens-reference.md).

## Focus

- A visible focus ring is defined in the base layer for links, buttons, inputs, and
  anything with `[tabindex]`: 2px solid `--juno-active`, 2px offset. It tracks the
  theme and is never removed (WCAG **2.4.7** Focus Visible, AA).
- The ring's size, offset and `active`-role contrast satisfy **2.4.11** Focus
  Appearance (AA, WCAG 2.2) and **1.4.11** Non-text Contrast (AA) against adjacent
  surfaces.
- Don't suppress `:focus-visible`. If you build a custom control, give it a tabstop
  and let the ring apply.
- Text inputs / select / textarea swap the outline for an equivalent visible signal:
  an `active` border + 1px ring. Never remove focus indication outright.

## Motion

- All animations respect `prefers-reduced-motion: reduce` (base layer slows them to
  near-static). Loader pulses and the `--live` dot honor it automatically — covering
  WCAG **2.2.2** Pause, Stop, Hide (A) and **2.3.3** Animation from Interactions (AAA).
- Use the `determinate` loaders when progress is known — less motion, more trust.

## Targets

- `--juno-size-tap-min` = 24px — WCAG **2.5.8** Target Size (Minimum), AA (WCAG 2.2).
- `--juno-size-tap-comfortable` = 44px — WCAG **2.5.5** Target Size (Enhanced), AAA;
  recommended for primary actions on touch.
- `.juno-btn` already sets `min-height: var(--juno-size-tap-min)`.
- **On coarse pointers this is automatic:** under `@media (pointer: coarse)` the
  base layer raises `--juno-size-tap-min` to the comfortable 44px, so every
  control sized off the tap minimum grows on touch devices. A cascade override —
  the token values themselves don't change.
- Hover-revealed affordances get a touch fallback: table row actions stay
  visible under `@media (hover: none)`.

## Forced colors / high contrast

- The base layer opts components into the system palette under
  `@media (forced-colors: active)`: borders fall back to `CanvasText`, focus to
  `Highlight`. Badges keep their fill (`forced-color-adjust: none`) so status stays
  legible.

## Writing direction (RTL)

- Components use **CSS logical properties** (`margin-inline`, `padding-inline`,
  `inset`, `min-inline-size`) so they mirror correctly under `dir="rtl"` with no
  extra CSS. Avoid reintroducing physical `left`/`right` in consuming code.

## Density & text spacing

- Type tokens set line-height and spacing with enough headroom that user or
  browser-imposed **text spacing** (line-height 1.5×, paragraph/letter/word spacing)
  doesn't clip or overlap content — WCAG **1.4.12** Text Spacing (AA).
- Compact density shrinks padding, never a control's `min-height` (the tap target
  under [Targets](#targets)) and never the type scale — readability holds at every
  density.

## The ARIA contract (per component)

junoui gives structure + style; you add roles/state:

| Component                 | You must add                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Badge / status dot        | Text label in the DOM (not color alone). For live values, `aria-live="polite"`.                                                                                                                                                                                                                                                                                                |
| Button                    | Use a real `<button>`; `disabled` for disabled (not just the class).                                                                                                                                                                                                                                                                                                           |
| Card                      | Heading semantics (`<h2>`…) in `__head` if it titles a region.                                                                                                                                                                                                                                                                                                                 |
| Loader (indeterminate)    | `role="status"` + `aria-label="Loading"`.                                                                                                                                                                                                                                                                                                                                      |
| Loader (determinate)      | `role="progressbar"` + `aria-valuenow/min/max`.                                                                                                                                                                                                                                                                                                                                |
| Input / select / textarea | A `<label>` tied by `for`/`id`. Errors: `aria-invalid="true"` + `aria-describedby` → the error text. Required: `aria-required`.                                                                                                                                                                                                                                                |
| Checkbox / radio          | Real `<input>` inside its `<label>`; radios share a `name`. State is native `checked`.                                                                                                                                                                                                                                                                                         |
| Switch                    | `role="switch"` on the input; app keeps `checked` + `aria-checked` in sync.                                                                                                                                                                                                                                                                                                    |
| Toggle button             | Real `<button>` with `aria-pressed`; app flips it. Legend text is in the DOM, not color alone.                                                                                                                                                                                                                                                                                 |
| Slider                    | Value-driven `div`: add `role="slider"`, `tabindex`, `aria-valuenow/min/max` (+ `aria-valuetext` for units); app wires drag + arrow/Page keys and keeps `--juno-slider-pct` in sync.                                                                                                                                                                                           |
| Modal / drawer            | Native `<dialog>` + `showModal()` (focus-trap, ESC, inert background, scrim-click come free). Name it via `aria-labelledby` → the title.                                                                                                                                                                                                                                       |
| Tooltip                   | Trigger needs a tabstop; bubble `role="tooltip"` + `aria-describedby` so it reveals on focus, not only hover. Promote to `popover="hint"` to escape ancestor clipping (top layer).                                                                                                                                                                                             |
| Popover                   | Native `popover` + `popovertarget` button (top layer; ESC + outside-click dismiss + `aria-expanded` come free). Keep `aria-haspopup`; move focus in on open, restore on close.                                                                                                                                                                                                 |
| Menu / dropdown           | `role="menu"` + `role="menuitem"`; native `popover` + `popovertarget` (free dismiss/ESC/`aria-expanded`), items `popovertargetaction="hide"`. App wires arrow-key roving focus + Enter.                                                                                                                                                                                        |
| Table / data grid         | Real `<table>`/`<th>`/`<td>` (use `scope`). Sortable headers: `aria-sort` per column, kept in sync as you reorder. Selected rows: `aria-selected="true"`. Truncated cells: a `title` (or tooltip) with the full value.                                                                                                                                                         |
| Alert                     | `role="alert"` for urgent (assertive), `role="status"` for passive. Icon is `aria-hidden`; the message text carries the meaning. Dismiss is a real `<button>` with `aria-label`.                                                                                                                                                                                               |
| Toast                     | Stack is a live region: `aria-live="polite"` (`assertive` for errors). Each toast `role="status"`; keep it short. Dismiss `<button>` + `aria-label`; don't rely on the auto-timeout alone for critical info.                                                                                                                                                                   |
| Tabs                      | `role="tablist"` + `role="tab"` (each `aria-controls` its `role="tabpanel"`, which is `aria-labelledby` the tab). App keeps one `aria-selected="true"`, hides the rest, moves roving `tabindex`, and wires ← / → / Home / End.                                                                                                                                                 |
| Accordion                 | Native `<details>`/`<summary>` — open state, focus, and Enter/Space are built in. For one-open-at-a-time, give the `<details>` a shared `name`. No ARIA to add.                                                                                                                                                                                                                |
| Icon                      | Decorative: `aria-hidden="true"`. Meaningful (icon-only control): `role="img"` + `aria-label`, or label the surrounding control. Never the only signal for status.                                                                                                                                                                                                             |
| Skeleton                  | Wrap the loading region in `aria-busy="true"` (+ `aria-live="polite"`); swap in real content when loaded. The shimmer itself is decorative.                                                                                                                                                                                                                                    |
| Reload                    | Refetch-over-content: `role="status"` + `aria-label="Reloading"` announces politely (not `alert`). Keep `pointer-events: none` so it never blocks the content it floats over. First-paint uses the skeleton instead.                                                                                                                                                           |
| Avatar                    | `<img>` needs a meaningful `alt`. The status ring is decorative — pair it with a `title` / visible label so status isn't color-only.                                                                                                                                                                                                                                           |
| Divider                   | Semantic break: use `<hr>`. Purely decorative: a `<span>`/`<div>` (no role needed).                                                                                                                                                                                                                                                                                            |
| Chip / tag                | Toggle chip: real `<button>` + `aria-pressed`. Removable: the `__remove` `<button>` needs an `aria-label` ("Remove X"). Meaning is in the text, not color.                                                                                                                                                                                                                     |
| Breadcrumb                | `<nav aria-label="Breadcrumb">` around an `<ol>`; mark the last crumb `aria-current="page"` and drop its `href`.                                                                                                                                                                                                                                                               |
| Pagination                | `<nav aria-label="Pagination">`; current page `aria-current="page"`; icon-only prev/next need `aria-label`; disable the ends with `disabled`.                                                                                                                                                                                                                                  |
| Stepper                   | Real `<ol>`; set `data-state` per step and `aria-current="step"` on the active one. State drives the color — don't rely on color alone.                                                                                                                                                                                                                                        |
| Rail / dock               | `<nav aria-label="Primary">` of real links; active item `aria-current="page"`. Collapsed rail items (icons-only) need `aria-label`/`title`. When both navs render (rail + dock swap), the hidden one leaves the tree via `display:none`. Pill variant (`--pill`) hides labels — **every item needs an `aria-label`**. Section-loading arc gets `role="status"` + `aria-label`. |
| Pillbar                   | `<nav aria-label>` when it navigates; links get `aria-current="page"`, toggle buttons `aria-pressed`. Icon-only items need `aria-label`. The `__input` search field needs its own `aria-label` / visually-hidden `<label>` — a placeholder is not a label. Never render both a dock and a pillbar on one screen.                                                               |
| Navbar                    | Back is a real `<a>` (parent route) or `<button>` (history); `aria-label="Back"` when the caret has no text. Title is usually the screen's `<h1>`. The bar itself needs no role — it's a `<header>`.                                                                                                                                                                           |
| List                      | Rows that navigate are `<a>` (or `<button>`) wrapping the whole row — never a bare chevron target. Keep `<ul>`/`<li>` when rows form a set. A trailing switch/checkbox is its own labeled control; don't nest it inside a link row.                                                                                                                                            |

These are interaction concerns — junoui can't enforce them in CSS, so they're your
responsibility (or the widget package's). Each row follows the matching
[WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/) pattern;
when in doubt, implement the APG keyboard model for that role.
