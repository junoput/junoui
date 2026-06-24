# Card / panel

A surface grouping a titled header and a body.

## Web

```html
<article class="juno-card juno-card--accent juno--caution">
  <header class="juno-card__head">
    HYD SYS B
    <span class="juno-badge juno-badge--outline juno--caution">CAUTION</span>
  </header>
  <div class="juno-card__body">
    <div class="juno-card__row"><span class="juno-label">Pressure</span>
      <span class="juno-value juno-text-caution">2,650</span></div>
  </div>
</article>
```

| Class | Effect |
|---|---|
| `.juno-card` | `s1` surface, 1px `border`, radius `radius.8`. |
| `.juno-card--accent` | 2px top edge in the role color (status hint). |
| `.juno-card--alert` | Full border in role + tinted header — critical panels. |
| `.juno-card__head` | Uppercase title row; holds a status badge. |
| `.juno-card__body` | Padded content column. |
| `.juno-card__row` | Label-left / value-right baseline row. |

## Anatomy (any platform)

- Surface `s1`, border `border` 1px, radius `radius.8`.
- Header: padding `space.12`/`space.16`, bottom 1px divider, title B612 600 uppercase tracking `wide`.
- Body: padding `space.16`, rows gapped `space.12`.
- Escalation: accent (2px top) → alert (full role border + `s2` header tinted in role).

## Usage

- One subject per card. Header carries the identifier + a status badge.
- Match accent/alert role to the card's worst current status.
