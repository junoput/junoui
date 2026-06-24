# Button

## Web

```html
<button class="juno-btn juno--nominal">CONFIRM</button>
<button class="juno-btn juno-btn--ghost">CANCEL</button>
<button class="juno-btn" disabled>DISABLED</button>
```

| Class | Effect |
|---|---|
| `.juno-btn` | Base. Primary (filled): background = role, text = `s0`. Default role = `active`. |
| `.juno-btn--ghost` | Transparent, `data` text, `border` outline; hover → `s2`. |
| `.juno--<role>` | Sets the primary fill color. |
| `:disabled` | `muted` fill, `label` text, not-allowed. |

## Anatomy (any platform)

- Font: B612, 700 weight, size `font.size.13`, uppercase, tracking `font.tracking.caps`.
- Padding: `space.10` × `space.20`. Radius: `radius.4`. Min height: `size.tap.min` (24px; use 44px on mobile).
- States: hover brighten ~8%, active darken ~6%, disabled = `muted`/`label`.

## Usage

- Primary action filled with `nominal` (confirm) or `active` (apply).
- `warning` fill only for genuinely critical/destructive actions.
- One primary per group; everything else is ghost.
