# Switch

An on/off toggle: a real checkbox drives a sliding track. Presentational only — the
app owns the checked state.

## Web

```html
<label class="juno-switch">
  <input class="juno-switch__input" type="checkbox" role="switch" checked />
  <span class="juno-switch__track"></span>
  <span>CROSSFEED</span>
</label>
```

| Class                    | Effect                                                         |
| ------------------------ | -------------------------------------------------------------- |
| `.juno-switch`           | Inline-flex label row; `gap-control`, `data` text.             |
| `.juno-switch__input`    | The checkbox — visually hidden, still focusable / tab-ordered. |
| `.juno-switch__track`    | Track + thumb. Off = `s3`; on = role (default `active`).       |
| `.juno--<role>`          | On-color of the track (put on `__track`).                      |
| `:checked` / `:disabled` | Slides thumb to inline-end / dims via `opacity.disabled`.      |

## Anatomy (any platform)

- Track `space.40` × `space.20`, pill radius; thumb `space.16`, `label` (off) → `s0` (on).
- Thumb travels via `inset-inline-start` (mirrors under RTL), `motion.duration.fast` /
  `motion.ease.standard`; honors `prefers-reduced-motion`.
- Focus ring on the hidden input shows on `__track`.

## Usage

- Switch = immediate state change (a setting that takes effect now). For form values
  submitted later, prefer a [checkbox](./checkbox.md).
- Add `role="switch"` to the input; the app toggles `checked` + `aria-checked`.
