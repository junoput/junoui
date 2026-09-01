# junoui on iOS, and in a Home-Screen web app

The bounded claim, in one page: **what you get for free, what you must supply,
and what junoui explicitly does not do.** Read it before integrating; the pages
it links carry the detail and the derivations.

Every line here carries a number or a source. Where a claim has neither, it is
not on this page.

**What the numbers were measured against.** junoui **v0.5.0**; the CSS feature
audit is against the built `dist/css/juno.css` on **2026-08-15**; the device
readings are an **iPhone 16 Pro (402×874 pt), iOS 18.7 / Safari 26.6**; the
touch-ergonomics assertions run in Playwright at **390×844** with `hasTouch` +
`isMobile`. One device, one build. Nothing here is extrapolated to iPads or to
Android.

---

## The floor

|                                                       | Safari / iOS | What that line means                                |
| ----------------------------------------------------- | ------------ | --------------------------------------------------- |
| **Hard floor** — below this, things break             | **17.0**     | the Popover API. Overlays stop being overlays       |
| **Supported floor** — put this in your support matrix | **17.5**     | everything works; entry animations missing below it |
| **Full fidelity**                                     | **26.0**     | CSS anchor positioning                              |

**The interesting gap is 17.5 → 26.0, not 16.x → 17.5.** Between 17.5 and 26.0
menus, popovers and tooltips open, close and light-dismiss correctly — and land
at their **static position** instead of beside their trigger, because
`position-area` / `position-try-fallbacks` / `position-anchor` (**10 uses**) are
Safari 26. The surface works; it is in the wrong place. That is a real visual
defect and it is easy to mistake for a break.

Below **17.0** the Popover API is absent and junoui **hides** `.juno-menu`,
`.juno-popover` and the top-layer tooltip behind
`@supports not selector(:popover-open)`. That is not a fix. Unguarded, the UA
rule that hides a closed popover does not exist either, so a **256–280 px
invisible fixed panel** sits at its static position swallowing taps on whatever
it covers. junoui trades that for "the panel is absent" — absent beats
invisibly-present — and your app branches on
`CSS.supports('selector(:popover-open)')`.

Full per-feature audit, with the degrade-or-break verdict for all 15 features:
[browser-support.md](./browser-support.md).

---

## What you get for free

### Touch ergonomics

- **44 px tap targets on coarse pointers.** `--juno-size-tap-min` is **24 px**
  (the WCAG 2.2 **2.5.8** AA floor) and flips to `--juno-size-tap-comfortable` =
  **44 px** under `@media (pointer: coarse)`. Everything that sizes off it
  inherits the promotion: `.juno-btn` (`min-height`), `.juno-input` and
  `textarea` (`min-block-size`, the latter at 3×), `.juno-menu__item`,
  `.juno-navbar__actions > *`, `.juno-pagination__item` (both axes since
  20260815-040), and `.juno-modal__close` on both axes.
  **No exceptions as of 0.10.** Pagination was one until 20260815-040: its
  `min-inline-size` read the token and its `block-size` was a fixed
  `--juno-space-32`, so it sat at 44 × 32 on touch — clearing the 24 px AA floor
  and not the 44 px comfortable one. If you are pinned below that release, size
  around it.
- **Verified numerically, not by screenshot.**
  `test/visual/tap-targets.spec.mjs` asserts the computed `min-height` **and**
  the rendered box under **both** Playwright projects — `44px` under
  `chromium-coarse`, `24px` under `chromium`. Keying the expectation by project
  is what makes it a check rather than a baseline: if the coarse project ever
  stops emulating touch it starts producing desktop numbers and **fails**
  instead of quietly re-recording them.
- **A 16 px floor on text entry**, so iOS Safari does not zoom the page onto a
  focused field: `.juno-input { font-size: max(16px, …) }`. Two caveats, both
  load-bearing. **No primary WebKit or Apple source states the zoom behaviour** —
  it is empirical, and the mitigation is kept because it is harmless, not
  because it is documented. And it **never applied on any touch device until
  2026-08-15**: the rule sat in `base.css`'s `@media (pointer: coarse)` block,
  where a media query adds no specificity, so `input.css`'s own `.juno-input`
  font-size beat it on source order. The numeric check above is what found it.
- **The UA tap-highlight square is off** on `.juno-btn`, `.juno-dock__item`,
  `.juno-pillbar__item`, `.juno-tabs__tab`, `.juno-list__item`,
  `.juno-menu__item`. Community convention — **no Apple source** — so it is
  listed as a default, not a conformance claim.

### Safe areas

`env(safe-area-inset-*)` is used **21 times across 8 files**, and the rule for
which arithmetic applies is not one rule but **three buckets**:

| Bucket                                         | Arithmetic                                       | Why                                                          |
| ---------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| Padding on a surface that reaches the edge     | `max(baseline, env(…))` — the inset **replaces** | the inset's job is to clear the cutout, not to stack         |
| A floating element positioned **off** the edge | `calc(baseline + env(…))` — **additive**         | `max()` would park the pill flush against the home indicator |
| The clearance tokens                           | `calc(height + … + env(…))` — **additive**       | content must clear the control's height _and_ the inset      |

Get this wrong in either direction and nothing errors. The derivation, with the
WebKit source: [ios-conformance.md](./ios-conformance.md#max-vs-addition--the-rule).

**All of it is inert until you ship `viewport-fit=cover`** — WebKit reports
every inset as `0` until then, and `contain` does not opt out. See
[what you must supply](#what-you-must-supply).

### Floating-nav clearance, derived rather than constant

A page under a floating dock or pillbar reserves room at its foot with
`padding-block-end: var(--juno-dock-clearance)`. Those tokens are **computed
from the bar's own parts**, not hardcoded:

```
--juno-dock-h     = tap-comfortable + 4×space-4 + 2×border-1   = 62px at defaults
--juno-pillbar-h  = tap-comfortable + 2×space-4 + 2×border-1   = 54px at defaults

--juno-dock-clearance    = dock-h    × scale + 16 + 8 + env(safe-area-inset-bottom)
--juno-pillbar-clearance = pillbar-h × scale + 16 + 8 + env(safe-area-inset-bottom)
```

— 86 px and 78 px plus the inset, at default tokens. **Why derived matters:**
the old constants (`space-72 + space-20 + env()`) promised in a code comment to
"stay correct when the dock geometry changes" and could not. junoui explicitly
invites you to re-parameterise the bubble via `--juno-size-tap-comfortable`, and
past a **58 px** bubble the constant reserved **less** than the pill's own
height plus its margin — content hid under the dock, silently, on exactly the
consumers who took the invitation (ticket 20260815-026).

`--juno-dock-clearance-scale` (default `1`) is the knob for a bar that **shrinks
while scrolling**: set it to the shrunken ratio so the reservation is made at
the small size. Reserving against a live height means relayouting content under
a finger that has already stopped moving.

### The Home-Screen standalone unlock

In `display-mode: standalone`, iOS sizes the window from the document's
**resting** scrollability at launch and letterboxes a document that cannot
scroll by exactly `env(safe-area-inset-top)` — measured **874 − 812 = 62**, a
black strip at the bottom of the glass on every screen. `base.css` keeps the
document scrollable behind your fixed shell with an invisible `body::after`
spacer, behind a **three-condition gate, all required**:

```
@media (display-mode: standalone)   only installed apps letterbox
  and (pointer: coarse)             keeps macOS Dock apps out
@supports (-webkit-touch-callout: none)   iOS/iPadOS WebKit only
```

**A bundled stylesheet cannot satisfy the obligation this creates** — see
[what you must supply](#what-you-must-supply). The measurements, the
four-structure A/B, and the 201 device readings behind it:
[ios-conformance.md](./ios-conformance.md#home-screen-standalone-the-letterbox-and-why-basecss-unlocks-it).

### Phone-shaped component behaviour

| Behaviour                                                               | Triggered by                                                    |
| ----------------------------------------------------------------------- | --------------------------------------------------------------- |
| Modal becomes a bottom sheet — full width, bottom-anchored, `85dvh` cap | `@media (width <= 639.98px)`                                    |
| Toast stack goes full width at the bottom edge and slides up            | `@media (width <= 639.98px)`                                    |
| Table stacks into rows                                                  | `@container (max-width: 480px)`                                 |
| Tab strip scrolls sideways instead of wrapping                          | `overflow: auto hidden` + `overscroll-behavior-inline: contain` |

Note the third row is a **container** query, not a viewport one: it reflows by
the space the table is in, not by the size of the phone. And the first is
deliberately _not_ — a modal is always in the top layer, so the screen **is**
its container.

### Silent-failure guards already paid for

Two defects of this class shipped and were found by looking at a phone, not by
any tool — both fixed 2026-08-05, both now permanent:

- `-webkit-backdrop-filter` ships beside **all 7** unprefixed
  `backdrop-filter` declarations (unsupported below Safari 18.0 — every glass
  surface rendered flat on iOS 17).
- A `::-webkit-scrollbar { display: none }` companion ships beside **all 3**
  `scrollbar-width` declarations (unsupported below Safari 18.2 — the
  scrollable tab strip kept a visible scrollbar on iOS 17 through 18.1).

> Both are 7 and 3 **declarations**, verified in `dist/css/juno.css`. The audit
> table in [browser-support.md](./browser-support.md) reports 14 and 4 because
> it counts string occurrences, and `-webkit-backdrop-filter` contains
> `backdrop-filter` — so each guarded pair is counted twice. Same fact, two
> units.

And **zero raw `vh`** — grep the bundle and there are none. Full-height surfaces
use `dvh` (**9 uses**) because `vh == lvh` normatively and a `100vh` box is
sized as if the toolbar were retracted; the single `lvh` in the bundle is the
standalone unlock's spacer, which is _supposed_ to overflow. The reasoning, and
the rule for a component that does not exist yet:
[ios-conformance.md](./ios-conformance.md#the-rule-for-a-component-that-does-not-exist-yet).

---

## What you must supply

junoui is a stylesheet. Everything below is outside what CSS can reach.

| #   | You ship                                                                                                                   | If you don't                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`                                 | every safe-area guarantee becomes a no-op, silently; and 1 CSS px stops equalling 1 pt                        |
| 2   | A standalone declaration — manifest `"display": "standalone"` or `apple-mobile-web-app-capable` — **or a decision not to** | from iOS 26 the **user** grants standalone at add-to-Home-Screen time and junoui's standalone CSS runs anyway |
| 3   | **An inline copy of the letterbox unlock in `<head>`**, if your shell paints before its CSS bundle                         | iOS samples the document at launch; `juno.css` arrives after, so the app letterboxes with the unlock present  |
| 4   | Leave `body::after` alone, or reproduce the spacer at the same gate                                                        | the unlock has no spacer and the window letterboxes                                                           |
| 5   | `overscroll-behavior: contain` on your real scrollers                                                                      | an inner fling chains into the unlock's ghost scroller                                                        |
| 6   | A popover fallback below Safari 17.0, branched on `CSS.supports('selector(:popover-open)')`                                | overflow navigation is unreachable — junoui hid the panel rather than leave it eating taps                    |
| 7   | Pinning `inset` on the `toggle` event below Safari 26.0                                                                    | anchored surfaces open at their static position                                                               |
| 8   | `data-juno-letterboxed` on `<html>`, if you want to react to a letterboxed window                                          | nothing; the flag is opt-in — but invent your own attribute name and your CSS can never move into junoui      |

**#3 is the one that catches people**, because it is silent in both directions:
miss it and the app letterboxes with a correct stylesheet installed, ship it and
nothing confirms it worked except a screenshot of the device. Rows 2, 3 and 8
are specified in full — declarations, status-bar-style semantics, the exact
letterbox predicate — in
[the consumer `<head>` contract](./ios-conformance.md#becoming-a-home-screen-web-app-the-consumer-head-contract).

---

## What junoui explicitly does not do

This half is why the page exists. None of the following is planned, partial, or
"coming to the roadmap" — it is out of scope by design.

**No JS behaviour.** No focus traps, no scroll locking, no gesture or swipe
handling, no runtime popover positioning, no list virtualization, no state. Every
component renders with zero JS; what is stateful is the platform's (`<dialog>`,
`popover`, `<details>`) or yours. junoui does ship two JS entry points —
`icons/inline` and `icons/install` — and they are **icon-sprite helpers, nothing
more**.

**No service worker, no offline story, no cache.** No precaching, no purge, no
versioning, no `skipWaiting` policy. [boot-shell.md](./boot-shell.md) documents
the five-rung boot pattern including an app-shell service worker — that is a
**recipe your app implements**, with a reference implementation in another
repository. junoui ships none of that code.

**No native chrome.** `dist/ios/JunoTokens.swift` is **token values only**. There
are no UIKit or SwiftUI components. `.juno-dock` and `.juno-navbar` are CSS that
_looks_ like a bar; they are not the system bar and do not inherit its
behaviours.

**Nothing about in-app browsers.** SFSafariViewController and WKWebView-based
in-app browsers (Instagram, Facebook) are a **separate, unfixed path** and
junoui has tested neither. The one datum on record: Safari 26.0's notes claim a
fix for `lvh`/`vh` being sized against the small viewport in
SFSafariViewController, but **WebKit bug 255708 (filed 2023) is still open**, so
that "Fixed" is stronger than the tracker supports.

**No app-shell assets.** No web app manifest, no Home-Screen icons, no splash
screens, no install prompt. `src/icons/` is a **UI icon sprite** — the icons
inside your interface, not the icon on the Home Screen.

**No guarantee below Safari / iOS 17.0**, and the losses compound rather than
arriving all at once: **16.2** drops `color-mix()` (**28 uses** — every role
tint, border and shadow built from `var(--juno-role)`, which is the contract
junoui exists to encode); **16.0** drops `@container`; **15.4** drops `oklch()`
(**190 uses** — every token value) and `dvh`/`lvh` (**10 uses** — the app shell
collapses to content height). There is no fallback layer for any of them, and
none is planned. If you are on iOS 15 you are not using junoui.

**No verified iOS 26 story.** The claim "iOS 26 changed nothing about safe
areas, viewport-fit, touch behaviour or focus zoom" was **refuted** during
verification, so junoui's iOS 26 behaviour is _unverified_, not
_confirmed-safe_. Open leads — `vh` reportedly pinning to `window.outerHeight`,
three new tab modes yielding different `innerHeight`, iPadOS 26 windowed mode
reportedly returning nothing for `env(safe-area-inset-*)` — need a physical
device, not more documentation.

---

## Where the detail lives

| Page                                       | What it settles                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| [ios-conformance.md](./ios-conformance.md) | every iOS metric with its source, the folklore named, the letterbox, the `<head>` contract |
| [browser-support.md](./browser-support.md) | the three floors, all 15 features with degrade-or-break, the two shipped silent failures   |
| [getting-started.md](./getting-started.md) | the required viewport meta and what depends on it                                          |
| [accessibility.md](./accessibility.md)     | the WCAG 2.2 criterion behind each target size, and the per-component ARIA contract        |
| [integration.md](./integration.md)         | import order, the token bridge, and where app-specific things go                           |
| [boot-shell.md](./boot-shell.md)           | the boot ladder — a pattern to implement, not code junoui ships                            |
