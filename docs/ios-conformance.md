# iOS conformance

What junoui encodes for iOS, **with sources**, and — just as important — what it
deliberately does _not_ encode because no primary source supports it.

Most numbers the design community attributes to Apple are not in Apple's text.
This page exists so nobody re-derives folklore, and so nobody "fixes" a correct
value into a wrong one later.

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

Caveats worth knowing before changing any of that:

- `dv*` is explicitly **not stable** and not guaranteed to update every frame,
  so it can churn while the address bar collapses. `sv*` is the calm choice when
  a surface must never overflow.
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
Dynamic Island clearance, for sites that never opted in.

Unconfirmed leads, tracked in ticket 20260803-034: `vh` reportedly pinning to
`window.outerHeight`; three new tab modes yielding different `innerHeight`; a
reported iPadOS 26 windowed-mode bug where `env(safe-area-inset-*)` returns
nothing. Resolving these needs a physical device, not more documentation.

- Source: [WebKit features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/).
