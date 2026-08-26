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
| `.juno-btn--dense` | On `--sm` only: keeps the 24px height on touch as well. Opt out by name.         |
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
- `--sm` is a **density**, not a semantic. It is for dense desktop toolbars
  (40–46px chrome bars): 24px on a fine pointer, the WCAG 2.2 AA floor (2.5.8)
  exactly. On a **coarse pointer it promotes to `size.tap.min`** — type and
  padding still shrink, but the tap target does not. Reaching for `--sm` to mean
  "secondary" is the common mistake; `--ghost` is the secondary modifier and
  stands alone at full size.
- `.juno-btn--dense` opts a `--sm` button back out of that promotion, for a
  toolbar that is genuinely dense on touch (a scrubber, an editor rail). It does
  nothing without `--sm`, on purpose: a dense touch target should be chosen by
  name, never inherited from a size.
