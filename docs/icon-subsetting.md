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
