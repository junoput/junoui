# Checkbox & Radio

Native inputs tinted with the role via `accent-color` — keyboard and screen-reader
support come for free. Wrap with `.juno-choice` for an inline label row.

## Web

```html
<label class="juno-choice">
  <input class="juno-checkbox" type="checkbox" checked /> AUTOPILOT
</label>

<label class="juno-choice"> <input class="juno-radio" type="radio" name="mode" /> SELECTED </label>
<label class="juno-choice">
  <input class="juno-radio juno--target" type="radio" name="mode" checked /> MANAGED
</label>

<label class="juno-choice">
  <input class="juno-checkbox" type="checkbox" disabled /> UNAVAILABLE
</label>
```

| Class                            | Effect                                                      |
| -------------------------------- | ----------------------------------------------------------- |
| `.juno-checkbox` / `.juno-radio` | `space.16` box, `accent-color` = role (default `active`).   |
| `.juno-choice`                   | Inline-flex label row; `gap-control`, `data` text, pointer. |
| `.juno--<role>`                  | Recolors the control (e.g. `target` for a managed option).  |
| `:disabled`                      | Dimmed by `opacity.disabled`; row text → `muted`.           |

## Anatomy (any platform)

- Size `space.16`; control color = `--juno-role` (via `accent-color` on web).
- Label row: B612 `font.size.13`, `data` color, `gap-control` between box and text.

## Usage

- Checkbox = independent toggles; radio = one-of-many (share a `name`).
- Keep the visible label inside the same `<label>` so the hit area covers both.
- For a single on/off with an emphasized track, use the [switch](./switch.md).
