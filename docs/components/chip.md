# Chip / Tag

A compact pill for a discrete entity — a filter, a selected value, a removable tag.
Where a [badge](./badge.md) is a **static** status label, a chip is **interactive**:
selectable and/or dismissible. Reads `--juno-role` for its accent; the app owns
selection and removal (zero JS).

## Web

```html
<!-- plain tag -->
<span class="juno-chip">us-east-1</span>

<!-- role-tinted -->
<span class="juno-chip juno--active">live</span>

<!-- toggle (filter) chip -->
<button class="juno-chip juno-chip--toggle juno--active" aria-pressed="true">Errors</button>

<!-- removable -->
<span class="juno-chip">
  filter:prod
  <button class="juno-chip__remove" aria-label="Remove prod filter">
    <svg class="juno-icon juno-icon--sm" aria-hidden="true"><use href="…#juno-i-x" /></svg>
  </button>
</span>
```

| Class                | Effect                                                       |
| -------------------- | ------------------------------------------------------------ |
| `.juno-chip`         | Pill; `control-surface` fill, strong border, `data` text.    |
| `.juno--<role>`      | Role accent (border + tinted fill + role text).              |
| `.juno-chip--toggle` | Use on a `<button>`; `aria-pressed="true"` fills the accent. |
| `.juno-chip__remove` | Trailing dismiss button (put an `x` icon inside; label it).  |
| `:disabled`          | Dims + blocks pointer.                                       |

## Usage

- **Toggle chip:** a real `<button>`; the app flips `aria-pressed`. Use for filter sets.
- **Removable chip:** the `__remove` button needs an `aria-label` ("Remove X"); the app
  deletes the chip on click.
- Chip vs badge: chip = interactive / user data; badge = read-only status. Don't make a
  badge clickable — reach for a chip.
- Color is never the only signal — the chip's text carries the meaning; role is accent.
