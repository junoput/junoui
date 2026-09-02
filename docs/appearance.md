# What a green conformance run does not mean

Every check in this kit answers a question about **geometry**, **presence** or
**text**. Not one of them looks at what is painted.

That is worth stating plainly, because the kit's pitch — _stop re-deriving
mobile correctness by hand_ — invites the reading that a green run means the
screen is right. It does not, and the gap is not hypothetical. On 2026-09-01 a
sibling project landed a terrain fix that passed its tests, **improved both of
the metrics it was judged on**, and shattered the far field of the frame. It was
caught by looking at the render. Nothing automated was going to catch it,
because nothing automated was looking at the picture.

## What each check actually asserts

| Check                             | Asserts                                                | Passes while the screen is wrong if…                                |
| --------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| tap floors (`shortTargets`)       | the effective **hit area** is ≥ the floor on both axes | the control is the right size and in the wrong place, or unreadable |
| navigation (`navigationVerdict`)  | exactly one of rail/dock is painted                    | it is painted in the wrong place, or over content                   |
| class manifest (`unknownClasses`) | every `juno-*` name is one junoui defines              | every name is real and applied to the wrong element                 |
| horizontal overflow               | `scrollWidth ≤ clientWidth`                            | the page fits and the content inside it is clipped                  |
| the budgets (dock, pillbar)       | a predicted width equals a laid-out width              | the prediction and the layout are both wrong                        |
| the cascade resolver              | which declaration wins for a property                  | the winning declaration is the wrong value                          |
| the safe-area seam                | every inset reads through one seam                     | the seam resolves to the wrong number                               |
| canvas ink                        | a token pair holds a contrast ratio                    | the ink is drawn over something else entirely                       |

Read down the right-hand column: **every one of these is satisfied by a
correctly-structured page that looks wrong.** That is not a defect in the
checks. It is what a check of this kind is.

## What was closed, because it was cheap and certain

An element that _occupies space_ and cannot be seen or pressed is the case a
geometry probe is most likely to certify, and three of its causes cost nothing
to detect. `junoui-doctor` now reports them as their own finding — separate from
a short target, because they are a different question with a different fix:

- `visibility: hidden` or `collapse`, on the element or any ancestor
- `opacity: 0`, likewise
- **covered by something else** at its own centre point

The occlusion check samples `elementFromPoint` at the element's centre. A
descendant painting there is the element painting there, and so is an ancestor —
which is what comes back when the element itself sets `pointer-events: none`. An
overlay that sets `pointer-events: none` is correctly **not** reported: it is not
between the finger and the control, and flagging it would make the probe noisy
on every app with a decorative scrim. A probe nobody runs checks nothing.

## The hit area is probed, not read off the box

`getBoundingClientRect` is not the hit area, and reading it was wrong both ways:

- **Noise.** `.juno-splitter` is a 1px painted hairline whose `::after` is a 44px
  target overlapping its neighbours — deliberate, since a 44px gap on desktop
  would be wrong. Pseudo-elements cannot be measured, so the doctor reported
  junoui's own component as a 1px tap target. An audit that cries wolf on a
  legitimate, common pattern gets muted.
- **The dangerous mirror.** A control sized 44px whose real hit area is shrunk by
  something on top of it was reported **clean**.

The extent is probed with `elementFromPoint`, outward from the centre, bounded by
the floor. Where box and hit disagree the finding names both — "box 44x44, hit
12x44" and "12x12" need different fixes.

### The one opt-out, and why it is printed

A control whose pointer input is routed by a shared handler on an ancestor
cannot be audited per element. `junoui/range` is the case: at coincident
positions one thumb is entirely under the other, and which one a tap grabs is
decided by `pickThumb` from a handler on the host, not by stacking order.

```html
<div class="juno-range" data-juno-hit="delegated">…</div>
```

The doctor skips those and **prints how many it skipped on every run, including a
clean one**. An opt-out nobody can see is how an audit gets muted — the same
failure this document exists to name.

## What is left, and will stay left

Stated rather than implied, because the value of the list above depends on this
list existing:

- **Colour, contrast and legibility of real content.** The kit asserts token
  pairs. It cannot tell you that your text is grey on grey in the one state the
  app spends most of its time in.
- **Whether anything is in the right place.** A 44px target in the wrong corner
  passes everything here.
- **Anything drawn rather than laid out.** Canvas and GPU surfaces have no boxes
  and no computed styles. See [painted-ui.md](./painted-ui.md).
- **WebKit.** The doctor is Chromium. This org's worst layout bugs have lived on
  iOS Safari.
- **Whether the design is any good.**

## So: look at it

The kit removes the work that is mechanical and repeats across consumers. It
does not remove the last step, and no amount of it will.

- Keep a **visual-regression suite** on the pages that matter. junoui's is
  pinned to a fixed runner image on purpose — a runner bump silently shifts font
  rendering and drifts every baseline, so the checking environment must match
  the one baselines were recorded on.
- Before believing a change that _improved a metric_, **render the thing and
  look at it.** A number moving the right way is evidence about the number.
- When a check and a screenshot disagree, the screenshot is right.
