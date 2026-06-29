# Toast / snackbar

A transient, floating notification. Same role-rail language as the [alert](./alert.md),
but elevated and stacked in a fixed corner on the reserved **alert layer**
(`--juno-z-alert`, above modals). junoui ships the look + enter/exit motion; the app owns
creation, auto-dismiss timing, and the live-region announcement.

## Web

```html
<!-- one stack per corner; the app appends toasts into it -->
<div class="juno-toast-stack" id="toasts" aria-live="polite"></div>

<!-- a toast (app-created) -->
<div class="juno-toast juno--nominal" role="status">
  <span class="juno-toast__icon" aria-hidden="true">✓</span>
  <span class="juno-toast__text">Build promoted.</span>
  <button class="juno-toast__close" aria-label="Dismiss">✕</button>
</div>
```

| Class                                      | Effect                                                              |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `.juno-toast-stack`                        | Fixed container on `z.alert`; bottom-end, stacks its toasts.        |
| `.juno-toast-stack--top` / `--start`       | Move the stack to the top / inline-start.                           |
| `.juno-toast`                              | `s2` surface, `shadow.2`, role start-rail. Default `active`.        |
| `.juno-toast--leaving`                     | Exit state (app adds it, then removes the node on `transitionend`). |
| `.juno-toast__icon` / `__text` / `__close` | Glyph · message · dismiss.                                          |
| `.juno--<role>`                            | Sets the rail + icon color.                                         |

## Anatomy (any platform)

- Stack: `position: fixed`, `z.alert` (5000), `inline-size: min(360px, …)`, `pointer-events:
none` so only the toasts catch clicks.
- Toast: solid `s2` + `shadow.2` + role rail. Enters via `@starting-style` (fade + slide),
  exits on `.juno-toast--leaving`; both honor `prefers-reduced-motion`.

## Usage

- The app creates and destroys toasts: append to the stack, start a timer (~4s), then add
  `.juno-toast--leaving` and remove on `transitionend`. `showcase/app.js` (`showToast`) is a
  reference driver.
- Put `aria-live="polite"` on the stack (`assertive` for errors) so new toasts announce.
- Keep messages short and self-contained; one line. For anything needing a decision, use a
  [modal](./modal.md) or inline [alert](./alert.md).
