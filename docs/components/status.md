# Status dot

A colored dot plus a text label — the most compact status signal.

## Web

```html
<span class="juno-status juno--nominal"><span class="juno-status__dot"></span>NOMINAL</span>
<span class="juno-status juno--active juno-status--live"><span class="juno-status__dot"></span>ACTIVE</span>
```

| Class | Effect |
|---|---|
| `.juno-status` | Inline dot + label, both in the role color. Default role = `nominal`. |
| `.juno-status__dot` | The dot (`size.dot.sm` = 8px). |
| `.juno-status--lg` | Larger dot (`size.dot.md` = 10px) for legends. |
| `.juno-status--live` | Blink animation (respects `prefers-reduced-motion`). |

## Anatomy (any platform)

- Dot: circle, `size.dot.sm` (8px), fill = role; legend variant `size.dot.md` (10px).
- Label: `font.size.12`, tracking `font.tracking.label`, color = role.
- Gap dot↔label: `space.8`.

## Usage

- Always show the text label; the dot color reinforces it, never replaces it.
- `--live` pulse only for genuinely live/armed signals — not decoration.
