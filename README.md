# junoui — a modern, accessible UI foundation

junoui is a design system for building interfaces that are **modern, futuristic and
visually pleasing** while staying **highly readable and genuinely accessible** — for
critical systems where legibility is a safety concern, and for everyday apps that
simply deserve to feel good to use.

Mechanically, it is the single graphics source for your UIs: you build the UI
skeleton; junoui defines color, spacing, typography, radii and sizing. Tokens are
authored once and compiled to every platform.

## Goals

- **Look modern.** A futuristic, cohesive aesthetic — dark-first, high-contrast OKLCH
  color, mono numerics, deliberate density and motion — that reads as considered, not
  decorated.
- **Be accessible by reference, not by vibes.** Built to the international web
  accessibility standards — **WCAG 2.2** (AA throughout, AAA where it counts) and
  **WAI-ARIA** — and we cite the exact success criteria we meet, per component. See
  [Accessibility](./docs/accessibility.md).
- **Stay readable.** High text contrast, fixed-width digits that don't jitter,
  color-blind-safe palettes, a low-fatigue `soft` palette, and visible focus at all
  times. Readability is the default, not an option you switch on.
- **Keep improving.** Usability and accessibility are a moving target; junoui treats
  them as ongoing work — tightening contrast, coverage and standards references release
  over release, never regressing them.

**Semantic-first:** color encodes status, never decoration —
every hue has one role (NOMINAL · ACTIVE · TARGET · CAUTION · WARNING).

## Install

```sh
npm install @junoput01/junoui
```

```js
import '@junoput01/junoui/css'; // styles + 30+ components
import { TOKENS, getTokens } from '@junoput01/junoui'; // values in JS/TS
// icons: the SVG sprite resolves at '@junoput01/junoui/icons'
```

```html
<html data-juno-palette="standard" data-juno-mode="dark">
  <span class="juno-badge juno--warning">WARNING</span>
  <svg class="juno-icon juno--active" aria-hidden="true">
    <use href="node_modules/@junoput01/junoui/dist/icons/juno-icons.svg#juno-i-bell" />
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

## Browser support

**Supported floor: Safari / iOS 17.5, Chrome / Edge 117, Firefox 129.**
Below **17.0 / 114 / 125** (the `browserslist` in `package.json`) the Popover
API is absent and the overlay surfaces — menu, popover, tooltip, and the
pillbar's overflow slot — stop working; junoui ships an `@supports` guard so
they are absent rather than invisibly blocking taps. Between the two floors
everything functions and entry animations are missing. Full fidelity, including
anchored placement for those surfaces, wants Safari 26.

CSS failures are silent — an unsupported at-rule is dropped, never reported —
so the degrade-vs-break audit, the version table and the guard rule live in
**[browser-support.md](./docs/browser-support.md)**. Read it before adding a
feature newer than the floor.

## Documentation

|                                                                                  |                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [Getting started](./docs/getting-started.md)                                     | Install, model, what ships                                    |
| [Integration](./docs/integration.md)                                             | Consuming in an app: import order, fonts, token bridge        |
| [Web](./docs/web.md) · [Native](./docs/native.md) · [Flutter](./docs/flutter.md) | Per-platform usage                                            |
| [Design guidelines](./docs/design-guidelines.md)                                 | Color semantics, a11y — for any tool                          |
| [Layout](./docs/layout.md)                                                       | Responsive primitives + container queries (how blocks adapt)  |
| [Boot shell](./docs/boot-shell.md)                                               | Fast first paint: pre-bundle shell, lazy screens, warming     |
| [Accessibility](./docs/accessibility.md)                                         | WCAG 2.2 + WAI-ARIA references, focus, motion, targets, RTL   |
| [iOS conformance](./docs/ios-conformance.md)                                     | Sourced iOS metrics — safe areas, tap targets, viewport units |
| [Browser support](./docs/browser-support.md)                                     | The supported floor, what degrades below it, what breaks      |
| [Token reference](./docs/tokens-reference.md)                                    | Every token + value + platform name (generated)               |
| [Components](./docs/components/README.md)                                        | 30+ — forms, overlays, table, alerts, tabs, icons, nav, more  |
| [Contributing](./CONTRIBUTING.md)                                                | Add tokens/components, lint, test, release                    |
| [Roadmap](./docs/roadmap.md)                                                     | Missing capabilities, prioritised                             |

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

Versioning, changelog and npm publish are fully automated with
[Changesets](https://github.com/changesets/changesets). Add a changeset with your
change (`npm run changeset`) and open your PR. On merge to `main`, the Changesets
GitHub Action opens (or updates) a **"chore: version packages"** PR that applies the
pending changesets and bumps the version; merging _that_ PR — once no changesets
remain — publishes `@junoput01/junoui` to npm automatically. No manual `npm run
version` step. Bump by the token contract: remove/rename a token or class → major,
additive → minor, fix → patch. See [CONTRIBUTING](./CONTRIBUTING.md#releasing).

## License

MIT
