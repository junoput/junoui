# Icon subsetting

junoui's sprite carries **every** icon it ships. That is right for a `<use>`
reference to an external file (the browser fetches it once, caches it, and
unused symbols cost nothing to render) — but Safari intermittently drops
external sprite refs, so apps inline the sprite instead
([`junoui/icons/inline`](../scripts/build-icons.mjs)), and an inlined sprite
puts every icon in the app's main bundle.

`junoui/subset` is the build-time half: a pure, dependency-free Node module a
consumer's build step runs over the shipped sprite.

```js
import { readFileSync } from 'node:fs';
import { subsetSprite, spriteSymbolNames } from '@junoput01/junoui/subset';

const sprite = readFileSync(new URL(import.meta.resolve('@junoput01/junoui/icons')), 'utf8');
const svg = subsetSprite(sprite, ['gear', 'x', 'squares-four']);
```

| Export                        | Returns                                                              |
| ----------------------------- | -------------------------------------------------------------------- |
| `spriteSymbolNames(sprite)`   | every icon name the sprite defines, in document order.               |
| `subsetSprite(sprite, names)` | the same sprite carrying only `names` — banner and wrapper verbatim. |

- **Names are bare icon names** (`'gear'`), never the prefixed symbol id.
- **An unknown name throws.** A silently dropped symbol renders as an empty
  `<svg>` in the app, which nobody notices until a user reports a blank space —
  so it fails the build instead.
- **The output is stable**: symbol order follows the sprite, not the request,
  so a reordered list produces a byte-identical file.
- **The MIT Phosphor notice survives the trim** — carrying it is a
  redistribution condition, so the banner is part of the contract, not
  decoration.
- Node-only tooling on purpose: subsetting at runtime would defeat the point.

## What is in the set

Phosphor Icons (bold), MIT — one family, one licence, vendored under
`src/icons/` with the licence beside them. Media, files, system and status,
plus a spatial group for map, GIS, CAD and 3D consumers: `crosshair`,
`crosshair-simple`, `ruler`, `polygon`, `path`, `map-pin`, `map-trifold`,
`stack`, `globe`, `mountains`, `cube`, `compass`, `scissors`, `selection`.

**Adding an icon means adding a Phosphor bold glyph.** Not "an icon that looks
similar" — the set's value is that it is one family, and a glyph from elsewhere
arrives on a different canvas, at a different optical weight, often carrying its
own `fill`. `test/icons-family.test.mjs` enforces the contract: one `0 0 256 256`
canvas, colour inherited via `currentColor`, no `<style>`, no classes, no
external references, and the sprite and `src/icons/` agreeing in both directions.

## Vite

```js
// vite.config.ts — a virtual module holding just this app's icons
import { subsetSprite } from '@junoput01/junoui/subset';

const ICONS = ['gear', 'x', 'squares-four']; // the app's manifest
const VIRTUAL = 'virtual:juno-icons-subset';

const iconSubset = {
  name: 'juno-icon-subset',
  resolveId: (id) => (id === VIRTUAL ? `\0${VIRTUAL}` : null),
  load(id) {
    if (id !== `\0${VIRTUAL}`) return null;
    const sprite = readFileSync(new URL(import.meta.resolve('@junoput01/junoui/icons')), 'utf8');
    return `export default ${JSON.stringify(subsetSprite(sprite, ICONS))}`;
  },
};
```

Keep the manifest where the app's own type for icon names is derived from it,
so a name that is not in the manifest is a **compile** error rather than a
blank space at runtime.

## Injecting a subset

Safari intermittently drops external sprite refs (`<use href="file.svg#id">`),
so the reliable path is a **same-document** ref — which means the sprite has to
live in the document. `junoui/icons/inline` does that for the full set and
auto-installs on import; a consumer that subsets wants the injection without
the 25 kB of symbols, so the mechanism ships separately:

```js
import { installSprite } from '@junoput01/junoui/icons/install';
import sprite from 'virtual:my-icon-subset'; // your build's subset (see above)

installSprite(sprite);
```

| Export                 | Carries                   | Use                                           |
| ---------------------- | ------------------------- | --------------------------------------------- |
| `junoui/icons/install` | ~1 kB, no icons           | You subset. Pass your own sprite.             |
| `junoui/icons/inline`  | the full 80-symbol sprite | You don't subset. Import for the side effect. |

- **Both are id-guarded on the same `juno-icon-sprite` holder**, so importing
  the full module alongside a subset does not produce two hidden holders
  shadowing each other — whichever installs first wins and the second call is a
  no-op returning `false`.
- `installSprite` returns `true` when it injected, `false` when a sprite was
  already present or there is no document (server-side, pre-hydration).
- Subsetting only pays off if the full module never enters the bundle: import
  `icons/install`, not `icons/inline`.
