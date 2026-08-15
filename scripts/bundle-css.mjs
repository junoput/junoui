// ════════════════════════════════════════════════════════════════════════
//  junoui — CSS bundler
// ════════════════════════════════════════════════════════════════════════
//  Concatenates the authored CSS layer (src/css) on top of the generated
//  token variables into a single drop-in stylesheet:
//
//    dist/css/juno.css         tokens + base + utilities + components
//    dist/css/juno-tokens.css  variables only (built by Style Dictionary)
//
//  Run after the token build: `npm run build:css` (or `npm run build`).
// ════════════════════════════════════════════════════════════════════════

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
  copyFileSync,
} from 'node:fs';
import { join } from 'node:path';

const TOKENS = 'dist/css/juno-tokens.css';
const SRC = 'src/css';
const OUT = 'dist/css/juno.css';

if (!existsSync(TOKENS)) {
  console.error(`✗ ${TOKENS} missing — run "npm run build:tokens" first.`);
  process.exit(1);
}

const read = (p) => readFileSync(p, 'utf8').trim();
const parts = [];

parts.push(read(TOKENS));
parts.push(read(join(SRC, 'base.css')));
parts.push(read(join(SRC, 'layout.css')));
parts.push(read(join(SRC, 'density.css')));
parts.push(read(join(SRC, 'typescale.css')));

const compDir = join(SRC, 'components');
for (const f of readdirSync(compDir)
  .filter((f) => f.endsWith('.css'))
  .sort()) {
  parts.push(read(join(compDir, f)));
}

// Utilities LAST: role helpers (.juno--nominal …) set --juno-role at the same
// specificity as component defaults (.juno-gauge { --juno-role: … }), so they
// must come later in the source order or every role recolor silently loses
// the cascade to the component's own default.
parts.push(read(join(SRC, 'utilities.css')));

// Overrides ABSOLUTELY last: cross-cutting @media/@supports gates whose job is
// to beat a component default. A gate adds no specificity, so a gate written
// earlier in the bundle loses to the component on source order alone — and
// loses silently. Four shipped instances of that are catalogued in
// src/css/overrides.css; test/build.test.mjs asserts there are none left.
parts.push(read(join(SRC, 'overrides.css')));

let body = parts.join('\n\n');

// CSS requires every @import to precede all style rules. Hoist them to the
// top of the bundle (deduped) — otherwise the browser silently drops them
// and the font families never load.
const imports = [];
body = body.replace(/^[ \t]*@import.*;[ \t]*$/gm, (line) => {
  const stmt = line.trim();
  if (!imports.includes(stmt)) imports.push(stmt);
  return '';
});
body = body.replace(/\n{3,}/g, '\n\n').trim();

const banner = `/**
 * junoui — complete stylesheet (tokens + base + utilities + components).
 * Generated bundle; edit sources in src/css/ and rebuild.
 */`;

const head = [banner, ...imports].join('\n');
writeFileSync(OUT, head + '\n\n' + body + '\n');
console.log(`✓ bundled ${parts.length} layers (${imports.length} @import hoisted) → ${OUT}`);

// Fonts are opt-in and NOT part of juno.css (no forced network / CSP break).
// Ship the self-hosted @font-face sheet + woff2 alongside the bundle so
// `import 'junoui/fonts.css'` resolves to local files under dist/fonts/.
const FONT_SRC = 'src/fonts';
if (existsSync(join(SRC, 'fonts.css')) && existsSync(FONT_SRC)) {
  writeFileSync('dist/css/juno-fonts.css', read(join(SRC, 'fonts.css')) + '\n');
  mkdirSync('dist/fonts', { recursive: true });
  const fonts = readdirSync(FONT_SRC).filter((f) => f.endsWith('.woff2'));
  for (const f of fonts) copyFileSync(join(FONT_SRC, f), join('dist/fonts', f));
  console.log(`✓ fonts: juno-fonts.css + ${fonts.length} woff2 → dist/fonts/`);
}
