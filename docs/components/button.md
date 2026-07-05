# Button

## Web

```html
<button class="juno-btn juno--nominal">CONFIRM</button>
<button class="juno-btn juno-btn--ghost">CANCEL</button>
<button class="juno-btn juno-btn--sm juno-btn--ghost">EDIT</button>
<button class="juno-btn" disabled>DISABLED</button>
```

| Class              | Effect                                                                           |
| ------------------ | -------------------------------------------------------------------------------- |
| `.juno-btn`        | Base. Primary (filled): background = role, text = `s0`. Default role = `active`. |
| `.juno-btn--ghost` | Transparent, `data` text, `border` outline; hover → `s2`.                        |
| `.juno-btn--sm`    | Dense-toolbar size: `font.size.11`, `space.4` × `space.10`, `radius.3`.          |
| `.juno--<role>`    | Sets the primary fill color.                                                     |
| `:disabled`        | `muted` fill, `label` text, not-allowed.                                         |

## Anatomy (any platform)

- Font: B612, 700 weight, size `font.size.13`, uppercase, tracking `font.tracking.caps`.
- Padding: `space.10` × `space.20`. Radius: `radius.4`. Min height: `size.tap.min` (24px; use 44px on mobile).
- States: hover brighten ~8%, active darken ~6%, disabled = `muted`/`label`.

## Usage

- Primary action filled with `nominal` (confirm) or `active` (apply).
- `warning` fill only for genuinely critical/destructive actions.
- One primary per group; everything else is ghost.
- `--sm` drops below the WCAG tap-minimum on purpose — it is for dense **desktop**
  toolbars (40–46px chrome bars). Keep the default size anywhere touch is expected.
