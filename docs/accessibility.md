# Accessibility

junoui ships the **look and the accessibility contract**. The _interaction behavior_
(focus trapping, ARIA state updates, keyboard handlers) lives in your app or a
sibling `junoui-<framework>` package — but this is what the design system guarantees
and what you must wire up.

## Color

- **Never make color the only signal.** Every status pairs color with a text label,
  icon, or shape. A badge says `WARNING`; a dot sits beside its word.
- The **colorblind** palette (IBM Carbon universal set) is distinguishable across
  deuteranopia, protanopia, and tritanopia, and passes WCAG **AAA (≥ 7:1)** on dark
  surfaces. Use it for accessibility-critical or universal audiences.
- Contrast: `data` on `s0`–`s2` meets AAA body text; `label` meets AA. Exact values:
  [tokens-reference.md](./tokens-reference.md).

## Focus

- A visible focus ring is defined in the base layer for links, buttons, inputs, and
  anything with `[tabindex]`: 2px solid `--juno-active`, 2px offset. It tracks the
  theme and is never removed.
- Don't suppress `:focus-visible`. If you build a custom control, give it a tabstop
  and let the ring apply.
- Text inputs / select / textarea swap the outline for an equivalent visible signal:
  an `active` border + 1px ring. Never remove focus indication outright.

## Motion

- All animations respect `prefers-reduced-motion: reduce` (base layer slows them to
  near-static). Loader pulses and the `--live` dot honor it automatically.
- Use the `determinate` loaders when progress is known — less motion, more trust.

## Targets

- `--juno-size-tap-min` = 24px — WCAG 2.2 AA minimum for interactive controls.
- `--juno-size-tap-comfortable` = 44px — recommended for primary actions on touch.
- `.juno-btn` already sets `min-height: var(--juno-size-tap-min)`.

## Forced colors / high contrast

- The base layer opts components into the system palette under
  `@media (forced-colors: active)`: borders fall back to `CanvasText`, focus to
  `Highlight`. Badges keep their fill (`forced-color-adjust: none`) so status stays
  legible.

## Writing direction (RTL)

- Components use **CSS logical properties** (`margin-inline`, `padding-inline`,
  `inset`, `min-inline-size`) so they mirror correctly under `dir="rtl"` with no
  extra CSS. Avoid reintroducing physical `left`/`right` in consuming code.

## The ARIA contract (per component)

junoui gives structure + style; you add roles/state:

| Component                 | You must add                                                                                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Badge / status dot        | Text label in the DOM (not color alone). For live values, `aria-live="polite"`.                                                                                                                                                |
| Button                    | Use a real `<button>`; `disabled` for disabled (not just the class).                                                                                                                                                           |
| Card                      | Heading semantics (`<h2>`…) in `__head` if it titles a region.                                                                                                                                                                 |
| Loader (indeterminate)    | `role="status"` + `aria-label="Loading"`.                                                                                                                                                                                      |
| Loader (determinate)      | `role="progressbar"` + `aria-valuenow/min/max`.                                                                                                                                                                                |
| Input / select / textarea | A `<label>` tied by `for`/`id`. Errors: `aria-invalid="true"` + `aria-describedby` → the error text. Required: `aria-required`.                                                                                                |
| Checkbox / radio          | Real `<input>` inside its `<label>`; radios share a `name`. State is native `checked`.                                                                                                                                         |
| Switch                    | `role="switch"` on the input; app keeps `checked` + `aria-checked` in sync.                                                                                                                                                    |
| Toggle button             | Real `<button>` with `aria-pressed`; app flips it. Legend text is in the DOM, not color alone.                                                                                                                                 |
| Slider                    | Value-driven `div`: add `role="slider"`, `tabindex`, `aria-valuenow/min/max` (+ `aria-valuetext` for units); app wires drag + arrow/Page keys and keeps `--juno-slider-pct` in sync.                                           |
| Modal / drawer            | Native `<dialog>` + `showModal()` (focus-trap, ESC, inert background, scrim-click come free). Name it via `aria-labelledby` → the title.                                                                                       |
| Tooltip                   | Trigger needs a tabstop; bubble `role="tooltip"` + `aria-describedby` so it reveals on focus, not only hover. Promote to `popover="hint"` to escape ancestor clipping (top layer).                                             |
| Popover                   | Native `popover` + `popovertarget` button (top layer; ESC + outside-click dismiss + `aria-expanded` come free). Keep `aria-haspopup`; move focus in on open, restore on close.                                                 |
| Menu / dropdown           | `role="menu"` + `role="menuitem"`; native `popover` + `popovertarget` (free dismiss/ESC/`aria-expanded`), items `popovertargetaction="hide"`. App wires arrow-key roving focus + Enter.                                        |
| Table / data grid         | Real `<table>`/`<th>`/`<td>` (use `scope`). Sortable headers: `aria-sort` per column, kept in sync as you reorder. Selected rows: `aria-selected="true"`. Truncated cells: a `title` (or tooltip) with the full value.         |
| Alert                     | `role="alert"` for urgent (assertive), `role="status"` for passive. Icon is `aria-hidden`; the message text carries the meaning. Dismiss is a real `<button>` with `aria-label`.                                               |
| Toast                     | Stack is a live region: `aria-live="polite"` (`assertive` for errors). Each toast `role="status"`; keep it short. Dismiss `<button>` + `aria-label`; don't rely on the auto-timeout alone for critical info.                   |
| Tabs                      | `role="tablist"` + `role="tab"` (each `aria-controls` its `role="tabpanel"`, which is `aria-labelledby` the tab). App keeps one `aria-selected="true"`, hides the rest, moves roving `tabindex`, and wires ← / → / Home / End. |
| Accordion                 | Native `<details>`/`<summary>` — open state, focus, and Enter/Space are built in. For one-open-at-a-time, give the `<details>` a shared `name`. No ARIA to add.                                                                |

These are interaction concerns — junoui can't enforce them in CSS, so they're your
responsibility (or the widget package's).
