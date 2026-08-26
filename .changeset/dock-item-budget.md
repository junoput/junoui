---
'@junoput01/junoui': minor
---

**The dock publishes its horizontal item budget.**

`.juno-dock__item` is `flex: 1 1 0`, so the bar divides its inner width by however many items are present. A consumer deciding how many to render — and whether they still hold a tap target — had to re-derive that from the numbers in `dock.css`. Two did, in prose, twice, and both drifted the same way: they subtracted 12px of inline padding where the pill actually spends 8 (`--juno-space-4` a side), so every per-item width came out ~0.8px low.

New custom properties on `.juno-dock`:

| Property                    | What it is                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| `--juno-dock-items`         | The item budget. You set it to what you render (default `5`).                                 |
| `--juno-dock-item-inline`   | The width one item gets — a prediction of the flex layout, asserted against the measured box. |
| `--juno-dock-fit-inline`    | The narrowest viewport at which every item still holds `--juno-size-tap-comfortable`.         |
| `--juno-dock-chrome-inline` | The bar's total inline chrome. `0` full-bleed, `34px` on `--pill`/`--float`.                  |
| `--juno-dock-avail`         | The width the budget divides (default `100vw`).                                               |

The margin, padding and border terms are declared once and consumed by both the variant's own box and the sum, so the budget cannot disagree with the bar it describes — the same construction as `--juno-dock-edge-offset`. One consequence worth knowing: `--pill`/`--float` now paint their border from `--juno-dock-border-inline`, so overriding that term to `0` removes the hairline as well as widening the items. That is deliberate — the sum follows the paint.

**No scale floor is published.** `44px / --juno-dock-item-inline` is a ratio of two lengths and CSS cannot divide by a length. A consumer that must scale rather than drop an item compares the two values itself.
