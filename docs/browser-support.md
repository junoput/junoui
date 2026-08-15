# Browser support

What junoui requires, what it loses gracefully below that, and the short list of
things that genuinely **break**. Stated because the failures are otherwise
silent: an engine that does not understand a CSS at-rule, property or selector
**drops it without reporting anything**. Nobody finds out from a console; they
find out from a screenshot.

Audited against `dist/css/juno.css` at v0.5.0 (2026-08-15).

## The floor

|                                                              | Safari / iOS | Chrome / Edge | Firefox                            |
| ------------------------------------------------------------ | ------------ | ------------- | ---------------------------------- |
| **Hard floor** — below this, things break                    | **17.0**     | **114**       | **125**                            |
| **Supported floor** — everything works, minor polish missing | **17.5**     | 117           | 129                                |
| **Full fidelity** — nothing missing                          | **26.0**     | 125           | — (anchor positioning not shipped) |

**junoui's supported floor is Safari / iOS 17.5.** That is the version to put in
a consumer's own support matrix.

Read the three rows as three different questions:

- Below **17.0** the Popover API is absent and junoui's overlay surfaces stop
  being overlays. See [What breaks](#what-breaks) — this is not a polish
  question, and one of the two failure modes is worse than "the menu does not
  open".
- Between **17.0 and 17.5** everything functions; entry animations are missing.
- Between **17.5 and 26.0** everything functions and animates; anchored
  surfaces (menu, popover, tooltip) land at their static position instead of
  next to their trigger, because CSS anchor positioning is a Safari 26 feature.
  This is a real visual defect, not a nicety — but the surface still opens,
  still closes, still light-dismisses, and the app can pin it (see below).

`package.json` carries a `browserslist` set to the **hard floor**, so tooling
reads the line below which junoui is broken rather than the line below which it
is imperfect. junoui itself runs no autoprefixer or transpiler — the field is a
declaration for consumers' build tools, not something junoui acts on.

## Feature audit

Counts are occurrences in the built bundle.

| Feature                                                                               | Uses | Safari / iOS | Below that                                                                                   |
| ------------------------------------------------------------------------------------- | ---- | ------------ | -------------------------------------------------------------------------------------------- |
| CSS anchor positioning (`position-area`, `position-try-fallbacks`, `position-anchor`) | 10   | **26.0**     | degrades — [misplaced surfaces](#anchored-surfaces-lose-their-anchor)                        |
| `scrollbar-width`                                                                     | 4    | 18.2         | **guarded** — `::-webkit-scrollbar` fallback ships                                           |
| `backdrop-filter` (unprefixed)                                                        | 14   | 18.0         | **guarded** — `-webkit-backdrop-filter` ships beside every use                               |
| `@starting-style`                                                                     | 10   | 17.5         | degrades — no entry animation                                                                |
| `transition-behavior` / `overlay` + `allow-discrete`                                  | 10   | 17.4         | degrades — surfaces pop instead of fading                                                    |
| **Popover API** (`popover`, `popovertarget`, `:popover-open`)                         | 31   | **17.0**     | **breaks**                                                                                   |
| `prefers-reduced-transparency`                                                        | 3    | 17.0         | degrades — blur stays on for users who asked it off                                          |
| `@property`                                                                           | 1    | 16.4         | degrades — the gauge jumps to its value instead of sweeping                                  |
| `color-mix()`                                                                         | 28   | 16.2         | degrades — role tints vanish (see the caveat below)                                          |
| `@container`                                                                          | 2    | 16.0         | degrades — card and table stop reflowing at narrow widths                                    |
| `:has()`                                                                              | 5    | 15.4         | degrades — the collapsible pillbar never collapses                                           |
| `dvh` / `lvh`                                                                         | 10   | 15.4         | breaks layout — `block-size` falls back to `auto`, the app shell collapses to content height |
| `oklch()`                                                                             | 190  | 15.4         | breaks colour — every token value is `oklch()`                                               |
| `aspect-ratio`                                                                        | 7    | 15.0         | degrades — media tiles lose their ratio                                                      |
| `@supports selector()`                                                                | 1    | 14.1         | the Popover guard below is inert (fails open to today's behaviour)                           |

Two rows deserve a note.

**`color-mix()` is listed as a degrade, and that is technically true and
practically uncomfortable.** All 28 uses are tints, borders and shadows built
from `var(--juno-role)`; when the function is unsupported the declaration is
invalid and the property falls back to `transparent` or the previous cascade
value. Text and icon colour, which take `var(--juno-role)` directly, survive. So
nothing breaks — but role tinting is exactly the thing junoui exists to encode,
and losing it erodes the contract even while the layout holds. It sits below the
floor; it is listed so nobody discovers it by shipping to iOS 16.

**`oklch()` and `dvh` are below every floor in this document** and are listed for
completeness. If you are on iOS 15 you are not using junoui.

## What breaks

Exactly one thing, at exactly one version, and it has two failure modes.

### Popover API, Safari / iOS < 17.0

junoui's `.juno-menu`, `.juno-popover` and the top-layer `.juno-tooltip__bubble`
are built on the native Popover API. The open/close, light-dismiss and ESC
behaviour is the platform's; junoui ships only the surface. On an engine without
it:

1. **They never open.** `popovertarget` does nothing, so there is no way to
   reveal the panel. The pillbar's overflow slot routes to `.juno-menu`, so the
   overflow items are unreachable — which on a phone is where the secondary
   navigation lives.
2. **Worse: `.juno-menu` and `.juno-popover` become invisible click-eaters.**
   The UA rule that hides a closed popover (`display: none` on any `[popover]`
   that is not `:popover-open`) does not exist on an unsupporting engine, so the
   panel participates in layout. junoui's own base rule sets `opacity: 0`, so it is
   invisible, but both surfaces are `position: fixed` with no `pointer-events`
   reset. The result is a 256–280 px invisible fixed panel sitting over the page
   at its static position, swallowing taps on whatever it covers.

   (`.juno-tooltip__bubble` escapes this: it inherits `pointer-events: none`
   from the CSS-only tooltip rule it shares.)

Failure mode 2 is the one that justifies a guard. A feature that is missing is
an inconvenience; a feature that is missing and eats input is a bug report that
looks like something else entirely. `base.css` therefore ships:

```css
@supports not selector(:popover-open) {
  .juno-menu[popover],
  .juno-popover[popover],
  .juno-tooltip__bubble[popover] {
    display: none;
  }
}
```

This makes failure mode 1 the _only_ failure mode: the panel is absent instead
of invisibly present, the page underneath is fully usable, and the app can
detect the same condition in one line
(`CSS.supports('selector(:popover-open)')`) and render a non-popover fallback.

`@supports selector()` itself needs Safari 14.1; below that the guard's
condition is invalid, the block is skipped, and behaviour is exactly what it is
today. Fail-open, and far below any floor here.

### Anchored surfaces lose their anchor

Not a break — recorded here because it is the largest visual regression between
17.5 and 26.0 and it is easy to mistake for one.

`.juno-menu`, `.juno-popover` and the top-layer tooltip position themselves with
`position-area` / `position-try-fallbacks`, which is Safari **26.0**. Below it
those declarations drop and the surfaces keep `position: fixed; inset: auto;
margin: 0` — so they render at their static position rather than beside their
trigger. They still open, close, light-dismiss and trap nothing.

The documented remedy is the app's: pin `inset` on the element's `toggle` event.
It is already noted in [popover.md](./components/popover.md) and is the reason
the legacy `.juno-popover-anchor` wrapper is still exported.

## Why this document exists

Two silent failures of this exact class shipped and were found by looking at a
phone, not by any tool:

- **`backdrop-filter` unprefixed only.** Unsupported below Safari 18.0, so the
  declaration was dropped and every glass surface — pillbar, dock, modal scrim —
  rendered flat on iOS 17. Fixed 2026-08-05 by shipping
  `-webkit-backdrop-filter` beside each use; both are in the bundle now, and the
  audit table above tracks them as guarded.
- **`scrollbar-width: none`.** Unsupported below Safari 18.2, so the scrollable
  tab strip kept a visible scrollbar on iOS 17 and 18.0–18.1. Fixed the same day
  with a `::-webkit-scrollbar { display: none }` companion.

Neither produced an error. Both were "modern CSS, ships everywhere" right up
until someone opened the page on the device. That is the argument for stating a
floor and for auditing against the built bundle rather than against intent: the
cost of a missing feature is paid by the consumer, silently, at a time and place
junoui never sees.

**When you add a feature below the floor, say so here.** A new at-rule,
selector or property whose support is newer than Safari 17.5 belongs in the
audit table with its degrade-or-break verdict, and if the verdict is _break_ it
needs an `@supports` guard in the same change. Guards are for functional
failures only — a missing animation does not get one, and wrapping cosmetic
declarations in `@supports` costs bytes and buys nothing.

## Related

- [ios-pwa.md](./ios-pwa.md) — the five-minute version for a consumer about to
  integrate: what these floors buy you, what you must ship yourself, and what
  junoui does not do at all.
- [ios-conformance.md](./ios-conformance.md) — iOS metrics and behaviour: safe
  areas, tap targets, the viewport-unit decision, and the Home-Screen standalone
  letterbox.
- [getting-started.md](./getting-started.md) — the required `viewport` meta,
  which is a separate silent failure with the same shape.
