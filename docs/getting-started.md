# Getting started

junoui is a design system for **modern, futuristic, highly readable and accessible**
UIs — usable for critical systems and everyday apps alike. Mechanically it is the
single graphics source for your UIs: colors, spacing, typography, radii, sizing. You
build the UI skeleton; junoui defines how it looks. Tokens are authored once in
`tokens/` and compiled to every platform.

Accessibility is a first-class goal, held to the international standards (WCAG 2.2 +
WAI-ARIA) with the exact criteria cited per component — see
[accessibility.md](./accessibility.md).

## Install

```sh
npm install @junoput01/junoui
```

Or as a git submodule (then build once):

```sh
git submodule add git@github.com:junoput/junoui.git vendor/junoui
cd vendor/junoui && npm install   # `prepare` builds dist/
```

`npm install` runs the `prepare` script, so `dist/` is always built for you.

## Required: the viewport meta

Ship this on every page. It is not optional if you use anything that touches a
phone edge — the dock, pillbar, navbar, drawer, bottom sheet, toast, or the
app-shell:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

Two things depend on it, and both fail **silently**:

- **`viewport-fit=cover` turns the safe area on.** iOS defaults `viewport-fit`
  to `auto`, and WebKit reports every `env(safe-area-inset-*)` as `0` unless you
  opt in with `cover` (`contain` does _not_ opt out). junoui is a stylesheet — it
  cannot set this meta for you. Without it, every safe-area guarantee in the
  library quietly becomes a no-op and content sits under the home indicator.
- **`width=device-width, initial-scale=1` makes 1 CSS px equal 1 Apple point**,
  which is what makes junoui's `44px` tap targets actually 44pt on the device.
  Without it iOS Safari lays out at ~980px wide and every metric is off.

Details and sources: [ios-conformance.md](./ios-conformance.md).

## The model

- **Palette** — `standard` · `colorblind` · `soft`
- **Mode** — `dark` · `light`
- **Role** — `nominal` `active` `target` `caution` `warning` (semantic) and
  `data` `label` `muted` `border` `s0`–`s3` (neutral/surface)

A theme is one palette × one mode. Color always encodes status — see
[design-guidelines.md](./design-guidelines.md).

## Pick your platform

| You're building in…                    | Read                                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Web (CSS, SCSS, JS/TS)                 | [web.md](./web.md)                                                                                           |
| Android / iOS                          | [native.md](./native.md)                                                                                     |
| Flutter                                | [flutter.md](./flutter.md)                                                                                   |
| Figma / Sketch / any tool without code | [tokens-reference.md](./tokens-reference.md) (exact values) + [design-guidelines.md](./design-guidelines.md) |

Responsive behavior (how blocks adapt on resize) is its own layer:
[layout.md](./layout.md).

## What ships

`npm install @junoput01/junoui` delivers `dist/` (all platform outputs), `src/css/` (authored
stylesheet sources), `src/icons/` (SVG icon sources + license), and `src/fonts/`
(self-hosted B612 woff2 + OFL license). The interactive demo in `showcase/` is **not**
shipped — it lives in the repo for development only.

## Build outputs

| Path                                      | Platform                                                      |
| ----------------------------------------- | ------------------------------------------------------------- |
| `dist/css/juno.css`                       | Web — tokens + base + utilities + components                  |
| `dist/css/juno-tokens.css`                | Web — CSS variables only                                      |
| `dist/css/juno-fonts.css` + `dist/fonts/` | Web — opt-in self-hosted B612 (`@junoput01/junoui/fonts.css`) |
| `dist/icons/juno-icons.svg`               | Web — icon sprite (`@junoput01/junoui/icons`)                 |
| `dist/scss/_juno-tokens.scss`             | Web — SCSS variables                                          |
| `dist/js/tokens.js` + `.d.ts`             | JS / TS — `TOKENS`, `CORE`, `getTokens()`                     |
| `dist/json/tokens.json`                   | W3C DTCG — any tool                                           |
| `dist/android/colors.xml` · `dimens.xml`  | Android                                                       |
| `dist/ios/JunoTokens.swift`               | iOS                                                           |
| `dist/flutter/juno_tokens.dart`           | Flutter                                                       |
