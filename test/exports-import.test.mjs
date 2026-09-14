// package.json's `exports` map, checked one hop past exports-map.test.mjs.
//
// exports-map.test.mjs asserts every target EXISTS and is inside `files`. It
// does not assert the module LOADS. A syntax error, a bad relative import, or
// a `document` reference at module scope passes `existsSync` and only fails at
// a consumer's own `import` — the same is_some()-shaped gap as everywhere else
// on this board: the artefact is present, whether it WORKS is a separate
// question nobody asked (20260914-111).
//
// IMPORTED FROM A REAL PACKED TARBALL, NOT THE REPO TREE, and that is not
// decoration. A relative import that resolves in the repo can still 404 once
// only `files` is present — exports-map.test.mjs's own header already records
// this exact shape for an export TARGET (the 0.4.0 defect: an export
// resolving locally and missing from the tarball). This file found the same
// shape one hop further in, live: `tools/pointer-first.mjs` re-exported from
// `../scripts/rules.mjs`, which resolves fine here (this repo has a
// `scripts/` directory) and threw `ERR_MODULE_NOT_FOUND` from an actually
// extracted tarball, because `scripts/` is not in `files`. A check that
// imports from the repo tree — which is what this file's own first draft did,
// and what the ticket's own preliminary measurement did — could not have
// caught it; both would report a clean pass while shipping a broken entry
// point. Fixed by moving the shared table into `tools/rules.mjs`, same
// directory as its only shipped consumer.
//
// SCOPE, stated deliberately rather than left to an extension filter. The
// exports map has targets no JS runtime can load at all — CSS, SCSS, Android
// XML, Swift, Dart, Rust, an SVG sprite, a `.d.ts` type-only file. Silently
// skipping "whatever doesn't look like JS" is the failure this board keeps
// finding elsewhere (an enumeration that quietly covers 8 of 18 and reads as
// complete): every target below is put in exactly one of three buckets — JS,
// JSON, or NON_JS_REASON — and a target that lands in none of them fails the
// vacuity test by name, rather than being dropped on the floor by a `.endsWith`
// nobody re-reads.
//
// SHAPE, decided rather than skipped. These are ten browser enhancers with no
// shared export contract — some default-export a function, most only have
// named exports, and the named exports differ per module (`enhanceRange` is
// not `enhanceTree`). Asserting the SPECIFIC shape of each would mean a
// hand-maintained table of expected export names per module — the Local
// custom properties allowlist's problem, imported into this file. What is
// assertable without that list, and worth asserting: a module that imports
// without throwing but exports NOTHING is still broken — a consumer's named
// import gets `undefined`, silently, which is exactly the failure mode a
// renamed export-without-the-`export`-keyword produces and which "did not
// throw" cannot see. So: import must not throw, AND the resulting namespace
// must have at least one key. That is a floor, not a contract, and it is
// cheap enough to hold for every module without maintaining a list of what
// each one is supposed to export.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, extname } from 'node:path';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const EXPORTS = pkg.exports;

const JS_EXT = new Set(['.js', '.mjs']);
const JSON_EXT = new Set(['.json']);

/** Extension -> why it is not a JS/JSON module, named so the skip is legible. */
const NON_JS_REASON = {
  '.css': 'stylesheet — not a JS module',
  '.scss': 'Sass source — not a JS module',
  '.xml': 'Android resource XML — not a JS module',
  '.swift': 'Swift source — node cannot import it',
  '.dart': 'Dart source — node cannot import it',
  '.rs': 'Rust source — node cannot import it',
  '.svg': 'SVG markup — not a JS module',
  '.ts': 'type declarations only (.d.ts) — type-only, no runtime module',
};

/** Every distinct file an exports entry can resolve to, mapped to the
 *  specifiers that point at it (a target can be reached by more than one
 *  condition, e.g. "." -> import/default share a file). */
function allTargets() {
  const byPath = new Map();
  for (const [sub, target] of Object.entries(EXPORTS)) {
    const paths = typeof target === 'string' ? [target] : Object.values(target);
    for (const p of paths) {
      if (typeof p !== 'string') continue;
      if (!byPath.has(p)) byPath.set(p, new Set());
      byPath.get(p).add(sub);
    }
  }
  return byPath;
}

const TARGETS = allTargets();

test('the exports map was really read (vacuity floor)', () => {
  assert.ok(TARGETS.size >= 20, `only ${TARGETS.size} distinct export targets found`);
});

test('every exports target lands in exactly one bucket: JS, JSON, or a named non-JS reason', () => {
  const unclassified = [];
  for (const p of TARGETS.keys()) {
    const ext = extname(p);
    if (JS_EXT.has(ext) || JSON_EXT.has(ext) || ext in NON_JS_REASON) continue;
    unclassified.push(`${p}  (extension "${ext}" is not in JS_EXT, JSON_EXT, or NON_JS_REASON)`);
  }
  assert.deepEqual(
    unclassified,
    [],
    'an exports target has no classification — add its extension to JS_EXT, JSON_EXT, ' +
      'or NON_JS_REASON (with a reason) rather than letting it fall through unseen',
  );
});

const JS_TARGETS = [...TARGETS].filter(([p]) => JS_EXT.has(extname(p)));
const JSON_TARGETS = [...TARGETS].filter(([p]) => JSON_EXT.has(extname(p)));

test('every JS/JSON target was actually counted (vacuity floor)', () => {
  // Ten tools/ enhancers plus at least tokens.js, identity.js, and the two
  // icons/ modules — a floor loose enough to survive a new export, tight
  // enough to catch an extension-matching regression that silently stops
  // finding anything.
  assert.ok(JS_TARGETS.length >= 14, `only ${JS_TARGETS.length} JS targets found`);
  assert.ok(JSON_TARGETS.length >= 3, `only ${JSON_TARGETS.length} JSON targets found`);
});

test('every JS and JSON export target loads from a REAL packed tarball', async () => {
  const WORK = join(process.cwd(), '.exports-import-check');
  rmSync(WORK, { recursive: true, force: true });
  mkdirSync(WORK, { recursive: true });
  try {
    // --ignore-scripts: the build already ran (npm test's own prebuild step,
    // same assumption exports-map.test.mjs makes about dist/ existing); no
    // need to re-run `prepare` inside the pack step. Mirrors
    // scripts/consumer-gate.mjs's own flag choice for the same reason.
    execFileSync('npm', ['pack', '--ignore-scripts', '--pack-destination', WORK], {
      cwd: process.cwd(),
    });
    const tgz = readdirSync(WORK).find((f) => f.endsWith('.tgz'));
    assert.ok(tgz, 'npm pack produced no tarball');
    execFileSync('tar', ['-xzf', tgz, '-C', WORK], { cwd: WORK });
    const root = join(WORK, 'package');

    const importFailures = [];
    const emptyModules = [];
    for (const [p, specifiers] of JS_TARGETS) {
      const abs = join(root, p.replace(/^\.\//, ''));
      const label = `${[...specifiers].sort().join(', ')} -> ${p}`;
      let mod;
      try {
        // file:// URL, not a bare path — import() resolves a bare path
        // relative to THIS file, not to `abs`.
        mod = await import(`file://${abs}`);
      } catch (e) {
        importFailures.push(`${label}: ${e.message}`);
        continue;
      }
      if (Object.keys(mod).length === 0) emptyModules.push(label);
    }
    assert.deepEqual(
      importFailures,
      [],
      'an exports target that exists and ships still fails to import from a real ' +
        'packed install — check for a relative import reaching outside package.json ' +
        '"files", a syntax error, or a top-level `document`/`window` reference',
    );
    assert.deepEqual(
      emptyModules,
      [],
      "an exports target imported without throwing but exports nothing — a consumer's " +
        'named import would silently get `undefined`',
    );

    const jsonFailures = [];
    for (const [p] of JSON_TARGETS) {
      const abs = join(root, p.replace(/^\.\//, ''));
      try {
        JSON.parse(readFileSync(abs, 'utf8'));
      } catch (e) {
        jsonFailures.push(`${p}: ${e.message}`);
      }
    }
    assert.deepEqual(jsonFailures, [], 'an exports target that should be JSON does not parse');
  } finally {
    rmSync(WORK, { recursive: true, force: true });
  }
});
