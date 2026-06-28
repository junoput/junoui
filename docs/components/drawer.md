# Drawer

An edge-anchored `<dialog>` for secondary tasks and settings — same scrim and layer
as the [modal](./modal.md), but it slides along one axis. Reuses `.juno-modal` for the
surface; `.juno-drawer` re-pins and re-slides it.

## Web

```html
<dialog class="juno-modal juno-drawer">
  <!-- header / body / footer, same parts as a modal -->
</dialog>

<dialog class="juno-modal juno-drawer juno-drawer--start">…</dialog>
<dialog class="juno-modal juno-drawer juno-drawer--bottom">…</dialog>
```

| Class                  | Effect                                                 |
| ---------------------- | ------------------------------------------------------ |
| `.juno-drawer`         | 380px, full height, pinned to the **inline-end** edge. |
| `.juno-drawer--start`  | Pins to the inline-start edge.                         |
| `.juno-drawer--bottom` | Full width, 60dvh, pinned to the bottom edge.          |

## Anatomy (any platform)

- Slide in from its edge, `motion.duration.base` (200ms) / `ease.decel`. Same scrim
  (`opacity.scrim`) and shadow (`shadow.3`) as the modal.
- Edge anchoring is logical (`margin-inline`), so start/end mirror under RTL.

## Usage

- Settings panels, filters, detail editors that don't warrant leaving context.
- Same `<dialog>` + `showModal()` contract as the modal.
