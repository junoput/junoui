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

## Field-driven — ✅ shipped 2026-07

Gaps surfaced by the first production consumer (a media-server web client, 2026-07):
everything a real app had to hand-roll on top of junoui, rebuilt here as generic,
reusable pieces. The rule stands — features land app-agnostic; only the origin is
logged.

| Done                   | What shipped                                                                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Dense sizes**        | `.juno-btn--sm` + `.juno-switch--sm` for 40–46px toolbar chrome / per-row toggles.                                                                                                               |
| **Segmented control**  | `.juno-seg` — radio-driven exclusive pill row, zero JS; `aria-pressed` button flavor.                                                                                                            |
| **Gauge**              | `.juno-gauge` — determinate metric ring (conic-gradient), value centered, threshold recipe doc.                                                                                                  |
| **Spark**              | `.juno-spark` — sparkline size/stroke/color contract (app supplies points; no charting shipped).                                                                                                 |
| **Micro badge**        | `.juno-badge--micro` — mono data-UI atom for provenance/kind tags + threshold values.                                                                                                            |
| **Rail + app shell**   | `.juno-rail` (collapsible, `aria-current`-styled) + `layout.md#app-shell` recipe.                                                                                                                |
| **Content density**    | `--juno-tile-min`/`--juno-gap-content` archetype + `.juno-grid-auto--tiles`.                                                                                                                     |
| **Slide-over recipe**  | Drawer doc: scrim + header/body/pinned-footer composition from existing parts.                                                                                                                   |
| **Media/system icons** | 14 Phosphor glyphs: squares-four · images · hexagon · puzzle-piece · play · film-strip · cloud · cloud-arrow-down · arrows-clockwise · cpu · hard-drives · sliders · arrows-out · upload-simple. |

## Mobile — ✅ shipped 2026-07

Mobile-first structures for narrow viewports and touch, automatic where safe,
opt-in where markup is needed:

| Done                 | What shipped                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Dock**             | `.juno-dock` — bottom nav, phone counterpart of the rail; sticky, safe-area padded; shell swap recipe in `layout.md`.                 |
| **Bottom sheet**     | Modal auto-converts below `bp.sm`: full-width, top-rounded, slides up, stretched footer actions.                                      |
| **Drawer phone fit** | Side drawers cap at `85vw` (scrim stays tappable); bottom drawer pads for the home indicator.                                         |
| **Toast snackbar**   | Full-width bottom stack on phones; slides up instead of sideways.                                                                     |
| **Scrollable tabs**  | Tab strip scrolls sideways instead of overflowing.                                                                                    |
| **Stacked table**    | `.juno-table--stack` + `data-label` — card rows below a 480px container; real `<table>` semantics kept.                               |
| **Touch ergonomics** | `pointer: coarse` raises `--juno-size-tap-min` → 44px; `hover: none` keeps table row actions visible.                                 |
| **Pillbar**          | `.juno-pillbar` — floating pill bar (iOS-style): 2–5 icon destinations/actions, translucent + blurred, safe-area.                     |
| **Navbar**           | `.juno-navbar` — stack top bar: back control always on the start edge, centered truncating title, trailing actions.                   |
| **List**             | `.juno-list` — grouped rows (settings pattern): icon + label/support + trailing value/control/chevron.                                |
| **Tab + stack**      | Shell recipe in `layout.md`: dock/pillbar switches sections, navbar backs out of pushed views.                                        |
| **Touch motion**     | Press feedback on dock/pillbar/navbar/list (dip + spring, token-timed); state/hover transitions replace snaps; RTL-correct chevron.   |
| **Sheet grabber**    | `.juno-modal__grabber` — presentational drag handle on the phone sheet + bottom drawer; drag-to-dismiss recipe in `motion.md`.        |
| **Motion guide**     | `docs/motion.md` — motion-token vocabulary + what apps must wire (overlay triggers, drag gestures, view transitions, reduced-motion). |

## Quality / infra

| Missing                                          | Why                                                                                              | Priority |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ | -------- |
| ~~**Visual regression** snapshots (Playwright)~~ | ✅ shipped — `npm run test:visual` diffs every showcase page (dark + light).                     | ✅       |
| ~~**Changesets**~~                               | ✅ shipped — `npm run changeset`; manual Version PR (`npm run version`) → CI publishes on merge. | ✅       |
| ~~**Icon convention / set**~~                    | ✅ shipped — `.juno-icon` + SVG sprite (Phosphor bold, MIT).                                     | ✅       |
| **eslint** (flat config)                         | JS surface is small; prettier + tests cover most.                                                | 🟢       |

Done already: stylelint + prettier, `node:test` integrity suite, a11y doc + ARIA
contract, forced-colors, RTL via logical properties, CI gate.

## Recommended order

1. ~~**Foundation tokens** — motion, z-index, elevation, opacity, density.~~ ✅ done.
2. ~~**Form controls + field** — the single biggest capability gap.~~ ✅ done.
3. ~~**Overlays** — modal, tooltip, menu.~~ ✅ done.
4. ~~**Table / data grid** — sortable header, cell types, row states, overflow, skeleton/empty.~~ ✅ done.
5. ~~**Quality** — visual-regression snapshots + changesets.~~ ✅ done.

Biggest leverage: **#1 + #2.**
