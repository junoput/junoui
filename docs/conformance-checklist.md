# Mobile conformance checklist

What "right" looks like when you build on junoui. Every item here is **checked
by something** — most by `junoui doctor`, the rest by a guard junoui ships. An
item nobody can check is a wish, and this list deliberately does not have any.

Run the probe against your own app:

```sh
npx junoui-doctor --url http://localhost:5173
```

## Checked by the doctor, on your app

|                                                                        | Why it matters                                                                        | How it goes wrong                                                                                                                                   |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Every interactive element clears the tap floor on both axes**        | 24px is WCAG 2.2 AA; 44px is the comfortable target a coarse pointer gets             | A control floored on one axis only. Pagination was 44 wide and 32 tall for months, and a single-axis check passed the whole time                    |
| **Exactly one primary navigation is visible, and it is the right one** | A rail and a dock are two halves of one switch                                        | Pair a responsive rail with a width-only helper and a **landscape phone shows neither** — correct on portrait and on desktop, which is why it ships |
| **Every `juno-*` class you name exists**                               | A class name is a string matched against another artifact, and nothing else checks it | Eleven wrong names once rendered a phone dialog as UA defaults, confirm button off-screen                                                           |
| **The page does not scroll sideways**                                  | Horizontal overflow on a phone is almost always a fixed width that escaped            |                                                                                                                                                     |

The doctor runs these across real device profiles — including **844×390**, a
landscape phone, which is _wider than `md`_ and is the case round-number
breakpoint tables never see.

## Checked by junoui's own guards

You inherit these by using the primitives rather than re-deriving them.

|                                                                                               | Where                                      |
| --------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Safe-area insets read through one seam, so you can zero or restate them in one place          | [safe-area.md](./safe-area.md)             |
| Which `env()` arithmetic to use — the three buckets, and they give different answers          | [safe-area.md](./safe-area.md)             |
| Navigation shape keys on pointer **and** size, not width                                      | [layout.md#pointer-first](./layout.md)     |
| Floating chrome publishes the offset it sits at, so a clearance cannot disagree with a margin | [safe-area.md](./safe-area.md)             |
| The dock and pillbar publish how many items fit                                               | [components/dock.md](./components/dock.md) |
| Touch defaults (`touch-action`, tap highlight) are generated from one member list             | [conformance-kit.md](./conformance-kit.md) |

## What nothing checks yet

Stated because a checklist that omits its own gaps is the failure it exists to
prevent.

- **WebKit.** The doctor is Chromium. iOS Safari is where this org's worst
  layout bugs have lived, and no automated check here sees it. A device pass is
  still required for anything touching viewport, safe area, or overlays.
- **Safe-area arithmetic at a real inset.** `env()` cannot be forced in a
  headless browser; junoui's own tests substitute literals into a built bundle,
  and the doctor does not.
- **Whether a control is in the right place.** A 44px target in the wrong corner
  passes everything here.
- **Routes you did not visit**, and states behind interaction.
