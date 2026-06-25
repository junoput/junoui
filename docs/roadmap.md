# Roadmap — missing capabilities

Gap analysis vs mature design systems (Material, Carbon, Radix, Polaris, Tailwind).
What junoui does **not** yet have, prioritised. The framework line holds throughout:
junoui ships the **look + the accessibility/structure contract**; stateful behavior
(focus traps, open/close, positioning, data) lives in apps or a sibling
`junoui-<framework>` package.

Priority key: 🔴 must · 🟡 high · 🟢 nice.

## Have today

Tokens (color · spacing · type · radius · border · size · breakpoints), themes
(3 palettes × dark/light), CSS components (badge, button, card, readout, status dot,
loaders), layout primitives + container queries, multi-platform outputs, docs, lint +
tests + CI.

## Foundations (token gaps)

| Missing                           | Why                                                                               | Priority |
| --------------------------------- | --------------------------------------------------------------------------------- | -------- |
| **Motion** (duration + easing)    | Keyframes exist but timings are hardcoded. Shared scale for transitions/overlays. | 🔴       |
| **Z-index scale**                 | No layering system → overlays/modals/tooltips collide. Needed before any overlay. | 🔴       |
| **Elevation / shadow**            | Depth is border-only (intentional, but raised surfaces/dropdowns need shadow).    | 🟡       |
| **Opacity scale**                 | Disabled states, scrims, overlays.                                                | 🟡       |
| **Density modes** (compact/comfy) | Cockpit/data domain — swap the padding scale via an attribute. High value.        | 🟡       |

## Components

| Missing                                                                                             | Priority |
| --------------------------------------------------------------------------------------------------- | -------- |
| **Form controls** — input, textarea, select, checkbox, radio, switch, slider                        | 🔴       |
| **Field** wrapper — label + control + help + error + required                                       | 🔴       |
| **Overlays** — modal/dialog, drawer, tooltip, popover, menu/dropdown (needs z-index + motion first) | 🔴       |
| **Table / data grid** styling                                                                       | 🔴       |
| **Alert / toast / inline notification**                                                             | 🟡       |
| **Tabs**, accordion / disclosure                                                                    | 🟡       |
| **Skeleton** loading placeholder (pairs with loaders)                                               | 🟡       |
| Avatar, chip/tag, divider, breadcrumb, pagination, stepper                                          | 🟢       |
| Dumb chat/calendar **visuals** (message bubble, event chip, day-cell)                               | 🟢       |

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

1. **Foundation tokens** — motion, z-index, elevation, opacity. Small; unblocks the rest.
2. **Form controls + field** — the single biggest capability gap.
3. **Overlays** — modal, tooltip, menu (after #1).
4. **Table**.
5. **Quality** — visual-regression snapshots + changesets.

Biggest leverage: **#1 + #2.**
