# Navbar

The top bar of a pushed view on phones: a back control on the start edge —
**always present**, so any screen can unwind — a centered truncating title,
and trailing actions. junoui ships the look; the app owns the navigation
stack (what "back" does and where it goes).

## Web

```html
<header class="juno-navbar">
  <a class="juno-navbar__back" href="/library">
    <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-caret-left" /></svg>
    <span class="juno-navbar__back-label">Library</span>
  </a>
  <h1 class="juno-navbar__title">Album</h1>
  <div class="juno-navbar__actions">
    <button class="juno-btn juno-btn--sm juno-btn--ghost">EDIT</button>
  </div>
</header>
```

| Class                      | Effect                                                             |
| -------------------------- | ------------------------------------------------------------------ |
| `.juno-navbar`             | Sticky top `s1` bar, hairline seam below, safe-area padded on top. |
| `.juno-navbar__back`       | Start-edge back control, active-toned; ≥ `size.tap.comfortable`.   |
| `.juno-navbar__back-label` | Parent-view name next to the caret — truncates at 14ch.            |
| `.juno-navbar__title`      | Centered `font.size.14` title; truncates, never wraps.             |
| `.juno-navbar__actions`    | Trailing cluster for small buttons / icons.                        |

## Anatomy (any platform)

- Three-column grid: equal flexible sides keep the title optically centered;
  when space runs out the title truncates first, never sliding under the back
  control (back/actions keep their own truncated width).
- Back = `caret.left` + the **parent view's name** in the active color; the
  caret flips under RTL. Title `font.size.14` semibold, data-toned.
- Bar ≥ `size.tap.comfortable` tall; top padding extends into
  `env(safe-area-inset-top)` so the notch never covers it.
- **Motion.** Pressing the back control dims it and slides the caret a hair toward the
  edge it unwinds to (mirrored under RTL) — reinforcing "back." See
  [motion.md](../motion.md).

## Usage

- **Tab + stack recipe:** the [dock](./dock.md)/[pillbar](./pillbar.md)
  switches sections; inside a section, drilling into a
  [list](./list.md) row pushes a view whose navbar backs out one level.
  Full shell recipe: [layout.md](../layout.md#app-shell).
- The back control is a real `<a>` to the parent route (deep-linkable), or a
  `<button>` when the app drives history. Label it with the parent view's
  name; keep `aria-label="Back"` when only the caret fits.
- Root views (tab landing screens) have no parent — there, swap the back slot
  for a brand/title block or leave it empty; every _pushed_ view keeps it.
- One `<h1>` per document — pushed views' navbar titles are usually the
  screen's `<h1>`.
