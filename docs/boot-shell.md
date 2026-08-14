# Boot shell — fast first paint, everything else in the background

How a junoui app gets from a cold tap to a usable screen in under a frame's
worth of network, and loads everything else behind that first paint. This is
the pattern the Nexora web client ships (reference implementation:
`nexora/web/index.html`, `src/prefetch.ts`, `src/sw.ts`); the pieces are
junoui's, the ordering rules are what this page adds.

The measured budget it buys (Nexora, production build, cold cache, mid-tier
phone emulation): **first paint ~100 ms** from the HTML alone, ten requests and
~150 kB compressed to an interactive library, and every later screen arriving
from a background-warmed cache instead of a tap-time download.

## The boot ladder

A bundle-rendered app paints nothing until its JS is fetched, parsed and run —
on a phone that is a black screen for however long the network takes. The fix
is not one trick but a ladder; each rung paints strictly earlier than the one
below it, and each hands over to the next without moving a pixel:

| Rung                   | Paints                                    | Powered by                              |
| ---------------------- | ----------------------------------------- | --------------------------------------- |
| 1. Pre-bundle shell    | App chrome + skeleton, first HTML parse   | Inline `<style>` + static markup, no JS |
| 2. Cache-aware chrome  | Cached content at first framework commit  | Storage probe before the bundle         |
| 3. Default screen only | The one screen users land on              | Route-level code splitting              |
| 4. Background warming  | Nothing — pre-loads what a tap needs next | Idle + intent prefetch, link-class gate |
| 5. Offline shell       | Rung 1–3 with the network gone            | App-shell service worker                |

The invariant across all five: **content gets the network first.** Nothing
speculative — a chunk, a font half, a screen nobody opened — may run before the
first screenful of real content has been requested.

## Rung 1 — the pre-bundle shell

The first HTML parse paints the product frame: background, rail or dock, top
bar, and a shimmering tile wall — before any stylesheet or script arrives.
That means an inline `<style>` and static skeleton markup in `index.html`,
mirroring the geometry of the real [`.juno-app-shell`](./layout.md) that will
replace it. (In-app loading states use [`.juno-skeleton`](./components/skeleton.md);
this rung hand-rolls the same shimmer only because `juno.css` has not arrived
yet.)

`juno.css` is not loaded yet at this point in the document — that is the whole
point — so the shell uses **token literals**: the handful of `--juno-*` values
it needs, written out by hand. For the standard palette that is:

| Token           | Dark                  | Light                 |
| --------------- | --------------------- | --------------------- |
| `--juno-s0`     | `oklch(11% 0.010 85)` | `oklch(97% 0.008 85)` |
| `--juno-s1`     | `oklch(15% 0.012 85)` | `oklch(93% 0.010 85)` |
| `--juno-s2`     | `oklch(19% 0.012 85)` | `oklch(89% 0.010 85)` |
| `--juno-border` | `oklch(30% 0.012 85)` | `oklch(82% 0.010 85)` |

Minimal skeleton (adapt the boxes to your shell — the rule is that every box
mirrors a real chrome element at its real size, so the React/Vue/whatever
commit replaces it without anything jumping):

```html
<style>
  /* Token literals — juno.css is not here yet. Each mirrors a --juno-* token;
     keep them asserted against the consumed build (see "Guarding the copies"). */
  html {
    background: oklch(11% 0.01 85); /* --juno-s0, dark */
  }
  html[data-juno-mode='light'] {
    background: oklch(97% 0.008 85);
  }
  .boot {
    position: fixed;
    inset: 0;
    display: flex;
    --b-s1: oklch(15% 0.012 85);
    --b-s2: oklch(19% 0.012 85);
    --b-border: oklch(30% 0.012 85);
  }
  .boot-rail {
    flex: 0 0 180px;
    background: var(--b-s1);
    border-right: 1px solid var(--b-border);
  }
  .boot-wall {
    flex: 1;
    display: grid;
    gap: 10px;
    padding: 14px 16px;
    align-content: start;
    /* match the real wall's column math or tiles resnap at handover */
    grid-template-columns: repeat(auto-fill, minmax(min(108px, 100%), 1fr));
  }
  .boot-wall i {
    aspect-ratio: 1;
    border-radius: 6px;
    background: var(--b-s2);
    animation: boot-pulse 1.4s ease-in-out infinite;
  }
  @keyframes boot-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.45;
    }
  }
</style>
...
<body>
  <div id="root">
    <div class="boot" aria-hidden="true">
      <div class="boot-rail"></div>
      <div class="boot-wall"><i></i><i></i><i></i>…</div>
    </div>
  </div>
</body>
```

Rules that make this work rather than merely exist:

- **The frame is real chrome, not a wireframe.** Grey bands where the rail,
  top bar and dock will be read as a loading page. The same boxes styled
  exactly like their live counterparts — the dock as its floating pill with
  the active item's bubble already filled, the rail as brand + one row per
  destination with the accent edge on the active one, the top bar as its
  chips and search field — read as the app, already open. The shimmer is
  confined to the slots whose content genuinely is not there yet: icons,
  labels, thumbnails. Placeholders are for content, never for chrome.
- **No real text in the shell.** The fonts arrive with the bundle, and a
  system-font word swapping to the real face at handover is exactly the kind
  of jump the shell exists to prevent. Label and wordmark slots are bars.
- **Every literal mirrors one real element.** Safe-area padding, tile column
  minimums (`--juno-tile-min`), tap-target sizes (`--juno-size-tap-comfortable`
  = 44px), dock geometry — if the skeleton reserves a different amount than the
  real chrome, the layout jumps by exactly the difference at handover, which
  reads worse than a plain spinner.
- **The framework replaces `#root`'s children at its first commit** — no
  removal code, no fade choreography. The skeleton needs zero JS.
- **`aria-hidden="true"`** on the whole skeleton: it is paint, not content.
- Honor `data-juno-mode` in the literals too (both modes in the snippet above),
  or a light-mode user gets a dark flash.

## Rung 2 — cache-aware chrome

The pulsing skeleton is right exactly once: on a true first run, when the
device holds nothing to draw. Every later launch should hydrate its first
framework commit from local cache (a persisted window of content in
`localStorage`/IndexedDB) — and shimmering in front of data the device already
has is a loading state in front of nothing.

So a tiny inline script — before the shell's markup — probes storage and
stamps the answer on the root element:

```html
<script>
  (function () {
    var warm = false;
    try {
      var win = JSON.parse(localStorage.getItem('app.contentCache') || 'null');
      warm = !!(win && win.tiles && win.tiles.length);
    } catch (e) {
      /* unreadable storage = first run */
    }
    document.documentElement.setAttribute('data-boot', warm ? 'warm' : 'cold');
  })();
</script>
```

```css
/* warm: chrome outlines only — the real content is about to commit */
html[data-boot='warm'] .boot-wall > i {
  display: none;
}
```

Two contracts, both load-bearing:

- **Fail to `cold`.** A broken read produces today's behaviour (a skeleton),
  never a wrongly quiet screen. The key strings are duplicated from the app's
  cache module by necessity — no module has loaded yet — so drift must land on
  the harmless side.
- **This is chrome, never content, and never authorization.** The probe decides
  which skeleton to paint. The app's own gated read path is still the only
  thing that may put cached data on screen — a cache read is an authorization
  boundary, and this script must never become one.

## Rung 3 — ship only the default screen

The first bundle contains the screen users land on and nothing else. Every
other screen is a route-level lazy chunk, fetched on first navigation:

```jsx
const Settings = lazy(() => import('./screens/Settings'));
```

The shell stays painted while a chunk loads — `Suspense` (or your framework's
equivalent) drops a [`.juno-arc`](./components/loader.md) into the main
region, and a nav destination that is loading gets `.juno-icon-loader` (the
icon ringed by the spinning arc) instead of a bare spinner. Heavy libraries a
rare media kind needs (3D, panorama) split again below the screen level, so
"Settings" never pays for three.js.

## Rung 4 — background warming

Lazy chunks trade boot weight for a spinner at tap time — the worst moment for
one, because the user just pointed at a specific thing. The trade only
completes when the chunks arrive **in the background, before the tap**:

- **After content, never before.** Warming starts once the first page of real
  content has landed (or provably isn't coming: no backend configured,
  connection failed). Content gets the network first — that is the ordering
  rule, and it should be a pure, testable predicate in code.
- **Idle trigger:** one chunk per `requestIdleCallback` slot, ordered by how
  likely a phone user is to reach each screen — never the whole list in one
  burst.
- **Intent trigger:** first `pointerdown` on anything that leads to a lazy
  screen warms that screen immediately — insurance for when idle never comes.
- **Gate on the link class.** `Save-Data`, metered connections, or an explicit
  user setting mean speculative bytes are not yours to spend. One module owns
  that judgement; warming asks it, never decides itself.
- **Don't warm everything.** Screens that are large and rarely reached from a
  phone stay cold on purpose. Warming is a bet; size the stake to the odds.

The same triggers and the same gate apply to warming **data** (next pages of
content, thumbnails around the viewport) — same budget, same ordering rule.

## Rung 5 — the offline shell

An app-shell service worker precaches rungs 1–3 (`js`, `css`, `html`, `woff2`,
icon `svg`) so a cold start with no network still paints the full ladder.
Boundaries that keep it honest:

- **Precache the shell, not the long tail.** The rarely-used heavy chunks from
  rung 3 are excluded — precaching them would make every install download
  hundreds of kB to speed up a path almost nobody takes.
- **Content requests bypass the worker entirely** when the app has its own
  authenticated content cache — two caches for one byte is a purge bug waiting
  to happen.
- **Hand over on cold start only** (no mid-session `skipWaiting`), and ship a
  kill switch (`?sw=off`) — a cached shell can otherwise hide fresh code from
  every reload.

### Fonts

Fonts block the first _text_ paint, so they ride the critical path: subset by
`unicode-range` (basic Latin separate from accented extensions) and let the
service worker precache all halves for later sessions. Nexora's split took the
critical-path font bytes from 72 kB to 28 kB with identical glyph coverage.

## Guarding the copies

The pattern requires literal duplicates — token values, cache key strings,
safe-area expressions — in a file no bundler touches. Prose ("keep in sync")
does not keep them in sync; tests do:

- **Assert literals against the consumed build.** A unit test reads
  `node_modules/junoui/dist/css/juno.css` (or `dist/json/tokens.json`) and the
  app's `index.html`, and fails when a literal no longer matches its token —
  including after a junoui version bump, which is exactly when it drifts.
- **Fail toward the harmless side.** Every probe in rung 2 is written so an
  error lands on `cold`/absent — the pre-existing behaviour — never on a wrong
  positive.
- **Verify through the server, not the repo.** First-paint claims are measured
  from a served build with a cold cache (headless browser, CPU throttled), not
  inferred from bundle sizes. A dev server is the wrong instrument: it serves
  the unbundled module graph (Nexora: 80 requests where the build makes 10) and
  its numbers say nothing about what users get.

## Serving the ladder

None of the rungs exist on a dev server: it ships the unbundled module graph,
React's dev build, no minification, and it cannot register a service worker.
The dev server is the workshop; every demo anyone judges the app's speed by
serves the **production build**. A standing demo that still picks up every
change is three processes under one supervisor:

```sh
vite build --watch    # rebuilds dist/ a few seconds after any source change
vite preview --host   # serves dist/ (with the app's API proxy)
```

plus whatever restart loop keeps them alive. Properties that fall out:

- **Rebuild is content-addressed.** Hashed asset names mean an unchanged
  module keeps its URL — reloads after a rebuild refetch only what changed.
- **The watch build skips type-checking.** Fine for a demo (CI still gates);
  know that a type error will not stop the demo from rebuilding.
- **Each rebuild empties the output directory.** Anything placed in `dist/`
  by hand (a connect page, a fixture) needs a guard that puts it back.
- **Secure context or no service worker.** On real devices the SW half of the
  ladder needs HTTPS; plain-http demos still get the pre-bundle shell, warm
  boot and the content caches — relaunches paint instantly and refetch only
  code.

Measured on the reference implementation the day this section landed, same
port that previously ran the dev server: cold = 13 requests; relaunch = 12 of
13 served by the service worker, first-paint 32 ms.
