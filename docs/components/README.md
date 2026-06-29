# Components

Framework-agnostic elements built from tokens. On the web they're CSS classes in
`junoui/css`; on other platforms, build the same anatomy from
[tokens-reference.md](../tokens-reference.md).

## The role mechanism (web)

A component reads a single custom property, `--juno-role`. A role class sets it, so
**one class re-colors any component**:

```html
<span class="juno-badge juno--warning">…</span>
<!-- role = warning -->
<button class="juno-btn juno--nominal">…</button>
<!-- role = nominal -->
```

Role classes: `.juno--nominal` `.juno--active` `.juno--target` `.juno--caution`
`.juno--warning` `.juno--muted`.

## Catalogue

| Component                      | Class                                  | Spec                                   |
| ------------------------------ | -------------------------------------- | -------------------------------------- |
| Badge / status indicator       | `.juno-badge`                          | [badge.md](./badge.md)                 |
| Button                         | `.juno-btn`                            | [button.md](./button.md)               |
| Card / panel                   | `.juno-card`                           | [card.md](./card.md)                   |
| Data readout                   | `.juno-readout`                        | [readout.md](./readout.md)             |
| Status dot                     | `.juno-status`                         | [status.md](./status.md)               |
| Loaders (arc · beacon · bar)   | `.juno-arc` `.juno-beacon` `.juno-bar` | [loader.md](./loader.md)               |
| Field wrapper                  | `.juno-field`                          | [field.md](./field.md)                 |
| Input / textarea               | `.juno-input`                          | [input.md](./input.md)                 |
| Select                         | `.juno-select`                         | [select.md](./select.md)               |
| Checkbox / radio               | `.juno-checkbox` `.juno-radio`         | [checkbox.md](./checkbox.md)           |
| Switch                         | `.juno-switch`                         | [switch.md](./switch.md)               |
| Toggle button                  | `.juno-toggle-btn`                     | [toggle-button.md](./toggle-button.md) |
| Slider                         | `.juno-slider`                         | [slider.md](./slider.md)               |
| Modal / dialog                 | `.juno-modal`                          | [modal.md](./modal.md)                 |
| Drawer                         | `.juno-drawer`                         | [drawer.md](./drawer.md)               |
| Tooltip                        | `.juno-tooltip`                        | [tooltip.md](./tooltip.md)             |
| Popover                        | `.juno-popover`                        | [popover.md](./popover.md)             |
| Menu / dropdown                | `.juno-menu`                           | [menu.md](./menu.md)                   |
| Table / data grid              | `.juno-table`                          | [table.md](./table.md)                 |
| Alert / inline notification    | `.juno-alert`                          | [alert.md](./alert.md)                 |
| Toast / snackbar               | `.juno-toast`                          | [toast.md](./toast.md)                 |
| Tabs                           | `.juno-tabs`                           | [tabs.md](./tabs.md)                   |
| Accordion / disclosure         | `.juno-accordion`                      | [accordion.md](./accordion.md)         |
| Icon                           | `.juno-icon`                           | [icon.md](./icon.md)                   |
| Skeleton / loading placeholder | `.juno-skeleton`                       | [skeleton.md](./skeleton.md)           |
| Avatar                         | `.juno-avatar`                         | [avatar.md](./avatar.md)               |
| Divider / separator            | `.juno-divider`                        | [divider.md](./divider.md)             |

Always pair a status color with a text label — color is never the only signal.
