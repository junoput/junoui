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

| Component                 | You must add                                                                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Badge / status dot        | Text label in the DOM (not color alone). For live values, `aria-live="polite"`.                                                          |
| Button                    | Use a real `<button>`; `disabled` for disabled (not just the class).                                                                     |
| Card                      | Heading semantics (`<h2>`…) in `__head` if it titles a region.                                                                           |
| Loader (indeterminate)    | `role="status"` + `aria-label="Loading"`.                                                                                                |
| Loader (determinate)      | `role="progressbar"` + `aria-valuenow/min/max`.                                                                                          |
| Input / select / textarea | A `<label>` tied by `for`/`id`. Errors: `aria-invalid="true"` + `aria-describedby` → the error text. Required: `aria-required`.          |
| Checkbox / radio          | Real `<input>` inside its `<label>`; radios share a `name`. State is native `checked`.                                                   |
| Switch                    | `role="switch"` on the input; app keeps `checked` + `aria-checked` in sync.                                                              |
| Slider                    | Real `<input type="range">`; add `aria-valuetext` when the number needs units.                                                           |
| Modal / drawer            | Native `<dialog>` + `showModal()` (focus-trap, ESC, inert background, scrim-click come free). Name it via `aria-labelledby` → the title. |
| Tooltip                   | Trigger needs a tabstop; bubble `role="tooltip"` + `aria-describedby` so it reveals on focus, not only hover.                            |
| Popover                   | Trigger `aria-expanded` + `aria-controls`; move focus in on open, restore on close; ESC + outside-click dismiss.                         |
| Menu / dropdown           | `role="menu"` + `role="menuitem"`; trigger `aria-haspopup="menu"` + `aria-expanded`. App wires arrow-key roving focus, Enter, ESC.       |

These are interaction concerns — junoui can't enforce them in CSS, so they're your
responsibility (or the widget package's).
