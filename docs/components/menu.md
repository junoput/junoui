# Menu / Dropdown

A list of immediate actions anchored to its trigger — with section dividers, keyboard
shortcuts, and a destructive item set apart by `warning`. Built on the **native Popover
API** (top layer — never clipped, never z-index-trapped): open/close, light-dismiss, and
ESC are free. junoui ships the look; **the app owns** roving focus (arrow keys).

## Web

```html
<button popovertarget="acts" aria-haspopup="menu">ACTIONS ▾</button>
<ul class="juno-menu" id="acts" popover role="menu">
  <li>
    <button class="juno-menu__item" role="menuitem" popovertarget="acts" popovertargetaction="hide">
      <span class="juno-menu__icon">⤓</span>Import data
      <span class="juno-menu__kbd">⌘O</span>
    </button>
  </li>
  <li class="juno-menu__sep" role="separator"></li>
  <li>
    <button
      class="juno-menu__item juno--warning"
      role="menuitem"
      popovertarget="acts"
      popovertargetaction="hide"
    >
      <span class="juno-menu__icon">⨯</span>Delete project
    </button>
  </li>
</ul>
```

| Class                            | Effect                                                       |
| -------------------------------- | ------------------------------------------------------------ |
| `.juno-menu`                     | 256px `s2` panel, radius `5`, shadow `2`. Top-layer, pinned. |
| `.juno-menu__item`               | Action row; hover/focus → `s3`. Icon + label + shortcut.     |
| `.juno-menu__item.juno--warning` | Destructive item; text + icon `warning`, hover tinted.       |
| `.juno-menu__icon` / `__kbd`     | Leading glyph (`label`) / trailing shortcut (`muted`).       |
| `.juno-menu__sep`                | Section divider.                                             |

## Anatomy (any platform)

- Top-layer surface `s2` + `shadow.2`, pinned below the invoker with a `space.8` gap;
  flips to stay on-screen. Rise + fade, `motion.duration.quick` (140ms) / `ease.decel`,
  animated with `@starting-style` + `allow-discrete`.

## Usage

- Real `<button>` items inside `role="menu"` / `role="menuitem"`. Each item carries
  `popovertarget="<id>" popovertargetaction="hide"` so activating it closes the menu with
  no JS; the app still wires arrow-key roving focus + Enter.
- `popovertarget` on the trigger handles open / ESC / outside-click and exposes
  `aria-expanded` implicitly. Keep `aria-haspopup="menu"` for intent.
- One destructive item max, separated by a divider and marked `.juno--warning`.
