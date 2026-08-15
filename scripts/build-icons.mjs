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

// ── Injector module (junoui/icons/install) ──────────────────────────────
//  The mechanism WITHOUT the payload. Safari intermittently fails to render
//  EXTERNAL sprite refs (<use href="file.svg#id">) — icons randomly vanish and
//  reappear — so the reliable path is a SAME-DOCUMENT ref, which needs a sprite
//  living in the current document.
//
//  This is its own module because a consumer that SUBSETS the sprite
//  (junoui/subset, docs/icon-subsetting.md) wants the injector and not the
//  66-symbol string: importing junoui/icons/inline to get the ~8 lines of
//  injection would drag 25 kB of icons it deliberately does not ship. That
//  consumer imports installSprite and passes its own subset (20260815-025).
const installModule = `// junoui — icon sprite injector, no payload. Generated; do not edit.
// Same-document injection, because Safari drops external <use href="file.svg#id">
// refs intermittently. Pair with junoui/subset when you ship a subset:
//   import { installSprite } from '@junoput01/junoui/icons/install';
//   import sprite from 'virtual:my-icon-subset';
//   installSprite(sprite);
export const JUNO_SPRITE_ID = 'juno-icon-sprite';

/**
 * Inject \`svg\` (sprite source) into \`doc\` once. Id-guarded, so calling it
 * repeatedly — or alongside junoui/icons/inline — installs exactly one sprite:
 * whichever ran first wins, and a second call is a no-op rather than a second
 * hidden holder shadowing the first.
 */
export function installSprite(svg, doc = typeof document !== 'undefined' ? document : undefined) {
  if (!doc || !svg || doc.getElementById(JUNO_SPRITE_ID)) return false;
  const holder = doc.createElement('div');
  holder.id = JUNO_SPRITE_ID;
  holder.style.display = 'none';
  holder.setAttribute('aria-hidden', 'true');
  holder.innerHTML = svg;
  (doc.body || doc.documentElement).prepend(holder);
  return true;
}

export default installSprite;
`;
writeFileSync(join(OUT_DIR, 'install.js'), installModule);
console.log(`\u2713 built injector module \u2192 ${join(OUT_DIR, 'install.js')}`);

// ── Inline injector module (junoui/icons/inline) ────────────────────────
//  The full sprite plus auto-installation: the zero-config path for a consumer
//  that draws icons across the set and does not subset. Delegates the injection
//  itself to ./install.js so there is ONE implementation of the hidden holder.
const inlineModule = `// junoui — inline icon sprite injector (full set). Generated; do not edit.
// Fixes Safari dropping external <use href="file.svg#id"> refs: this injects
// the sprite into the document so you reference icons same-document instead:
//   import '@junoput01/junoui/icons/inline';
//   <svg class="juno-icon"><use href="#juno-i-gear" /></svg>
// Shipping a SUBSET instead? Import junoui/icons/install and pass it, so this
// module's 25 kB of symbols never enters your bundle.
import { installSprite } from './install.js';

const SPRITE = ${JSON.stringify(sprite)};

/** Inject the full sprite into \`doc\` once (id-guarded, safe to call repeatedly). */
export function installJunoIcons(doc = typeof document !== 'undefined' ? document : undefined) {
  installSprite(SPRITE, doc);
}

// Auto-install on import in a browser (no-op server-side / pre-hydration).
if (typeof document !== 'undefined') installJunoIcons();

export default installJunoIcons;
`;
writeFileSync(OUT_JS, inlineModule);
console.log(`\u2713 built inline sprite module \u2192 ${OUT_JS}`);
