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
field · input · select · checkbox · radio · switch · slider; **overlays** — modal ·
drawer · tooltip · popover · menu), layout primitives + container queries,
multi-platform outputs, docs, lint + tests + CI.

## Foundations (token gaps) — ✅ shipped 2026-06

All foundation token gaps are now built. Values: [tokens-reference.md](./tokens-reference.md);
usage: [design-guidelines.md](./design-guidelines.md).

| Done                              | What shipped                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Motion** (duration + easing)    | `--juno-motion-duration-{instant,quick,base,deliberate}` + `--juno-motion-ease-{decel,accel,standard,spring}`. |
| **Z-index scale**                 | `--juno-z-*` layer stack: surface · raised · anchored · overlay · alert.                                       |
| **Elevation / shadow**            | `--juno-shadow-{1,2,3}` (e1–e3) — border-first depth; shadow for lifted surfaces.                              |
| **Opacity scale**                 | `--juno-opacity-{disabled,muted,scrim}`.                                                                       |
| **Density modes** (compact/comfy) | `data-juno-density` swaps semantic padding aliases (`--juno-pad-*`, `--juno-gap-control`).                     |

## Components

| Missing                                                                                                                                                                                                          | Priority   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| ~~**Form controls** — input, textarea, select, checkbox, radio, switch, slider~~                                                                                                                                 | ✅ shipped |
| ~~**Field** wrapper — label + control + help + error + required~~                                                                                                                                                | ✅ shipped |
| ~~**Overlays** — modal/dialog, drawer, tooltip, popover, menu/dropdown~~                                                                                                                                         | ✅ shipped |
| ~~**Table / data grid** styling~~                                                                                                                                                                                | ✅ shipped |
| ~~**Alert / toast / inline notification**~~                                                                                                                                                                      | ✅ shipped |
| ~~**Tabs**, accordion / disclosure~~                                                                                                                                                                             | ✅ shipped |
| ~~**Skeleton** loading placeholder (pairs with loaders)~~                                                                                                                                                        | ✅ shipped |
| ~~Avatar, chip/tag, divider, breadcrumb, pagination, stepper~~                                                                                                                                                   | ✅ shipped |
| **Chat layer** (`junoui-chat`) — message bubble, list, day separator, system pill, attachment cards, conversation header, chat-row, rail. Requested by the buzz integration; highest-leverage gap for chat apps. | 🟡         |
| Calendar **visuals** (event chip, day-cell)                                                                                                                                                                      | 🟢         |

## Quality / infra

| Missing                                          | Why                                                                           | Priority |
| ------------------------------------------------ | ----------------------------------------------------------------------------- | -------- |
| ~~**Visual regression** snapshots (Playwright)~~ | ✅ shipped — `npm run test:visual` diffs every showcase page (dark + light).  | ✅       |
| ~~**Changesets**~~                               | ✅ shipped — `npm run changeset`; CI opens a Version PR → publishes on merge. | ✅       |
| ~~**Icon convention / set**~~                    | ✅ shipped — `.juno-icon` + SVG sprite (Phosphor bold, MIT).                  | ✅       |
| **eslint** (flat config)                         | JS surface is small; prettier + tests cover most.                             | 🟢       |

Done already: stylelint + prettier, `node:test` integrity suite, a11y doc + ARIA
contract, forced-colors, RTL via logical properties, CI gate.

## Recommended order

1. ~~**Foundation tokens** — motion, z-index, elevation, opacity, density.~~ ✅ done.
2. ~~**Form controls + field** — the single biggest capability gap.~~ ✅ done.
3. ~~**Overlays** — modal, tooltip, menu.~~ ✅ done.
4. ~~**Table / data grid** — sortable header, cell types, row states, overflow, skeleton/empty.~~ ✅ done.
5. ~~**Quality** — visual-regression snapshots + changesets.~~ ✅ done.

Biggest leverage: **#1 + #2.**
