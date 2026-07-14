# Motion & mobile feel

How movement works in junoui, and **what your app must wire** to keep it correct.

The framework line holds here too: junoui ships the **look + the motion vocabulary +
the presentational transitions that need no state** (press feedback, hover, focus,
enter/exit keyframes). Anything that needs to know _when_ a thing opens, closes, or
navigates — `showModal()`, route changes, drag gestures — lives in your app. This doc
is the seam: what you get for free, and the small amount you wire.

---

## 1. The motion tokens (the vocabulary)

Four durations × four easings. Never hand-pick a `ms` or a bezier — compose from these
so every surface in the app moves with one voice.

| Duration token                      | Value | Use for                                         |
| ----------------------------------- | ----- | ----------------------------------------------- |
| `--juno-motion-duration-instant`    | 80ms  | Press/hover feedback, immediate value change.   |
| `--juno-motion-duration-quick`      | 140ms | Tooltip, menu, list-row tint — fast transients. |
| `--juno-motion-duration-base`       | 200ms | Drawer, popover — standard overlay motion.      |
| `--juno-motion-duration-deliberate` | 300ms | Modal, scrim — blocking surfaces enter slowly.  |

| Easing token                  | Curve                        | Use for                                             |
| ----------------------------- | ---------------------------- | --------------------------------------------------- |
| `--juno-motion-ease-decel`    | `cubic-bezier(.2,.8,.2,1)`   | **Enter** — decelerate into place.                  |
| `--juno-motion-ease-accel`    | `cubic-bezier(.4,0,1,1)`     | **Exit** — accelerate away.                         |
| `--juno-motion-ease-standard` | `cubic-bezier(.2,.7,.3,1)`   | **Move** — on-screen reposition, at rest both ends. |
| `--juno-motion-ease-spring`   | `cubic-bezier(.2,.9,.3,1.2)` | **Toggle** — slight overshoot (switch, check).      |

The pairing rule: **things arriving decelerate; things leaving accelerate; things
moving in place use `standard`; things toggling get `spring`.**

```css
/* your own component, in junoui's voice */
.my-thing {
  transition: transform var(--juno-motion-duration-quick) var(--juno-motion-ease-standard);
}
```

---

## 2. What is automatic — wire nothing

These fire from CSS `:hover` / `:focus-visible` / `:active` and the coarse-pointer
media query. Ship the markup from each component's doc and you get them free:

- **Press feedback (touch-first).** Tap targets dip under the finger and spring back
  on release — `dock`, `pillbar` (glyph/item scales), `navbar` back (dims + caret
  slides toward the edge it unwinds to), interactive `list` rows (tint deepens, drill-in
  chevron slides forward). `:active` fires on touch, so this reads as native tactile
  feedback with zero JS.
- **State transitions.** Active-tab swaps, row hover/focus tints, and the dock's
  active-indicator all cross-fade over `quick`/`instant` instead of snapping.
- **Tap-target growth.** On `pointer: coarse`, controls that size off the tap minimum
  grow to 44px (`base.css`). No class, no JS.
- **RTL correctness.** Directional glyphs (navbar caret, list chevron) mirror under
  `[dir='rtl']`, and their press nudges follow.

Your only job: **don't override these with your own `transition: none` or a blanket
`* { transition: … }` reset.**

---

## 3. Enter / exit overlays — you own the trigger

Modal, drawer, and toast ship the entry/exit **motion**; your app owns the **state**.

### Modal & drawer (native `<dialog>`)

junoui styles the surface and animates it with `@starting-style` + `transition-behavior:
allow-discrete`, so the panel animates **both** ways off the top layer. You call the
platform methods — that is the entire contract:

```js
dialog.showModal(); // junoui slides/scales it in
dialog.close(); // junoui accelerates it out
```

Use a real `<dialog>` + `showModal()` (not a styled `<div>`): focus-trap, `Esc`, inert
background, and the `::backdrop` scrim all come from the platform. Do **not** animate
by toggling a class — you would lose the exit animation and the a11y for free.

### Toast

The stack animates inserts (`@starting-style`) and exits (you add
`.juno-toast--leaving` ~200ms before removing the node). Your app owns creation,
auto-dismiss timing, and the `aria-live` announcement. See [toast](./components/toast.md).

---

## 4. Mobile sheets — the grabber & drag-to-dismiss

Below `bp.sm` (< 640px) a centered `.juno-modal` **automatically** becomes a bottom
sheet (full-width, top-rounded, slides up). The `.juno-drawer--bottom` is a sheet at
any width.

### Grabber (presentational)

Add a grab handle as the **first child** of the surface. It's hidden on the centered
dialog and side drawers, and revealed on the phone sheet + bottom drawer — no class
logic on your side:

```html
<dialog class="juno-modal">
  <div class="juno-modal__grabber"></div>
  <!-- first child -->
  <div class="juno-modal__stripe"></div>
  …
</dialog>
```

### Drag-to-dismiss (optional, app-owned)

The grabber **signals** "pull down to dismiss"; the gesture itself is state, so it's
yours. Minimal, token-timed recipe — translate the sheet with the drag, and either
snap back or `close()` past a threshold:

```js
const sheet = document.querySelector('.juno-modal');
let y0 = null;

sheet.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('.juno-modal__grabber')) return; // drag from the handle only
  y0 = e.clientY;
  sheet.style.transition = 'none'; // follow the finger 1:1
  sheet.setPointerCapture(e.pointerId);
});

sheet.addEventListener('pointermove', (e) => {
  if (y0 == null) return;
  const dy = Math.max(0, e.clientY - y0); // down only
  sheet.style.transform = `translateY(${dy}px)`;
});

sheet.addEventListener('pointerup', (e) => {
  if (y0 == null) return;
  const dy = e.clientY - y0;
  sheet.style.transition = ''; // hand motion back to junoui
  sheet.style.transform = '';
  y0 = null;
  if (dy > sheet.offsetHeight * 0.35) sheet.close(); // past threshold → dismiss
});
```

Honor the motion preference in JS too — skip the 1:1 follow when the user opted out:

```js
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  /* drag visuals */
}
```

---

## 5. Tab + stack navigation — view transitions

The dock/pillbar switch top-level sections; the navbar backs out of pushed views (recipe
in [layout.md](./layout.md#app-shell)). junoui styles the chrome; **your router owns
which view is mounted.** To animate the swap in junoui's voice, use the platform
**View Transitions API** and drive it with the motion tokens:

```css
::view-transition-group(*) {
  animation-duration: var(--juno-motion-duration-base);
  animation-timing-function: var(--juno-motion-ease-standard);
}
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*) {
    animation: none;
  }
}
```

```js
// push/pop a view; the browser cross-fades old→new
if (document.startViewTransition) {
  document.startViewTransition(() => renderRoute(next));
} else {
  renderRoute(next); // graceful fallback — no animation, correct state
}
```

Rule: **the transition is decoration; correctness must not depend on it.** Always render
the new view even when `startViewTransition` is absent.

---

## 6. Reduced motion — the contract

`base.css` already collapses every `transition` and `animation` to ~0 under
`prefers-reduced-motion: reduce`. That covers all junoui CSS motion. Your obligations:

- **Don't re-introduce motion the reset can't reach** — inline styles, Web Animations
  API, or JS-driven transforms. Gate those on the media query (see §4).
- **Motion is never load-bearing.** Every state a component reaches through animation
  (open, selected, dismissed) must also be true instantly. If reduced-motion users
  can't tell what happened, the design leaned on the animation — fix the end state.

---

## Checklist for app authors

- [ ] Overlays use real `<dialog>` + `showModal()`/`close()` — never class-toggled divs.
- [ ] Bottom sheets include `<div class="juno-modal__grabber"></div>` as the first child.
- [ ] Any custom transition composes `--juno-motion-duration-*` + `--juno-motion-ease-*`.
- [ ] JS/WAAPI motion is gated on `prefers-reduced-motion`.
- [ ] View/route swaps render correctly with **and without** `startViewTransition`.
- [ ] No global `* { transition: … }` reset that clobbers component press feedback.
