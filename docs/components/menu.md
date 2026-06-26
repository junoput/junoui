# Menu / Dropdown

A list of immediate actions anchored to its trigger — with section dividers, keyboard
shortcuts, and a destructive item set apart by `warning`. junoui ships the look; **the
app owns** open/close, roving focus (arrow keys), and dismiss.

## Web

```html
<div class="juno-popover-anchor">
  <button aria-haspopup="menu" aria-expanded="true">FLIGHT PLAN ▾</button>
  <ul class="juno-menu" role="menu">
    <li>
      <button class="juno-menu__item" role="menuitem">
        <span class="juno-menu__icon">⤓</span>Load flight plan
        <span class="juno-menu__kbd">⌘O</span>
      </button>
    </li>
    <li class="juno-menu__sep" role="separator"></li>
    <li>
      <button class="juno-menu__item juno--warning" role="menuitem">
        <span class="juno-menu__icon">⨯</span>Discard plan
      </button>
    </li>
  </ul>
</div>
```

| Class                            | Effect                                                         |
| -------------------------------- | -------------------------------------------------------------- |
| `.juno-menu`                     | 256px `s2` panel, radius `5`, shadow `2`, `z.anchored` (2000). |
| `.juno-menu__item`               | Action row; hover/focus → `s3`. Icon + label + shortcut.       |
| `.juno-menu__item.juno--warning` | Destructive item; text + icon `warning`, hover tinted.         |
| `.juno-menu__icon` / `__kbd`     | Leading glyph (`label`) / trailing shortcut (`muted`).         |
| `.juno-menu__sep`                | Section divider.                                               |

## Anatomy (any platform)

- Anchored layer: `z.anchored` + `shadow.2`. Clips open from the top edge,
  `motion.duration.quick` (140ms) / `ease.decel` (app-driven).

## Usage

- Real `<button>` items inside `role="menu"` / `role="menuitem"`; the app wires arrow-key
  roving focus, Enter to fire, ESC / outside-click to close.
- One destructive item max, separated by a divider and marked `.juno--warning`.
