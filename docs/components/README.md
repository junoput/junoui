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

| Component                    | Class                                  | Spec                       |
| ---------------------------- | -------------------------------------- | -------------------------- |
| Badge / status indicator     | `.juno-badge`                          | [badge.md](./badge.md)     |
| Button                       | `.juno-btn`                            | [button.md](./button.md)   |
| Card / panel                 | `.juno-card`                           | [card.md](./card.md)       |
| Data readout                 | `.juno-readout`                        | [readout.md](./readout.md) |
| Status dot                   | `.juno-status`                         | [status.md](./status.md)   |
| Loaders (arc · beacon · bar) | `.juno-arc` `.juno-beacon` `.juno-bar` | [loader.md](./loader.md)   |

Always pair a status color with a text label — color is never the only signal.
