# design-sync notes — junoui

## Repo shape
- **CSS-only design system** — zero React components by design (CLAUDE.md rule 4). The
  converter runs the tokens-only path (`components: []`); `window.Juno` = token
  constants from `dist/js/tokens.js` + `installJunoIcons` from `dist/icons/inline.js`
  (via `extraEntries`).
- Preview cards are **off-script**: hand-authored fragments in `.design-sync/cards/<slug>.html`
  (one `<section data-cell="Label">` per cell), wrapped into `components/<Group>/<Name>/`
  cards by `.design-sync/gen-cards.mjs`, which also copies `docs/components/<slug>.md`
  as the `.prompt.md` and extends `_ds_sync.json` (renderHashFor/sourceKeyFor from the
  staged `lib/sync-hashes.mjs`, srcSha = fragment bytes) and patches
  `.ds-build-meta.json` componentCount (validate's count-mismatch check).

## Re-sync sequence (resync.mjs is NOT card-aware — don't use it alone)
```sh
node .ds-sync/package-build.mjs --config .design-sync/config.json \
  --node-modules ./.ds-sync/node_modules --entry ./dist/js/tokens.js --out ./ds-bundle
node .design-sync/gen-cards.mjs --out ./ds-bundle
node .ds-sync/package-validate.mjs ./ds-bundle
```
- `package-build` wipes `ds-bundle/` including cards — always re-run `gen-cards` after it.
- `react`/`react-dom` are NOT in the repo's node_modules (CSS-only); the converter's
  vendoring needs them → they're installed in `.ds-sync/node_modules`, hence
  `--node-modules ./.ds-sync/node_modules`.

## Gotchas that cost debugging time
- **`data-juno-palette` is required on `:root`** — without it NO color vars exist
  (components render cream/unstyled). Ticket `20260809-001` filed (docs claim
  standard/dark defaults). Additionally `@media (prefers-color-scheme: light)`
  restyles any page that doesn't pin `data-juno-mode` — headless chromium defaults to
  light, so cards pin `data-juno-palette="standard" data-juno-mode="dark"`.
- **Icons**: doc snippets use `…#juno-i-*` / external-file sprite refs that 404 in
  cards. Cards load `_ds_bundle.js` and call `Juno.installJunoIcons(document)`, then
  reference `#juno-i-*` same-document.
- Card techniques: `<dialog open style="position:absolute">` inside a
  `position:relative` wrapper (modal/drawer); fixed-position overlays (reload,
  dock--pill/--float) contained by `transform:translateZ(0)` wrappers; menu/popover
  opened via inline `<script>…showPopover()</script>`; tooltip bubbles forced visible
  with a scoped `<style>` override; `juno-hide-from-md` removed from dock card copies
  (cards render at desktop viewport, which hides those variants entirely).
- `docs/components/thumb.md` uses bare `badge badge--sm` classes that don't exist in
  the CSS — cards use `juno-badge juno-badge--micro` instead (doc bug worth a fix).
- Dock icon-variant `<button>` items show a UA-gray background in cards; `<a>` items
  render correctly — cards use `<a>` (possible component CSS gap for buttons).

## Known render warns (triaged legitimate — don't chase)
- `[RENDER_THIN] Icon: mounts have no text and paint nothing` — false positive: the
  cells are SVG-only and the checker's replaced-element regex matches uppercase
  tagNames while SVG reports lowercase `svg`. Icons verified rendering via screenshot.

## Re-sync risks
- `gen-cards.mjs` `GROUPS` map is the component index — a **new component** (new doc +
  fragment) must be added there or it's skipped with a warning. New docs also need a
  seeded fragment (`<section data-cell>` markup; see any existing file in `cards/`).
- Grades key on fragment bytes (srcSha) via the extended sidecar; editing a fragment
  correctly invalidates that component. Config `provider`/`extraEntries` changes flip
  the global slice → full re-verify.
- Render checks ran on playwright 1.61.1 / chromium-1228 (macOS cache); a different
  pinned playwright needs its matching chromium build.
- The showcase (`showcase/`) was NOT used as a render reference this run — grading was
  absolute-rubric from screenshots. Comparing cards against showcase pages is a good
  future audit.
- Git workflow: repo follows `docs/GIT_WORKFLOW.md` (Git Flow) — durable design-sync
  files land via a `chore/*` branch off `develop`, PR, squash-merge. Never direct to main.
