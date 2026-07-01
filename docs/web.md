# Web (CSS / SCSS / JS)

## CSS — the fast path

Import the full stylesheet (tokens + base + utilities + components):

```js
import 'junoui/css'; // bundler
```

```css
@import 'junoui/css'; /* plain CSS */
```

Set the theme with two attributes on `<html>` (defaults are `standard` / `dark`):

```html
<html data-juno-palette="standard" data-juno-mode="dark"></html>
```

Switch at runtime:

```js
document.documentElement.dataset.junoPalette = 'colorblind';
document.documentElement.dataset.junoMode = 'light';
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
