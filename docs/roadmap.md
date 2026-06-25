# Roadmap — missing capabilities

Gap analysis vs mature design systems (Material, Carbon, Radix, Polaris, Tailwind).
What junoui does **not** yet have, prioritised. The framework line holds throughout:
junoui ships the **look + the accessibility/structure contract**; stateful behavior
(focus traps, open/close, positioning, data) lives in apps or a sibling
`junoui-<framework>` package.

Priority key: 🔴 must · 🟡 high · 🟢 nice.

## Have today

Tokens (color · spacing · type · radius · border · size · breakpoints · motion ·
z-index · elevation · opacity), density modes, themes (3 palettes × dark/light), CSS
components (badge, button, card, readout, status dot, loaders, **form controls** —
field · input · select · checkbox · radio · switch · slider), layout primitives +
container queries, multi-platform outputs, docs, lint + tests + CI.

## Foundations (token gaps) — ✅ shipped 2026-06

All foundation token gaps are now built. Values: [tokens-reference.md](./tokens-reference.md);
usage: [design-guidelines.md](./design-guidelines.md).

| Done                              | What shipped                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| **Motion** (duration + easing)    | `--juno-motion-duration-{fast,base,slow}` + `--juno-motion-ease-{standard,in,out}`.        |
| **Z-index scale**                 | `--juno-z-*` (raised → toast), single layering source of truth.                            |
| **Elevation / shadow**            | `--juno-shadow-{1,2,3}` — border-first depth; shadow for lifted surfaces.                  |
| **Opacity scale**                 | `--juno-opacity-{disabled,muted,scrim}`.                                                   |
| **Density modes** (compact/comfy) | `data-juno-density` swaps semantic padding aliases (`--juno-pad-*`, `--juno-gap-control`). |

## Components

| Missing                                                                                             | Priority   |
| --------------------------------------------------------------------------------------------------- | ---------- |
| ~~**Form controls** — input, textarea, select, checkbox, radio, switch, slider~~                    | ✅ shipped |
| ~~**Field** wrapper — label + control + help + error + required~~                                   | ✅ shipped |
| **Overlays** — modal/dialog, drawer, tooltip, popover, menu/dropdown (needs z-index + motion first) | 🔴         |
| **Table / data grid** styling                                                                       | 🔴         |
| **Alert / toast / inline notification**                                                             | 🟡         |
| **Tabs**, accordion / disclosure                                                                    | 🟡         |
| **Skeleton** loading placeholder (pairs with loaders)                                               | 🟡         |
| Avatar, chip/tag, divider, breadcrumb, pagination, stepper                                          | 🟢         |
| Dumb chat/calendar **visuals** (message bubble, event chip, day-cell)                               | 🟢         |

## Quality / infra

| Missing                                      | Why                                                            | Priority |
| -------------------------------------------- | -------------------------------------------------------------- | -------- |
| **Visual regression** snapshots (Playwright) | Catch unintended visual changes; token edits can shift output. | 🟡       |
| **Changesets**                               | Automate semver + changelog from the token contract.           | 🟡       |
| **Icon convention / set**                    | No icon system; most design systems ship or specify one.       | 🟡       |
| **eslint** (flat config)                     | JS surface is small; prettier + tests cover most.              | 🟢       |

Done already: stylelint + prettier, `node:test` integrity suite, a11y doc + ARIA
contract, forced-colors, RTL via logical properties, CI gate.

## Recommended order

1. ~~**Foundation tokens** — motion, z-index, elevation, opacity, density.~~ ✅ done.
2. ~~**Form controls + field** — the single biggest capability gap.~~ ✅ done.
3. **Overlays** — modal, tooltip, menu (after #1). _(next)_
4. **Table**.
5. **Quality** — visual-regression snapshots + changesets.

Biggest leverage: **#1 + #2.**
