# Input / textarea

Text entry — inputs are instruments. **Mono by default** (codes, callsigns, squawks);
add `.juno-input--sans` for free text. One class for `<input>` and `<textarea>`.

## Web

```html
<input class="juno-input" type="text" value="UAL 519" />
<!-- mono code -->
<input class="juno-input juno-input--sans" placeholder="Type to edit…" />
<!-- free text -->
<input class="juno-input juno--target" value="38000" />
<!-- managed -->
<input class="juno-input" aria-invalid="true" value="7700" />
<!-- error -->
<input class="juno-input" disabled value="LOCKED" />
<textarea class="juno-input juno-input--sans" rows="4"></textarea>
```

| Class / attr        | Effect                                                                               |
| ------------------- | ------------------------------------------------------------------------------------ |
| `.juno-input`       | Box: `control-surface` bg, `control-edge` border, radius `4`, density padding. Mono. |
| `.juno-input--sans` | Sans font for free-text fields.                                                      |
| `.juno--<role>`     | Re-colors the border (e.g. `target` for managed values).                             |
| `[aria-invalid]`    | `warning` border + text, tied to the a11y attribute.                                 |
| `:disabled`         | `s1` bg, `muted` text, not-allowed.                                                  |

`--juno-role` defaults to `control-edge`, so the resting border is quiet; a role class
or `aria-invalid` overrides it. **Focus** = `active` border + a 1px ring (replaces the
base outline on inputs).

## Anatomy (any platform)

- **Control surface:** on dark panels the hairline border vanishes, so the edge lifts
  to `muted` on an `s2` field; light mode keeps the true `border` on `s0`
  (`--juno-control-surface` / `--juno-control-edge`).
- Padding `--juno-pad-control-block` × `space.12` (density-aware). Radius `4`. Min
  height `size.tap.min`. Font `font.size.14`, `data`; placeholder `muted`.

## Usage

- Mono is the default because most cockpit entry is codes/values; opt into `--sans`
  for names and remarks. Textarea is usually `--sans`.
- Wrap in [`.juno-field`](./field.md) for label + help/error.
