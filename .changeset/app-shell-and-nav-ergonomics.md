---
'junoui': minor
---

App-shell composition primitive + nav ergonomics — all CSS, all additive:

- `.juno-app-shell` — the standard product frame as classes instead of a
  copy-pasted `<style>` block: `__body` column, `__topbar`, and a `__main`
  scroller with a dock/pillbar pinned at its foot. Encodes `100dvh` (dock isn't
  clipped by mobile browser chrome), main-as-scroller (dock stays put with no
  `sticky`/`fixed`), and safe-area insets. Knob: `--juno-app-shell-topbar-size`.
- `.juno-rail--responsive` — the rail self-hides below `md`, so the rail↔dock
  swap is one modifier instead of hanging `.juno-hide-below-md` yourself. rail.css
  now cross-references the dock pairing.
- Viewport helpers extended to `sm` (640px) and `lg` (1024px), each with
  `hide-below-*` / `hide-from-*`, plus readable `show-from-*` / `show-below-*`
  inverse aliases.
- `.juno-dock--fixed` / `.juno-pillbar--fixed` — pin to the viewport foot for
  page-scroll shells, where `position: sticky` won't pin on a non-overflowing
  column and the bar would land mid-content. Prefer `.juno-app-shell`, which
  avoids the problem entirely.
- `.juno-icon-loader` — a nav destination's icon ringed by the spinning
  [arc](../docs/components/loader.md) while its section loads. Icon static on
  top; ring sized in `em`, pointer-transparent, centered with `inset:0;margin:auto`
  (never `translate`, which the arc's rotation would clobber).
- `docs/` now ships in the npm tarball, so the paths README and the CSS
  comments point at (e.g. `docs/layout.md#app-shell`) resolve inside
  `node_modules` for consumers.
