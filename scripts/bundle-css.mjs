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

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
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
parts.push(read(join(SRC, 'utilities.css')));
parts.push(read(join(SRC, 'layout.css')));
parts.push(read(join(SRC, 'density.css')));

const compDir = join(SRC, 'components');
for (const f of readdirSync(compDir)
  .filter((f) => f.endsWith('.css'))
  .sort()) {
  parts.push(read(join(compDir, f)));
}

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
