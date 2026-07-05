---
'junoui': minor
---

Field-driven components + patterns (first production consumer, a media-server web
client — features landed generic, origin logged in `docs/roadmap.md`):

- **Dense sizes:** `.juno-btn--sm` (toolbar-scale button; documented WCAG tap-min
  trade-off) and `.juno-switch--sm` (quiet 40×20 per-row toggle, no printed legend).
- **Segmented control:** `.juno-seg` — exclusive-choice pill row on native radios,
  zero JS; `aria-pressed` button flavor for JS-driven apps; `--sm` size; role-colored
  checked pill.
- **Gauge:** `.juno-gauge` — determinate metric ring (conic-gradient + registered
  `--juno-gauge-value`, no SVG); `--sm`/`--lg`; thresholds stay app policy (recipe
  documented).
- **Spark:** `.juno-spark` — sparkline size/stroke/role contract; app supplies the
  polyline (junoui still ships no charting).
- **Micro badge:** `.juno-badge--micro` — mono data-UI atom for provenance/kind tags
  and threshold values.
- **Rail:** `.juno-rail` — collapsible app-shell nav; active styled via
  `aria-current`, logical edges (RTL-safe).
- **Content density:** `--juno-tile-min` + `--juno-gap-content` archetype and
  `.juno-grid-auto--tiles`, so media walls re-densify from `data-juno-density`.
- **Icons:** 14 media/system Phosphor glyphs (squares-four, images, hexagon,
  puzzle-piece, play, film-strip, cloud, cloud-arrow-down, arrows-clockwise, cpu,
  hard-drives, sliders, arrows-out, upload-simple).
- **Docs:** app-shell recipe (`layout.md#app-shell`), drawer slide-over pattern,
  spark point-generator; new `.juno-sr-only` utility.
