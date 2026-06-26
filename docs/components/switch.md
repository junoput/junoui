# Switch

A flight-deck rocker: a squared track that lights green (`nominal`) when ON, with an
**ON / OFF legend** and a sliding knob. A real checkbox drives it; the app owns state.

## Web

```html
<label class="juno-switch">
  <input class="juno-switch__input" type="checkbox" role="switch" checked />
  <span class="juno-switch__track"></span>
  <span>AUTO-THROTTLE</span>
</label>
```

| Class                    | Effect                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `.juno-switch`           | Inline-flex label row; `gap-control`, `data` text.                                         |
| `.juno-switch__input`    | The checkbox — visually hidden, still focusable / tab-ordered.                             |
| `.juno-switch__track`    | `space.72` × `space.28` track; OFF = `control-edge`, ON = role (`nominal`). Legend + knob. |
| `.juno--<role>`          | On-color of the track (put on `__track`).                                                  |
| `:checked` / `:disabled` | Slides the knob to inline-end + legend ON / dims.                                          |

## Anatomy (any platform)

- Track `space.72` × `space.28`, radius `4`, inset shadow; knob `space.24`, gradient
  `s3`→`s2`. Legend mono 10px, `muted` (OFF) → role (ON).
- Knob travels via `inset-inline-start` (mirrors under RTL), `motion.duration.quick`
  / `ease.spring`; honors `prefers-reduced-motion`.

## Usage

- Switch = immediate state change (a setting that takes effect now). For form values
  submitted later, prefer a [checkbox](./checkbox.md).
- Add `role="switch"`; the app toggles `checked` + `aria-checked`.
