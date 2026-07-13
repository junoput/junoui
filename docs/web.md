# Web (CSS / SCSS / JS)

## CSS — the fast path

Import the full stylesheet (tokens + base + utilities + components):

```js
import 'junoui/css'; // bundler
```

```css
@import 'junoui/css'; /* plain CSS */
```

Set the theme with two attributes on `<html>`:

```html
<html data-juno-palette="standard" data-juno-mode="dark"></html>
```

Both are optional. **Omit `data-juno-mode` and the theme follows the OS**
(`prefers-color-scheme`, live — no JS): dark systems get dark, light systems
light, in whichever palette is set (default `standard`). The base layer also
sets `color-scheme` so scrollbars and native form chrome match. An explicit
`data-juno-mode` pins the mode and ignores the OS.

Other system preferences honored out of the box: `prefers-reduced-motion`
(animations collapse), `prefers-contrast: more` (hairlines step up to the
strong border), `prefers-reduced-transparency` (translucent surfaces go
solid), `forced-colors` (system palette). Language is the app's job — junoui
ships no strings and is RTL-safe via logical properties; set `lang`/`dir` and
the layout follows.

Switch at runtime:

```js
document.documentElement.dataset.junoPalette = 'colorblind';
document.documentElement.dataset.junoMode = 'light';
delete document.documentElement.dataset.junoMode; // back to following the OS
```

Use semantic variables and component classes:

```html
<span class="juno-badge juno--warning">WARNING</span>

<div style="color: var(--juno-nominal); padding: var(--juno-space-16);">…</div>
```

Want variables only (bring your own components)? Import `junoui/css/tokens`.

## SCSS

```scss
@use 'junoui/scss' as juno; // $juno-color-standard-dark-nominal, $juno-space-16, …
```

All variables are `!default`, so you can override before `@use` if you fork values.

## JS / TS

```ts
import { TOKENS, CORE, getTokens } from 'junoui';

getTokens('colorblind', 'light').warning; // "#BA4300"
TOKENS.standard.dark.nominal; // "oklch(73% 0.22 148)"
CORE.space['16']; // "16px"
```

Types ship with the package (`JunoPalette`, `JunoMode`, `JunoRole`, `JunoTheme`).

## Semantic vs explicit variables

- **Semantic** `--juno-nominal` … resolve to the _current_ theme. Use these in components.
- **Explicit** values for a specific theme live in SCSS/JS as
  `…-standard-dark-nominal`. Use only when you need a fixed theme regardless of context.

## Fonts

junoui **never fetches fonts** (a cross-origin `@import` would break a strict CSP and
phone home). `base.css` names B612 / B612 Mono via `--juno-font-family-*` but doesn't
load them. Two options:

```js
import 'junoui/fonts.css'; // opt-in: self-hosted B612 woff2, no network (CSP-safe)
```

…or bring your own B612 (e.g. `@fontsource/b612`). Without either, the UI falls back to
system sans/mono. See [integration.md](./integration.md#2-fonts-opt-in-csp-safe).
