# iOS conformance

What junoui encodes for iOS, **with sources**, and — just as important — what it
deliberately does _not_ encode because no primary source supports it.

Most numbers the design community attributes to Apple are not in Apple's text.
This page exists so nobody re-derives folklore, and so nobody "fixes" a correct
value into a wrong one later.

This page is about **metrics and behaviour** on iOS. For _which iOS versions
junoui runs on at all_ — the supported floor, what degrades below it, and what
breaks — see [browser-support.md](./browser-support.md).

> **Verifying anything here.** Apple's HIG is a JavaScript app: a plain `curl`
> returns an empty shell. Check the backing DocC JSON instead —
> `developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`.
> Also pin a Wayback snapshot: the HIG silently drops guidance (see the 44pt
> story below). State verified 2026-08-03.

## The units question, first

**One Apple point = one CSS pixel.** Apple's `pt` is a density-independent
point, not the CSS typographic point; `devicePixelRatio` absorbs @2x/@3x. So
Apple's 44pt is CSS `44px`.

Converting through the CSS unit (`1pt = 1/72in`, `1px = 1/96in` → 44pt =
58.67px) is **wrong**. If you ever see 58.67 in this codebase, it is a bug.

This identity holds only when the page ships
`<meta name="viewport" content="width=device-width, initial-scale=1">`. Without
it iOS Safari lays out at ~980px and every metric drifts.

- Source: [css-values-4](https://www.w3.org/TR/css-values-4/) for the CSS units,
  [WebKit iPhone X guide](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
  for the viewport model.

## Touch targets

| What                                          | Value                                                    | Status                      |
| --------------------------------------------- | -------------------------------------------------------- | --------------------------- |
| WCAG 2.2 SC 2.5.8 Target Size (Minimum)       | **24×24 CSS px**                                         | **Hard requirement** for AA |
| WCAG 2.2 SC 2.5.5 Target Size (Enhanced)      | **44×44 CSS px**                                         | AAA (recommendation tier)   |
| HIG Buttons — hit region                      | **44×44 pt** ("needs a hit region of at least 44×44 pt") | Recommendation              |
| HIG Accessibility — control size (iOS/iPadOS) | **44×44 pt default, 28×28 pt minimum**                   | Recommendation              |
| HIG Accessibility — padding between controls  | **~12 pt** bezeled, **~24 pt** non-bezeled               | Recommendation, hedged      |

junoui encodes `--juno-size-tap-min` = 24px (the AA floor) and
`--juno-size-tap-comfortable` = 44px, and promotes the former to the latter
under `@media (pointer: coarse)` — see [accessibility.md](./accessibility.md).

- Sources: [WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
  [WCAG 2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html),
  [HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility),
  [HIG Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons).

### Folklore, named

- **"Apple mandates a 44pt _minimum_ tap target — see HIG Layout."** That
  sentence has been **deleted**. The current Layout page contains no tap-target
  number at all (`"44x44"` and `"tappable"` both return zero hits); a 2023
  Wayback snapshot of the same endpoint still has it. Every checklist citing
  that URL cites a dead page. What survives is the Buttons wording above.
- **"44px because WCAG."** Wrong at AA — the AA floor is 24px. 44 is Apple's
  number, which WCAG AAA happens to match. W3C never says it derived 44 from
  Apple.

## Spacing

**Apple publishes no numeric spacing scale for iOS.** No 4pt or 8pt grid, no
named spacing steps, no layout-margin or gutter constants, no readable-width
number. Standard margins are delegated to system layout guides.

The only Apple-published numbers found anywhere:

- **~12 pt / ~24 pt** control padding (HIG Accessibility, hedged: "in general",
  "about", "works well").
- **8 pt** — `UIView.directionalLayoutMargins` default. This is a **UIKit API
  default, not an HIG design rule**; cite it as such.

So: **"Apple's 8pt grid" and "HIG standard margins are 16–20pt" are folklore.**
junoui's spacing scale is junoui's own; do not claim Apple provenance for it.

- Source: [HIG Layout](https://developer.apple.com/design/human-interface-guidelines/layout),
  [UIView.directionalLayoutMargins](https://developer.apple.com/documentation/uikit/uiview/directionallayoutmargins).

## Safe areas

`env(safe-area-inset-top|right|bottom|left)` — four variables, iOS 11 (shipped
as `constant()` in 11.0, renamed `env()` in 11.2). There is no numeric constant
to hardcode; values are system-supplied and vary by device.

**They are inert unless the page opts in.** `viewport-fit` defaults to `auto`,
and WebKit reports every inset as `0` until you set `cover`. `contain` does
_not_ opt out — only `cover` does. junoui is a stylesheet and cannot set this
for you, so it is stated as a hard requirement in
[getting-started.md](./getting-started.md), every showcase page carries it, and
a build test enforces that.

- Sources: [WebKit iPhone X guide](https://webkit.org/blog/7929/designing-websites-for-iphone-x/),
  [WebKit bug 272779](https://bugs.webkit.org/show_bug.cgi?id=272779),
  [css-env-1](https://www.w3.org/TR/css-env-1/).
- Spec ownership, for citation hygiene: `env()` and `safe-area-inset-*` are
  **css-env-1**; `viewport-fit` is **css-round-display-1**. CSS Viewport Module
  L1 defines none of them — citing it is misattribution.

### `max()` vs addition — the rule

WebKit's documented pattern is `padding-left: max(12px, env(safe-area-inset-left))`
— "the default padding **or** the safe area inset, whichever is greater". (The
`12px` there is an arbitrary demo value, not an Apple metric.)

That pattern applies to **padding on a surface that reaches the screen edge**:
the inset's job is to push content clear of the cutout, so it _replaces_ your
baseline rather than stacking on it.

It does **not** apply to a **floating element positioned off the edge**, where
addition is correct:

```css
/* floating pill: sit 16px ABOVE the home-indicator region */
inset-block-end: calc(var(--juno-space-16) + env(safe-area-inset-bottom, 0px));

/* NOT max() — that would park the pill flush against the indicator */
```

Nor to the **clearance tokens** (`--juno-dock-clearance`,
`--juno-pillbar-clearance`), where content must clear the control's height _and_
the inset beneath it — genuinely additive.

junoui's call sites were audited against this rule (2026-08-03) and the additive
ones are correct as written. Do not "fix" them to `max()` without re-reading
this section.

### The unit trap

Inside `calc()`, an env() fallback **must carry a unit**:

```css
/* WRONG — unitless 0 is a <number>, the sum is invalid, and the whole
   DECLARATION is dropped (it does not evaluate to zero) */
padding-block-end: calc(var(--juno-space-12) + env(safe-area-inset-bottom, 0));

/* RIGHT */
padding-block-end: calc(var(--juno-space-12) + env(safe-area-inset-bottom, 0px));
```

A bare (non-`calc`) value may keep a unitless `0`. A build test enforces this.
Note this follows from ordinary CSS type rules; no Apple/WebKit source states it
specifically. The adjacent _confirmed_ unit pitfall is that the
`@supports (padding: max(0px))` feature test needs a unit — and that `@supports`
wrapper is itself obsolete boilerplate in 2026.

## Viewport units

CSS defines three families by how dynamic browser chrome is treated:
`sv*` (chrome assumed **expanded** — smallest), `lv*` (assumed **retracted** —
largest), `dv*` (tracked live). **The unprefixed `vh`/`vw` are normatively equal
to `lv*`** — that is the spec-level cause of the classic `100vh` overflow: a
`100vh` box is sized as if the toolbar were retracted.

junoui uses **zero raw `vh`**. Full-height surfaces use `dvh`
(`layout.css`, `drawer.css`) and `85dvh` caps the bottom sheet.

Caveats that constrain the choice:

- `dv*` is explicitly **not stable** and not guaranteed to update every frame,
  so it can churn while the address bar collapses. `sv*` never overflows.
- iOS shipped viewport-unit bugs into the **iOS 26** era: Safari 26.0 fixed
  `lvh`/`vh` being sized against the _small_ viewport in `SFSafariViewController`.
  The underlying WebKit bug (255708, filed 2023) is **still open**, so Apple's
  "Fixed" is stronger than the tracker supports. Scope is the in-app browser used
  by Slack/X — not standalone Safari, and not `WKWebView`-based in-app browsers
  (Instagram/Facebook), a separate unfixed path.
- Do **not** reach for `env(safe-area-max-inset-*)` as a fix. It is in css-env-1
  but could not be confirmed shipping in any engine.

- Sources: [css-values-4 §6.1.2.1](https://www.w3.org/TR/css-values-4/),
  [csswg-drafts#6454](https://github.com/w3c/csswg-drafts/issues/6454),
  [Safari 26.0 release notes](https://developer.apple.com/documentation/safari-release-notes/safari-26-release-notes),
  [WebKit bug 255708](https://bugs.webkit.org/show_bug.cgi?id=255708).

### The decision: `dvh` stays at both call sites

Decided 2026-08-15 (ticket 20260803-033, step 1). `dvh` is kept for **both**
`.juno-app-shell` and `.juno-drawer`, against the "`sv*` is the calm choice"
instinct above. The reasoning below is the part to read: it generalises, the
verdict does not.

**First, price the two options at the only moment they differ** — when browser
chrome retracts. There is no other moment. Before it and after it, whichever
unit you picked is simply the current viewport.

|       | what it costs when chrome retracts                                                                                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dvh` | The surface **grows**, so it relayouts. `dv*` is not frame-guaranteed, so that growth can arrive late or in steps. If the surface contains a scroller, the scroll port changes height _during the scroll that caused the retraction_. |
| `svh` | The surface **does not move** — and is now short by `lvh − svh`. That gap is permanent for the rest of the session, and it is at the bottom edge, where the page background shows through under whatever the surface pinned there.    |

So this is not "stable vs twitchy". It is **one relayout** against **a permanent
dead strip**. Pick by asking which of those the surface can afford.

**`.juno-app-shell` — `block-size: 100dvh` (`layout.css`).** The shell's whole
job is to hold the dock against the bottom edge. Under `svh` the dock detaches
from that edge the first time the user scrolls and stays detached, floating
`lvh − svh` px up with page background beneath it — a visible defect on every
subsequent frame, under the primary navigation. The `dvh` relayout it avoids is
cheap here by construction: the shell is `overflow: hidden` and the scrolling
lives in `.juno-app-shell__main`, so growing the shell grows the scroll port and
moves the dock. **No text reflows** — no line breaking, no measured content, no
intrinsic sizing is touched. One cheap relayout beats a permanent gap.

**`.juno-drawer` — `block-size: 100dvh; max-block-size: 100dvh`
(`drawer.css`), and the same for the `--bottom` sheet's `60dvh`/`92dvh` and the
modal's `85dvh` cap.** Here the `dv*` instability **cannot bite at all**, and
that is the whole argument. The drawer is a `<dialog>` opened with
`showModal()`: it is in the top layer and the document beneath it is inert. iOS
Safari retracts and expands chrome in response to _document_ scroll — an inner
overflow scroller does not drive it — so chrome cannot change state for the
drawer's whole lifetime. `dvh` therefore never churns, and `svh` cannot prevent
an overflow that cannot happen. What `svh` _would_ still do is leave the gap:
open the drawer after scrolling (the ordinary case — you scroll, then reach for
the menu) and chrome is already retracted, so a `svh` drawer stops
`lvh − svh` px short of the bottom of a screen it is supposed to fill. `svh`
here is a pure loss.

> **The exception, and it is the app's to own.** A `<dialog>` opened with the
> `open` **attribute** instead of `showModal()` is _not_ in the top layer and
> does **not** block page scroll. Behind such a drawer the page scrolls, chrome
> retracts, and the churn is live. junoui's CSS cannot tell the two open paths
> apart. The drawer is documented as `showModal()`
> ([drawer.md](./components/drawer.md)); open it non-modally and the churn is yours.

### The rule, for a component that does not exist yet

Ask one question — **can browser chrome change state while this surface is on
screen?** — and then:

1. **It can, and the surface is anchored to the bottom edge** (or contains
   something that is: a dock, a pillbar, a sticky footer) → **`dvh`**. You are
   buying edge-adherence and paying one relayout per chrome transition.
2. **It can, and the surface must not resize once laid out** — content whose
   height JS measures, a canvas, an animation mid-flight, anything where a
   late reflow is worse than a gap → **`svh`**. You are buying stability and
   paying up to `lvh − svh` of dead space, permanently.
3. **It cannot** — top-layer surfaces (`showModal()` dialogs, `popover`), where
   the page beneath is inert → **`dvh`**, always. `svh` there buys nothing and
   still pays the gap on any surface opened while chrome is retracted.
4. **Never `vh` / `lvh` for a height that must fit.** `vh == lvh` sizes as if
   chrome were retracted, so on a page where it is _not_, the box overflows by
   exactly the chrome's height. That is the classic `100vh` bug and it is a
   spec consequence, not a browser bug. The one legitimate `lvh` in this
   codebase is the standalone unlock's spacer (`base.css`), which is _supposed_
   to overflow.

**In `display-mode: standalone` this whole decision is moot** — there is no
retractable chrome, so `svh == dvh`. Measured on the device: `100dvh`,
`100svh` and `100%` all resolve to 812 while `100lvh` and `100vh` resolve to
874, which is the letterbox defect below, not a chrome transition.

### A note on raw `vw`

"Zero raw `vh`" is about **`vh`**. junoui does use raw `vw` in five places
(`layout.css:18`, `pillbar.css:231`, `popover.css:33`, `toast.css:26`,
`drawer.css:116`) and that is deliberate: horizontal chrome does not retract,
so `vw`/`lvw`/`svw`/`dvw` are the same number and the `vh` trap has no
horizontal twin. The real `vw` hazard is different — `100vw` includes the
classic scrollbar gutter, so a full-bleed `100vw` box overflows a desktop page
that has a scrollbar. Every call site above either caps well below `100vw`
(`min(…, 240px)`, `min(360px, …)`, `85vw`, `clamp()`) or subtracts more than a
scrollbar's width (`calc(100vw - var(--juno-space-24))`). Keep it that way; a
bare `inline-size: 100vw` is a bug.

## Home-Screen standalone: the letterbox, and why `base.css` unlocks it

**The fact, and it is the most expensive thing this codebase has learned about
iOS: in `display-mode: standalone`, iOS sizes the window from the document's
RESTING scrollability at launch, and letterboxes a document that cannot scroll
by exactly `env(safe-area-inset-top)`.**

Measured, not inferred. iPhone 16 Pro (402×874 pt), iOS 18.7 / Safari 26.6:

|                                                |         |
| ---------------------------------------------- | ------- |
| `screen.height`                                | **874** |
| `window.innerHeight` · `visualViewport.height` | **812** |
| `100dvh` · `100svh` · `100%`                   | **812** |
| `100lvh` · `100vh`                             | **874** |
| `env(safe-area-inset-top)`                     | **62**  |
| `env(safe-area-inset-bottom)`                  | 34      |
| `window.screenY`                               | 0       |

`874 − 812 = 62 = env(safe-area-inset-top)`, exactly. WebKit sizes the
standalone window as if a retractable toolbar existed, subtracts its height,
pins the window to the **top**, and then never covers the strip it reserved — so
the bottom 62 px of the display sits outside the web view and paints black on
every screen. This is a spec violation on its face: in standalone there is no
retractable browser UI, so the large and dynamic viewports **must** be equal
(css-values-4 §6.1.2.1), and here they differ by 62.

### It is the resting structure, and only the resting structure

One install, four document structures, switched by a pill and **persisted across
cold launches** (`localStorage`), verdict taken per launch:

| document structure at rest                                                              | window                |
| --------------------------------------------------------------------------------------- | --------------------- |
| document scrolls normally                                                               | **874** — full screen |
| fixed shell, an inner scroller, document cannot scroll                                  | 812 — letterboxed     |
| fixed shell, nothing scrollable anywhere                                                | 812 — letterboxed     |
| fixed shell **+ the document left scrollable behind it** by an invisible in-flow spacer | **874** — full screen |

**Transient scrollability is not enough.** Seven in-page interventions across
five controlled runs — with a placebo pinned to the first slot, rotation of the
rest, and `prior`/`during`/`afterUndo` sampling — all measured 812. Every one of
them varied scrollability for ~300 ms mid-session and undid itself. iOS samples
the structure at launch; the axis that decides the window was never varied.

Two device-proven negatives, recorded so nobody spends another round on them:

- **`apple-mobile-web-app-status-bar-style` makes no difference.** `black` and
  `black-translucent` were each tested with a fresh Home-Screen install. Both
  letterbox identically.
- **Nothing applied after first paint reaches it** — see the seven interventions
  above. The window does correct itself to 874 spontaneously, between 6 seconds
  and 43 minutes after navigation, and then holds for the life of that document;
  a reload starts a new document, which starts letterboxed again.

### What junoui does about it

`base.css` carries the **iOS standalone letterbox unlock**: keep the document
scrollable behind the app, using an invisible `body::after` spacer taller than
the large viewport, so the document always overflows whatever window iOS grants.
`overscroll-behavior: none` stops the ghost scroller rubber-banding; apps put
`overscroll-behavior: contain` on their real scrollers so an inner fling never
chains into it.

The gate is three conditions, all required — `display-mode: standalone` (only
installed apps letterbox), `pointer: coarse` (keeps macOS Dock apps out), and
`@supports (-webkit-touch-callout: none)` (iOS/iPadOS WebKit only). Selectors
carry `html:root` (specificity 0,1,2) deliberately: app resets commonly declare
`body { overflow: hidden }` at (0,0,1) _after_ this sheet, and the unlock has to
win the cascade without `!important`.

Consumer obligations, both silent if missed:

- **Ship the unlock at first parse.** iOS samples at launch, and a bundled
  stylesheet arrives after it. An app whose shell paints before its CSS bundle
  must inline a copy of the unlock in the document head — junoui's copy in
  `juno.css` is too late on its own.
- **Do not override `body::after`.** The spacer is `body::after`; a consumer
  that needs that pseudo-element for itself must reproduce the spacer at the
  same gate. None of junoui's own components use it.

### How to know it is fixed upstream

In standalone, `window.innerHeight === screen.height` **and
`100lvh === 100dvh`**, for a document that **cannot** scroll — that is the case
that still misbehaves. When that holds, the unlock is dead weight and can be
removed. Until then it is harmless where it does not apply, because the gate
excludes every non-iOS and non-installed context.

- Sources: nexora `CLAUDE.md` §15, entry dated 2026-08-13; the four-mode testbed
  `web/public/expansion-demo.html` (kept as a standing rig); 201 device readings
  collected by `scripts/viewport_probe_collect.py`. Tracked upstream as ticket
  20260812-006, drafted for WebKit Bugzilla / Feedback Assistant and awaiting
  filing. Related Apple Developer Forums threads: 800798, 798014 (iOS 26
  safe-area insets wrong until a background/resume — the "corrects itself later"
  shape matches exactly), 797124.

## Typography

iOS: **17 pt default body size, 11 pt minimum**; Dynamic Type must accommodate
enlargement to **200%**. Contrast minimums are 4.5:1 up to 17pt, 3:1 at 18pt or
bold. Since 1pt = 1 CSS px, that is 17px / 11px.

Confidence: medium — extracted from the HIG Accessibility page but not
adversarially re-verified. Re-check before encoding as a hard constraint.

### The 16px input rule

junoui holds text-entry controls at a 16px floor on coarse pointers, because
iOS Safari is widely observed to zoom the page onto a focused field under 16px.

**No primary WebKit or Apple source for this was found.** It is empirical
behavior, not published spec. The mitigation is harmless, so it stays — but do
not cite it as documented, and re-verify it on iOS 26.

The floor is now a checked claim, not an asserted one:
`test/visual/tap-targets.spec.mjs` reads the computed `font-size` of a
`.juno-input` under the coarse-pointer Playwright project and asserts `>= 16`.
That check is also what found the floor had never worked — the rule sat in
`base.css`'s `@media (pointer: coarse)` block, where a media query adds no
specificity, so `components/input.css`'s own `.juno-input` font-size beat it on
source order. It now lives in `input.css`. Keep it there.

## Things a stylesheet controls that Apple says nothing about

No primary Apple source was found for any of: `touch-action`,
`-webkit-tap-highlight-color`, `overscroll-behavior`, momentum scrolling, or
`scroll-snap` on iOS. Where junoui uses these (the coarse-pointer tap-highlight
reset, `overscroll-behavior: contain` on the modal body), it is **community
convention** — sensible, but do not attribute it to Apple.

`-webkit-overflow-scrolling: touch` is legacy and must not be reintroduced.

## Open risk: iOS 26

The claim "iOS 26 changed nothing about safe areas, viewport-fit, touch
behavior, or focus zoom" was **refuted** during verification, so junoui's iOS 26
behavior is unverified rather than confirmed-safe.

One confirmed change raises the stakes: as of iOS/iPadOS 26, **every website
added to the Home Screen opens as a web app by default** — "there are now zero
requirements for 'installability'". junoui's CSS may therefore run in a
standalone context, where `viewport-fit` and `env()` govern home-indicator and
Dynamic Island clearance, for sites that never opted in. The concrete
consequence is measured above in
[Home-Screen standalone: the letterbox](#home-screen-standalone-the-letterbox-and-why-basecss-unlocks-it) —
a site that never asked to be a web app now inherits both the letterbox and the
unlock.

Unconfirmed leads, tracked in ticket 20260803-034: `vh` reportedly pinning to
`window.outerHeight`; three new tab modes yielding different `innerHeight`; a
reported iPadOS 26 windowed-mode bug where `env(safe-area-inset-*)` returns
nothing. Resolving these needs a physical device, not more documentation.

- Source: [WebKit features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/).
