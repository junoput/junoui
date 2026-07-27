// ════════════════════════════════════════════════════════════════════════
//  junoui — icon sprite builder
// ════════════════════════════════════════════════════════════════════════
//  Bundles the vendored SVG sources (src/icons/*.svg) into one referenceable
//  sprite:  dist/icons/juno-icons.svg  — a <symbol> per icon, id="juno-i-<name>".
//
//  Consumers reference a symbol without shipping any JS:
//      <svg class="juno-icon"><use href="…/juno-icons.svg#juno-i-gear" /></svg>
//
//  Sources are Phosphor Icons (bold), MIT-licensed. The sprite carries the
//  copyright + license banner and src/icons/LICENSE ships alongside, so the
//  bundle stays free to redistribute and sell. Run: `npm run build:icons`.
// ════════════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'src/icons';
const OUT_DIR = 'dist/icons';
const OUT = join(OUT_DIR, 'juno-icons.svg');
const OUT_JS = join(OUT_DIR, 'inline.js');

const files = readdirSync(SRC)
  .filter((f) => f.endsWith('.svg'))
  .sort();

const symbols = files.map((f) => {
  const name = f.replace(/\.svg$/, '');
  const raw = readFileSync(join(SRC, f), 'utf8');
  const viewBox = (raw.match(/viewBox="([^"]+)"/) || [, '0 0 256 256'])[1];
  // inner geometry only — strip the outer <svg> wrapper
  const inner = raw
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .trim();
  return `  <symbol id="juno-i-${name}" viewBox="${viewBox}">${inner}</symbol>`;
});

const banner =
  '<!-- junoui icon sprite. Generated; do not edit. Edit src/icons/ + rebuild.\n' +
  '     Icons: Phosphor Icons (bold), MIT © 2023 Phosphor Icons — see src/icons/LICENSE. -->';

const sprite =
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" fill="currentColor">\n` +
  `${symbols.join('\n')}\n</svg>\n`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, banner + '\n' + sprite);
console.log(`✓ built icon sprite: ${files.length} symbols → ${OUT}`);

// ── Inline injector module (junoui/icons/inline) ────────────────────────
//  Safari intermittently fails to render EXTERNAL sprite refs
//  (<use href="file.svg#id">) — icons randomly vanish and reappear. The
//  reliable path is a SAME-DOCUMENT ref (<use href="#juno-i-gear">), which
//  needs the sprite living in the current document. This module embeds the
//  sprite and injects it once, so every consumer stops hand-rolling that
//  injection. Auto-installs on import in a browser; also exported for manual
//  / multi-document (iframe) control.
const inlineModule = `// junoui — inline icon sprite injector. Generated; do not edit.
// Fixes Safari dropping external <use href="file.svg#id"> refs: this injects
// the sprite into the document so you reference icons same-document instead:
//   import 'junoui/icons/inline';
//   <svg class="juno-icon"><use href="#juno-i-gear" /></svg>
const SPRITE = ${JSON.stringify(sprite)};

/** Inject the sprite into \`doc\` once (id-guarded, safe to call repeatedly). */
export function installJunoIcons(doc = typeof document !== 'undefined' ? document : undefined) {
  if (!doc || doc.getElementById('juno-icon-sprite')) return;
  const holder = doc.createElement('div');
  holder.id = 'juno-icon-sprite';
  holder.style.display = 'none';
  holder.setAttribute('aria-hidden', 'true');
  holder.innerHTML = SPRITE;
  (doc.body || doc.documentElement).prepend(holder);
}

// Auto-install on import in a browser (no-op server-side / pre-hydration).
if (typeof document !== 'undefined') installJunoIcons();

export default installJunoIcons;
`;
writeFileSync(OUT_JS, inlineModule);
console.log(`✓ built inline sprite module → ${OUT_JS}`);
