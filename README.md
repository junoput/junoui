# junoui — junoui design system

The single graphics source for all junoput UIs. You build the UI skeleton; junoui
defines colors, spacing, typography, radii and sizing. Tokens are authored once and
compiled to every platform.

**Aviation-inspired, semantic-first:** color encodes status, never decoration —
every hue has one role (NOMINAL · ACTIVE · TARGET · CAUTION · WARNING).

## Install

```sh
npm install junoui
```

```js
import 'junoui/css'; // styles + components
import { TOKENS, getTokens } from 'junoui'; // values in JS/TS
```

```html
<html data-juno-palette="standard" data-juno-mode="dark">
  <span class="juno-badge juno--warning">WARNING</span>
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
| [Web](./docs/web.md) · [Native](./docs/native.md) · [Flutter](./docs/flutter.md) | Per-platform usage                                           |
| [Design guidelines](./docs/design-guidelines.md)                                 | Color semantics, a11y — for any tool                         |
| [Layout](./docs/layout.md)                                                       | Responsive primitives + container queries (how blocks adapt) |
| [Token reference](./docs/tokens-reference.md)                                    | Every token + value + platform name (generated)              |
| [Components](./docs/components/README.md)                                        | Badge, button, card, readout, status dot                     |

## Repository

```
tokens/        DTCG token source — the single source of truth
src/css/       authored CSS layer (base, utilities, components)
dist/          built outputs (generated; gitignored)
docs/          guides + generated token reference
showcase/      interactive demo (repo-only — not in the npm package)
scripts/       build helpers (css bundle, doc gen, color conversion)
design/        original Claude Design canvas source (reference)
```

## Develop

```sh
npm install          # installs deps and builds dist/ (prepare)
npm run build        # tokens (Style Dictionary) + CSS bundle
npm run gen-docs     # regenerate docs/tokens-reference.md
npm run serve        # build + serve the showcase at :8137
```

Edit values in `tokens/`, rebuild, and every platform updates together.
The interactive demo lives at `showcase/` and is excluded from the published package.

## Releasing

Tag `vX.Y.Z` → CI builds, verifies all `dist` outputs, checks the token reference is
current, and publishes to npm. Token value/name changes are breaking (semver major).

## License

MIT
