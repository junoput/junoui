# Alert / inline notification

A role-tinted banner for in-context messages — validation summaries, system status,
callouts. Soft-fill with a role accent rail; icon + title + text + optional actions and
dismiss. Color comes from `var(--juno-role)` (set by a `.juno--<role>` class).

## Web

```html
<div class="juno-alert juno--warning" role="alert">
  <span class="juno-alert__icon" aria-hidden="true">⚠</span>
  <div class="juno-alert__body">
    <span class="juno-alert__title">Deploy blocked</span>
    <span class="juno-alert__text">Two required checks are still failing.</span>
    <div class="juno-alert__actions">
      <button class="juno-btn juno--warning">RE-RUN</button>
      <button class="juno-btn juno-btn--ghost">VIEW LOG</button>
    </div>
  </div>
  <button class="juno-alert__close" aria-label="Dismiss">✕</button>
</div>
```

| Class                  | Effect                                                                      |
| ---------------------- | --------------------------------------------------------------------------- |
| `.juno-alert`          | Soft role wash + role border + start accent rail. Default `active`.         |
| `.juno-alert__icon`    | Leading glyph, role-colored. Mark it `aria-hidden`.                         |
| `.juno-alert__body`    | `__title` (data, semibold) + `__text` (label) column.                       |
| `.juno-alert__actions` | Row of buttons under the text.                                              |
| `.juno-alert__close`   | Ghost dismiss button (app removes the alert).                               |
| `.juno-alert--solid`   | High-emphasis: full role fill, text on `s0`.                                |
| `.juno--<role>`        | Sets the color (`active` info · `nominal` success · `caution` · `warning`). |

## Anatomy (any platform)

- Surface: `color-mix(role 10%)` wash, `color-mix(role 30%)` border, `border.width.3`
  role rail on the inline-start edge, `radius.5`, surface padding.
- Icon + title (`data`, semibold) + text (`label`); `--solid` swaps to a full role fill.

## Usage

- **Inline, not floating** — alerts sit in the layout. For transient confirmations use a
  [toast](./toast.md).
- `role="alert"` for urgent (assertive announce); `role="status"` for passive.
- Pair the role color with the icon **and** a word — never color alone.
- Dismiss is the app's job: remove the node (`showcase/app.js` wires `.juno-alert__close`).
