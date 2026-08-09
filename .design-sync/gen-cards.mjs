// design-sync card generator for junoui (CSS-only DS — no React exports).
// Wraps hand-authored fragments from .design-sync/cards/<slug>.html into
// preview cards the claude.ai/design pane renders, copies each component's
// doc as its .prompt.md, and extends ds-bundle/_ds_sync.json so re-syncs
// can diff card changes. Run AFTER package-build.mjs (which wipes ds-bundle):
//   node .design-sync/gen-cards.mjs --out ./ds-bundle
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const OUT = resolve(process.argv[process.argv.indexOf('--out') + 1] ?? './ds-bundle');
const CARDS = join(HERE, 'cards');
const DOCS = join(ROOT, 'docs/components');

const { renderHashFor, sourceKeyFor, configSlicesFor, auxShaFor } = await import(
  join(ROOT, '.ds-sync/lib/sync-hashes.mjs')
);

const GROUPS = {
  Actions: ['button', 'toggle-button', 'segmented', 'chip'],
  Forms: ['field', 'input', 'select', 'checkbox', 'switch', 'slider', 'stepper'],
  'Data display': ['card', 'list', 'table', 'badge', 'avatar', 'readout', 'gauge', 'spark', 'status', 'divider', 'icon', 'thumb'],
  Feedback: ['alert', 'toast', 'loader', 'icon-loader', 'skeleton', 'load-state', 'reload'],
  Navigation: ['tabs', 'accordion', 'breadcrumb', 'pagination', 'navbar', 'rail', 'dock', 'pillbar'],
  Overlays: ['modal', 'drawer', 'menu', 'popover', 'tooltip'],
};

const pascal = (slug) => slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// fragment format: optional first-line <!-- meta: viewport=WxH; col -->,
// then <section data-cell="Label">…junoui markup…</section> per cell.
function parseFragment(txt) {
  const meta = /^<!--\s*meta:([^>]*)-->/.exec(txt);
  const viewport = meta && /viewport=(\d+x\d+)/.exec(meta[1])?.[1];
  const col = meta ? /\bcol\b/.test(meta[1]) : false;
  const cells = [];
  const re = /<section\s+data-cell="([^"]+)"[^>]*>([\s\S]*?)<\/section>\s*(?=<section\s+data-cell=|$)/g;
  for (let m; (m = re.exec(txt)); ) cells.push({ label: m[1], html: m[2].trim() });
  return { viewport, col, cells };
}

function cardHtml(group, name, frag) {
  const vp = frag.viewport ? ` viewport="${frag.viewport}"` : '';
  const cells = frag.cells
    .map(
      (c, i) =>
        `    <section class="ds-cell"><h4>${esc(c.label)}</h4><div id="r${i + 1}" data-story="${esc(c.label)}">\n${c.html}\n    </div></section>`
    )
    .join('\n');
  return `<!-- @dsCard group="${esc(group)}"${vp} -->
<!doctype html>
<html data-juno-palette="standard" data-juno-mode="dark"><head><meta charset="utf-8"><title>${name}</title>
  <link rel="stylesheet" href="../../../styles.css">
  <style>
    body{margin:0;padding:16px;background:var(--juno-s0,#0b0e11)}
    .ds-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px;align-items:start}
    .ds-grid.ds-col{grid-template-columns:1fr}
    .ds-cell{border:1px solid rgb(128 128 128 / .25);border-radius:8px;padding:12px;min-width:0;overflow:hidden;transform:translateZ(0)}
    .ds-cell>h4{margin:0 0 8px;font:600 12px system-ui;color:#8a939e;text-transform:uppercase;letter-spacing:.04em}
  </style>
</head><body>
  <div class="ds-grid${frag.col ? ' ds-col' : ''}">
${cells}
  </div>
  <script src="../../../_ds_bundle.js"></script>
  <script>window.Juno && Juno.installJunoIcons && Juno.installJunoIcons(document);</script>
</body></html>
`;
}

const cfg = JSON.parse(readFileSync(join(HERE, 'config.json'), 'utf8'));
const slices = configSlicesFor(cfg, HERE);
const sync = JSON.parse(readFileSync(join(OUT, '_ds_sync.json'), 'utf8'));
sync.renderHashes ??= {};
sync.sourceKeys ??= {};

const slugToGroup = {};
for (const [g, slugs] of Object.entries(GROUPS)) for (const s of slugs) slugToGroup[s] = g;

let emitted = 0;
const missing = [];
for (const f of readdirSync(CARDS).filter((f) => f.endsWith('.html')).sort()) {
  const slug = f.replace(/\.html$/, '');
  const group = slugToGroup[slug];
  if (!group) { missing.push(slug); continue; }
  const name = pascal(slug);
  const fragTxt = readFileSync(join(CARDS, f), 'utf8');
  const frag = parseFragment(fragTxt);
  if (!frag.cells.length) { console.error(`! ${slug}: no <section data-cell> cells — skipped`); continue; }
  const dir = join(OUT, 'components', group, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${name}.html`), cardHtml(group, name, frag));
  const doc = join(DOCS, `${slug}.md`);
  if (existsSync(doc)) writeFileSync(join(dir, `${name}.prompt.md`), readFileSync(doc, 'utf8'));
  else console.error(`! ${slug}: no doc at ${doc} — .prompt.md skipped`);
  const srcSha = createHash('sha256').update(fragTxt).digest('hex').slice(0, 16);
  sync.renderHashes[name] = renderHashFor(OUT, { name, group }, { srcSha });
  sync.sourceKeys[name] = sourceKeyFor(name, { globalSlice: slices.global, componentSlice: slices.componentFor(name), srcSha, designSyncDir: HERE });
  emitted++;
}
sync.auxSha = auxShaFor(OUT);
writeFileSync(join(OUT, '_ds_sync.json'), JSON.stringify(sync, null, 2) + '\n');
const metaPath = join(OUT, '.ds-build-meta.json');
const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
meta.componentCount = emitted;
writeFileSync(metaPath, JSON.stringify(meta) + '\n');
if (missing.length) console.error(`! not in GROUPS map: ${missing.join(', ')}`);
console.error(`✓ gen-cards: ${emitted} cards → ${OUT}/components/ (+ sidecar updated)`);
