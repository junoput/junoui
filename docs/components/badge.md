# Badge / status indicator

A compact, uppercase status label.

## Web

```html
<span class="juno-badge juno--nominal">NOMINAL</span>
<span class="juno-badge juno-badge--outline juno--caution">CAUTION</span>
```

| Class                  | Effect                                        |
| ---------------------- | --------------------------------------------- |
| `.juno-badge`          | Base. Filled: background = role, text = `s0`. |
| `.juno-badge--outline` | Transparent fill, text + border = role.       |
| `.juno-badge--soft`    | Low-fill chip: role text on a 13% role wash.  |
| `.juno--<role>`        | Sets the color (required).                    |

## Anatomy (any platform)

- Font: B612, 700 weight, size `font.size.11`, uppercase, tracking `font.tracking.caps` (0.15em).
- Padding: `space.4` vertical, `space.10` horizontal. Radius: `radius.3`.
- **Filled:** fill = role color, text = `s0` (base surface).
- **Outline:** transparent fill, text + 1px border = role color.

## Usage

- Use the semantic roles for status; `muted` for inactive/disabled.
- Keep the text the literal status word — color reinforces, never replaces it.
