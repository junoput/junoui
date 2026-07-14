# Modal / Dialog

A centered, scrim-backed `<dialog>` for decisions that must block the deck. junoui
ships the look + entry motion; **the app owns** `showModal()`/`close()`, focus-trapping,
and ESC/scrim-click dismiss (native `<dialog>` gives you most of this free).

## Web

```html
<dialog class="juno-modal">
  <div class="juno-modal__stripe"></div>
  <div class="juno-modal__head">
    <span class="juno-modal__tag">DEPLOYMENT</span>
    <button class="juno-modal__close" aria-label="Close">✕</button>
  </div>
  <div class="juno-modal__body">
    <h2 class="juno-modal__title">Promote build to production?</h2>
    <p class="juno-modal__text">This routes production traffic to the new version…</p>
    <div class="juno-modal__foot">
      <button class="juno-btn juno-btn--ghost">CANCEL</button>
      <button class="juno-btn">PROMOTE BUILD</button>
    </div>
  </div>
</dialog>

<!-- destructive -->
<dialog class="juno-modal juno--warning">…</dialog>
```

| Class                                      | Effect                                                                |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `.juno-modal`                              | 440px panel, `s1`, radius `8`, shadow `3` (e3), `z.overlay` (4000).   |
| `.juno-modal__stripe`                      | Top accent bar in `--juno-role`.                                      |
| `.juno-modal__grabber`                     | Drag handle; hidden by default, shown on phone sheet + bottom drawer. |
| `.juno-modal__head` / `__tag` / `__close`  | Tag row + close button (`size.tap.min`).                              |
| `.juno-modal__title` / `__text` / `__foot` | Title (20px light), body, right-aligned actions.                      |
| `.juno--warning`                           | Destructive: stripe + tag turn `warning`.                             |
| `::backdrop`                               | Dark scrim at `opacity.scrim` + 1.5px blur.                           |

## Anatomy (any platform)

- Enter: scrim fades, panel scales 0.97→1 + rises, `motion.duration.deliberate`
  (300ms) / `ease.decel`. Exit accelerates. `prefers-reduced-motion` collapses it.
- Elevation = `z.overlay` + `shadow.3`, paired. One scrim at a time — never stack modals.

## Usage

- Use a real `<dialog>` + `showModal()` so focus-trap, ESC, and inert background come free.
- Destructive actions: `.juno--warning` + a deliberate confirm (`.juno-btn juno--warning`).
- For edge-anchored panels that don't block, use the [drawer](./drawer.md).
- **Phone widths (< `bp.sm`) are automatic:** the centered dialog becomes a
  bottom sheet — full-width, top corners rounded, sliding up, footer buttons
  stretched, content padded past the home indicator. No extra class.
- **Sheet grabber:** add `<div class="juno-modal__grabber"></div>` as the first
  child. It stays hidden on the centered dialog and reveals only on the phone sheet;
  for drag-to-dismiss wiring see [motion.md](../motion.md#4-mobile-sheets--the-grabber--drag-to-dismiss).
