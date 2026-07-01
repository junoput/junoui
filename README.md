# junoui — junoui design system

The single graphics source for all junoput UIs. You build the UI skeleton; junoui
defines colors, spacing, typography, radii and sizing. Tokens are authored once and
compiled to every platform.

**Semantic-first:** color encodes status, never decoration —
every hue has one role (NOMINAL · ACTIVE · TARGET · CAUTION · WARNING).

## Install

```sh
npm install junoui
```

```js
import 'junoui/css'; // styles + 30+ components
import { TOKENS, getTokens } from 'junoui'; // values in JS/TS
// icons: the SVG sprite resolves at 'junoui/icons'
```

```html
<html data-juno-palette="standard" data-juno-mode="dark">
  <span class="juno-badge juno--warning">WARNING</span>
  <svg class="juno-icon juno--active" aria-hidden="true">
    <use href="node_modules/junoui/dist/icons/juno-icons.svg#juno-i-bell" />
  </svg>
</html>
```

3 palettes (`standard` · `colorblind` · `soft`) × 2 modes (`dark` · `light`),
switched by two HTML attributes.

## Platforms

One source → every target. Web keeps authored `oklch()`; native/Flutter get
build-time sRGB hex (identical rendering).

| Web              | Native                     | Cross-platform                  |
| ---------------- | -------------------------- | ------------------------------- |
| CSS, SCSS, JS/TS | Android (xml), iOS (Swift) | Flutter (Dart), JSON (W3C DTCG) |

## Documentation

|                                                                                  |                                                              |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [Getting started](./docs/getting-started.md)                                     | Install, model, what ships                                   |
| [Integration](./docs/integration.md)                                             | Consuming in an app: import order, fonts, token bridge       |
| [Web](./docs/web.md) · [Native](./docs/native.md) · [Flutter](./docs/flutter.md) | Per-platform usage                                           |
| [Design guidelines](./docs/design-guidelines.md)                                 | Color semantics, a11y — for any tool                         |
| [Layout](./docs/layout.md)                                                       | Responsive primitives + container queries (how blocks adapt) |
| [Accessibility](./docs/accessibility.md)                                         | Color, focus, motion, targets, forced-colors, RTL, ARIA      |
| [Token reference](./docs/tokens-reference.md)                                    | Every token + value + platform name (generated)              |
| [Components](./docs/components/README.md)                                        | 30+ — forms, overlays, table, alerts, tabs, icons, nav, more |
| [Contributing](./CONTRIBUTING.md)                                                | Add tokens/components, lint, test, release                   |
| [Roadmap](./docs/roadmap.md)                                                     | Missing capabilities, prioritised                            |

## Repository

```
tokens/        DTCG token source — the single source of truth
src/css/       authored CSS layer (base, utilities, components)
src/icons/     vendored SVG icon sources (Phosphor bold, MIT) → sprite
dist/          built outputs (generated; gitignored)
docs/          guides + generated token reference
showcase/      interactive demo (repo-only — not in the npm package)
scripts/       build helpers (css bundle, doc gen, color conversion)
design/        original Claude Design canvas source (reference)
```

## Develop

```sh
npm install          # installs deps and builds dist/ (prepare)
npm run build        # tokens (Style Dictionary) + CSS bundle + icon sprite
npm run gen-docs     # regenerate docs/tokens-reference.md
npm run showcase     # build + serve the showcase at :8137
npm test             # build + node:test integrity suite
npm run test:visual  # Playwright screenshot diff (needs `npx playwright install chromium`)
```

Edit values in `tokens/`, rebuild, and every platform updates together.
The interactive demo lives at `showcase/` and is excluded from the published package.

## Releasing

Versioning + changelog are automated with [Changesets](https://github.com/changesets/changesets).
Add a changeset with your change (`npm run changeset`); on merge to `main`, CI opens a
"Version Packages" PR, and merging that publishes to npm. Bump by the token contract:
remove/rename a token or class → major, additive → minor, fix → patch. See
[CONTRIBUTING](./CONTRIBUTING.md#releasing).

## License

MIT
