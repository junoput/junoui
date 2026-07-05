# Switch

A labeled rocker: a squared track that lights green (`nominal`) when ON, with an
**ON / OFF legend** and a sliding knob. A real checkbox drives it; the app owns state.

## Web

```html
<label class="juno-switch">
  <input class="juno-switch__input" type="checkbox" role="switch" checked />
  <span class="juno-switch__track"></span>
  <span>AUTO-SCALING</span>
</label>
```

| Class                    | Effect                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `.juno-switch`           | Inline-flex label row; `gap-control`, `data` text.                                 |
| `.juno-switch__input`    | The checkbox — visually hidden, still focusable / tab-ordered.                     |
| `.juno-switch__track`    | 70 × `space.28` track; OFF = `control-edge`, ON = role (`nominal`). Legend + knob. |
| `.juno-switch--sm`       | Quiet 40 × `space.20` track: no printed legend, smaller knob. For per-row toggles. |
| `.juno--<role>`          | On-color of the track (put on `__track`).                                          |
| `:checked` / `:disabled` | Slides the knob to inline-end + legend ON / dims.                                  |

## Anatomy (any platform)

- Track 70 × `space.28`, radius `4`, inset shadow. Knob 26 × 22, radius `4`, gradient
  `s3`→`s2`, three grip lines; printed ON / OFF legend (mono 10px, `muted` → role).
- Knob travels via `inset-inline-start` (mirrors under RTL), `motion.duration.quick`;
  honors `prefers-reduced-motion`.

## Usage

- Switch = immediate state change (a setting that takes effect now). For form values
  submitted later, prefer a [checkbox](./checkbox.md).
- The default rocker is for settings panels; `--sm` for columns of row toggles
  (plugin lists, table rows) where five rockers would shout.
- Add `role="switch"`; the app toggles `checked` + `aria-checked`.
