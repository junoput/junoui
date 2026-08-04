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

| Class                  | Effect                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `.juno-drawer`         | 380px, full height, pinned to the **inline-end** edge.                                                                                     |
| `.juno-drawer--start`  | Pins to the inline-start edge.                                                                                                             |
| `.juno-drawer--bottom` | Full width, real bottom sheet: height via `--juno-sheet-h` (default `60dvh`), grab handle, rounded top corners, pinned to the bottom edge. |

## Anatomy (any platform)

- Slide in from its edge, `motion.duration.base` (200ms) / `ease.decel`. Same scrim
  (`opacity.scrim`) and shadow (`shadow.3`) as the modal.
- Edge anchoring is logical (`margin-inline`), so start/end mirror under RTL.

## Bottom sheet (`.juno-drawer--bottom`)

```html
<dialog class="juno-modal juno-drawer juno-drawer--bottom" aria-labelledby="sheet-tag">
  <div class="juno-sheet__handle" aria-hidden="true"></div>
  <div class="juno-modal__stripe"></div>
  <div class="juno-modal__head">
    <span class="juno-modal__tag" id="sheet-tag">FILTERS</span>
    <button class="juno-modal__close" autofocus aria-label="Close">✕</button>
  </div>
  <div class="juno-modal__body"><!-- scrolls on its own, pads past the home indicator --></div>
</dialog>
```

- **Height knob:** `--juno-sheet-h` (default `60dvh`) sets the sheet's block-size;
  `--juno-sheet-max` (default `92dvh`) caps it. Both are plain custom properties an
  app can swap per open (or per breakpoint) for peek/half/full snap points — this is
  CSS only. junoui does **not** ship the drag gesture that would let a user pull
  between those points; that's stateful interaction and belongs to the app (or a
  sibling `junoui-<framework>` package).
- **Grab handle:** `.juno-sheet__handle` is a decorative bar the app renders as the
  first child. Mark it `aria-hidden="true"` — the dialog's own `aria-labelledby`
  (pointing at the title) remains the accessible name. It is not a button and has no
  built-in drag behavior.
- **Safe area lives on the body, not the sheet.** `.juno-drawer--bottom` itself has
  `padding-block-end: 0`; `.juno-modal__body` carries
  `calc(var(--juno-pad-surface-inline) + env(safe-area-inset-bottom, 0px))` so a
  scrolling sheet never hides its last row under the home indicator (a sheet that
  doesn't scroll still gets the clearance, since the padding sits on the body box
  either way).
- **`<dialog>` is the only supported sheet root.** `showModal()` gives you the
  top-layer stacking, `::backdrop` scrim, ESC handling, scroll lock, and — critically —
  focus trap **and** `inert` background for free: the rest of the page becomes
  unfocusable and unclickable the moment the sheet opens, with no extra markup.
  Hand-rolling a bottom sheet from a positioned `<div>` + a manual scrim `<button>`
  reproduces the visual but silently drops all of that: no focus trap, no `inert`,
  ESC and outside-dismiss have to be wired by hand and are easy to get wrong. Don't
  do it — use `<dialog class="juno-modal juno-drawer juno-drawer--bottom">`.

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
  sliver of scrim stays visible (and tappable) for dismissal. The bottom drawer's
  body always pads past the home indicator (`safe-area-inset-bottom`) — see
  [Bottom sheet](#bottom-sheet-juno-drawer--bottom) above.
