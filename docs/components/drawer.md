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

## The slide-over pattern

The full production composition — scrim, end-anchored panel on `s1`, header row,
scrolling body, pinned footer — assembled from existing parts. Copy-paste:

```html
<dialog class="juno-modal juno-drawer" aria-labelledby="tray-tag">
  <div class="juno-modal__stripe"></div>
  <div class="juno-modal__head">
    <span class="juno-modal__tag" id="tray-tag">ACTIVE JOBS</span>
    <button class="juno-modal__close" autofocus aria-label="Close">✕</button>
  </div>
  <div class="juno-modal__body"><!-- scrolls on its own --></div>
  <div class="juno-modal__foot">
    <button class="juno-btn juno-btn--ghost">CLEAR DONE</button>
    <button class="juno-btn juno--warning">PAUSE ALL</button>
  </div>
</dialog>
```

`showModal()` provides the scrim (`::backdrop`, `opacity.scrim`) and z-order for
free — no scrim element, no z-index bookkeeping. Head/body/foot are the modal
parts; the drawer class only re-pins and re-slides the surface.

## Usage

- Settings panels, filters, detail editors that don't warrant leaving context.
- Same `<dialog>` + `showModal()` contract as the modal.
- **Phone widths (< `bp.sm`) are automatic:** side drawers cap at `85vw` so a
  sliver of scrim stays visible (and tappable) for dismissal. The bottom
  drawer always pads past the home indicator (`safe-area-inset-bottom`).
