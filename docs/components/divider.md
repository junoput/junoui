# Divider

A hairline rule that separates content. Horizontal by default; vertical for a column
separator; or labeled to break the line with a centered caption.

## Web

```html
<!-- semantic horizontal break -->
<hr class="juno-divider" />

<!-- labeled -->
<div class="juno-divider juno-divider--label">OR</div>

<!-- vertical (inside a flex row) -->
<span class="juno-divider juno-divider--vertical"></span>
```

| Class                     | Effect                                                              |
| ------------------------- | ------------------------------------------------------------------- |
| `.juno-divider`           | Full-width `border`-colored hairline.                               |
| `.juno-divider--vertical` | Hairline column rule; stretches to the row (`align-self: stretch`). |
| `.juno-divider--label`    | Caption centered between two rules (uppercase `label`).             |

## Usage

- Use a real `<hr>` for a **semantic** break; a `<span>` / `<div>` when it's purely
  decorative.
- The vertical variant needs a parent that gives it block size — a flex row works
  (`align-self: stretch`); otherwise set a height.
- Don't over-divide: whitespace separates most things. Reach for a rule only when groups
  would otherwise read as one.
