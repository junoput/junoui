# Select

A native `<select>` styled as an input, with a token-colored chevron.

## Web

```html
<div class="juno-select">
  <select class="juno-input">
    <option>NOMINAL</option>
    <option>CAUTION</option>
    <option>WARNING</option>
  </select>
</div>
```

| Class                        | Effect                                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| `.juno-select`               | Wrapper; draws the chevron and positions it (inline-end).                                     |
| `.juno-select > .juno-input` | The native `<select>` reuses the input box; `appearance:none`, room reserved for the chevron. |

## Anatomy (any platform)

- Box is identical to [input](./input.md): `s0` bg, neutral border, radius `4`,
  density-aware padding.
- Chevron: a CSS triangle in `label` color at `space.12` from the inline-end edge —
  inherits a token, no SVG, mirrors under RTL.

## Usage

- Always a real `<select>` — keyboard and screen-reader behavior come for free.
- Role classes (`.juno--<role>`) and `aria-invalid` tint the border exactly as on input.
- Wrap in [`.juno-field`](./field.md) for a label.
