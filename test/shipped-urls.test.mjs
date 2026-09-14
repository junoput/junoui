// Every local `url()` in a shipped stylesheet must resolve (20260914-112).
//
// Fonts are deliberately opt-in: `bundle-css.mjs` keeps them OUT of `juno.css`
// (no forced network, no CSP break) and ships `dist/css/juno-fonts.css` beside
// `dist/fonts/*.woff2`, so `import 'junoui/fonts.css'` resolves locally.
//
// THE FILE IS COPIED VERBATIM. `read(join(SRC, 'fonts.css'))` is written
// straight out with no path rewriting, so its `url('../fonts/b612-400.woff2')`
// works in `dist/` only because `dist/css/` sits beside `dist/fonts/` exactly as
// `src/css/` sits beside `src/fonts/`. Two trees, the same relative shape, and
// until this file nothing asserted they stay parallel.
//
// WHY IT MATTERS MORE THAN A BROKEN IMAGE: a missing `woff2` does not error. The
// browser falls back to a system font, so the page renders, nothing appears in
// the console that a consumer would attribute to us, and the only symptom is
// that junoui does not look like junoui. `src/fonts` was referenced by ZERO
// tests before this.
//
// It also covers `src/css`, because a consumer may import the sources directly —
// that is why `src/css` is in package.json's `files` at all.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

/** Every shipped stylesheet, by the directories package.json actually ships. */
function sheets() {
  const out = [];
  for (const dir of ['dist/css', 'src/css', 'src/css/components']) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) if (f.endsWith('.css')) out.push(join(dir, f));
  }
  return out;
}

/** Local `url()` targets in one sheet — data: and absolute URLs are not ours. */
function localUrls(file) {
  const css = readFileSync(file, 'utf8');
  const out = [];
  for (const m of css.matchAll(/url\(([^)]+)\)/g)) {
    const raw = m[1].replace(/['"]/g, '').trim();
    if (/^(data:|https?:|\/\/)/.test(raw)) continue;
    out.push(raw.split(/[?#]/)[0]);
  }
  return out;
}

const SHEETS = sheets();

test('the shipped stylesheets were really found (vacuity floor)', () => {
  // Without this a renamed directory makes every assertion below iterate an
  // empty list: zero broken out of zero checked, which reads as a clean tree.
  assert.ok(SHEETS.length >= 30, `only ${SHEETS.length} shipped stylesheets found`);
});

test('the font sheet still carries local url() references (the case this guards)', () => {
  // The floor that matters. If `juno-fonts.css` stopped emitting `url()` at all —
  // a bundler change inlining or dropping them — the resolve check below would
  // pass by having nothing to resolve, and the fonts would be just as broken.
  const fontSheet = 'dist/css/juno-fonts.css';
  assert.ok(existsSync(fontSheet), `${fontSheet} is not built — fonts ship from here`);
  assert.equal(
    localUrls(fontSheet).length,
    4,
    'juno-fonts.css should reference exactly the four woff2 faces',
  );
});

test('every local url() in a shipped stylesheet resolves from where that sheet ships', () => {
  const broken = [];
  let checked = 0;
  for (const file of SHEETS) {
    for (const ref of localUrls(file)) {
      checked++;
      if (!existsSync(resolve(dirname(file), ref))) broken.push(`${file} -> ${ref}`);
    }
  }
  assert.ok(checked >= 4, `only ${checked} local url() references found — suspect the regex`);
  assert.deepEqual(
    broken,
    [],
    'a shipped stylesheet points at a file that is not beside it. The font sheet ' +
      'is copied VERBATIM from src/css into dist/css, so its `../fonts/` only ' +
      'works while dist/css sits beside dist/fonts exactly as src/css sits beside ' +
      'src/fonts. A missing woff2 does not error — the browser falls back to a ' +
      'system font and the only symptom is that junoui stops looking like junoui.',
  );
});
