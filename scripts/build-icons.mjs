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
