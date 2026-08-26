---
'@junoput01/junoui': minor
---

**`.juno-btn--sm` promotes to the tap target on touch; `.juno-btn--dense` is the opt-out.**

`--sm` names a **density**, and consumers reach for it as a **semantic**. Audited across one app: 40 call sites, nearly all `--sm --ghost` meaning "secondary", shipping a 24px target on a phone — and junoui's own showcase does it twice, in a navbar action slot.

A size modifier should not quietly become a tap-target decision. Under `(pointer: coarse)`, `.juno-btn--sm` now holds `--juno-size-tap-min` like every other control. Type and padding still shrink, so it stays a density modifier and stops being a touch-target one. **On a fine pointer nothing changes** — still 24px, the WCAG 2.2 AA floor (2.5.8) exactly.

`.juno-btn--dense` opts a `--sm` button back out, for a toolbar that is genuinely dense on touch (a scrubber, an editor rail). It is meaningful only in combination with `--sm`, on purpose: a dense touch target should be chosen by name, never inherited from a size.

**This is a visual change on touch devices.** Any `--sm` button in a phone layout grows to 44px unless you add `--dense`. Audit your `--sm` call sites: the ones that meant "secondary" want `--ghost` alone and are now correct for free; the ones that meant "dense" want `--dense` added.

The rule lives in `button.css`, not `base.css`'s coarse block — a media query adds no specificity, so a `.juno-btn--sm` there would lose to `button.css`'s own `.juno-btn--sm` later in the bundle.
