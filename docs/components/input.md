# Input / textarea

Text entry. One class for `<input>` and `<textarea>`.

## Web

```html
<input class="juno-input" type="text" placeholder="Free text" />
<input class="juno-input juno-mono" type="text" value="UAL 519" />
<!-- code/value -->
<input class="juno-input juno-mono juno--target" value="38000" />
<!-- managed -->
<input class="juno-input" aria-invalid="true" value="7700" />
<!-- error -->
<input class="juno-input" disabled value="—" />
<textarea class="juno-input" rows="3"></textarea>
```

| Class / attr     | Effect                                                             |
| ---------------- | ------------------------------------------------------------------ |
| `.juno-input`    | Box: `s0` bg, neutral `border`, radius `4`, density-aware padding. |
| `.juno-mono`     | Mono font for codes / numeric values (callsign, squawk, altitude). |
| `.juno--<role>`  | Re-colors the border (e.g. `target` for managed values).           |
| `[aria-invalid]` | Warning border, tied to the a11y attribute.                        |
| `:disabled`      | `s1` bg, `muted` text, not-allowed.                                |

`--juno-role` defaults to the neutral border, so the resting border is quiet; a role
class or `aria-invalid` overrides it with no per-role rules. Focus uses the base ring.

## Anatomy (any platform)

- Padding: `--juno-pad-control-*` (density-aware). Radius `4`. Min height `size.tap.min`.
- Font: B612 `font.size.14`, `data` color; placeholder `muted`. Textarea resizes vertically.
- Border: neutral `border` at rest; role / `warning` (invalid) on top. Focus = base outline ring.

## Usage

- Add `.juno-mono` whenever the value is a code or number — fixed-width stops jitter.
- Wrap in [`.juno-field`](./field.md) for label + help/error.
- Use `.juno--target` for system-managed values, mirroring readouts.
