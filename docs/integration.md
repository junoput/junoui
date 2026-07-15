# Integrating junoui into an app

junoui is **presentational**: tokens + a CSS component layer, zero JS. It dresses a UI
your app builds. This is the recipe for consuming it cleanly — and the rules for
extending it without breaking the "one design across all apps" goal.

## 1. Import order (app shell)

`@junoput01/junoui/css` sets a small reset + document defaults on `:root`/`body`. Load it **first**,
your app styles **after**, so your shell wins where it must:

```js
import '@junoput01/junoui/css'; // tokens + base + components — FIRST
import '@junoput01/junoui/fonts.css'; // optional self-hosted B612 (see §2)
import './app.css'; // your shell + app-specific styles — AFTER
```

What junoui's base layer touches: `box-sizing`, margin/padding reset, `body`
font/color/background, link color, focus-visible ring, and `prefers-reduced-motion` /
`forced-colors` handling. It does **not** position or lay out your shell — that's yours.
If a body default fights your shell, override it in your app CSS (loaded after).

## 2. Fonts (opt-in, CSP-safe)

junoui never fetches fonts. Either bring your own B612, or opt into the self-hosted set:

```js
import '@junoput01/junoui/fonts.css'; // local @font-face → woff2 in the package, no network
```

Safe under a strict CSP (`font-src 'self'`). Skip it and the UI falls back to system
sans/mono until you provide the family.

## 3. Theming — two attributes

```html
<html data-juno-palette="standard" data-juno-mode="dark" data-juno-density="comfortable"></html>
```

- `data-juno-palette`: `standard` · `colorblind` · `soft`
- `data-juno-mode`: `dark` · `light`
- `data-juno-density`: `comfortable` · `compact`
- `data-juno-text`: `base` · `large` · `xl` (type scale)

Flip these at runtime and the whole UI re-themes. Persist them if you want (localStorage);
the value is yours to manage.

## 4. Token bridge (aliasing app variables)

If your app already has design aliases, redefine them in terms of `--juno-*` so one system
drives everything:

```css
:root {
  --bg: var(--juno-s0);
  --ink: var(--juno-data);
  --ink-dim: var(--juno-data-dim); /* timestamps, metadata */
  --line: var(--juno-border);
  --line-strong: var(--juno-border-strong); /* dividers */
  --accent: var(--juno-active); /* see §5 — accent is semantic */
}
```

Prefer a shipped token over `color-mix()`. junoui exposes the full neutral ramp
(`data` · `data-dim` · `label` · `muted`) and two border tones (`border` ·
`border-strong`), so most dense-UI needs don't require mixing.

## 5. Accent is semantic — not a brand hue

junoui has **no decorative brand-accent knob**, on purpose. Color encodes _status_, never
decoration: every hue is a role (`nominal` · `active` · `target` · `caution` · `warning`).
The "accent" is the `active` role, and it changes with the palette.

If you want a different accent, **switch palette** (`soft` reads calmer) or add your own
brand color as an app-local variable used only for non-semantic chrome (a logo, a splash).
Do not remap junoui's roles to a brand hue — that erases the shared meaning across apps.

## 6. Extending — where new things go

| Need                                                     | Where                                                                                                                    |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| New **status meaning**, reusable across apps             | Propose a new role in junoui core (semver: additive = minor). Rare.                                                      |
| A full **alternate theme** (same role names, new values) | A new **palette** (like `standard`/`colorblind`/`soft`) — the sanctioned expansion slot.                                 |
| App-specific **decorative** color                        | App-local, **namespaced** (`--myapp-*`), layered on top; alias to `--juno-*` where you can. Never redefine junoui roles. |
| A **component** junoui lacks (e.g. chat bubble)          | Build it locally against the token contract until junoui (or a `junoui-<domain>` layer) ships it.                        |

Rule of thumb: extend **additively and namespaced**. If every app injects its own palette
into junoui, the single-design guarantee dies.

## 7. Stateful behavior stays in your app

junoui ships no JS. Focus traps, list virtualization, popover positioning, data — all
yours (or a future sibling `junoui-<framework>` package). junoui gives you the stable,
semantic DOM (real elements, BEM classes, ARIA hooks) to wire behavior + analytics onto;
see [accessibility.md](./accessibility.md) for the per-component ARIA contract.
