// package.json's `exports` map, checked in both directions.
//
// SHIPPING IS NOT THE SAME AS IMPORTABLE. test/pack.test.mjs asserts the
// tarball CONTAINS certain files; it cannot see whether a consumer can reach
// them. Once an `exports` map exists, any subpath not listed is BLOCKED, so a
// file can sit in node_modules and still throw ERR_PACKAGE_PATH_NOT_EXPORTED.
// The map is exactly what makes the difference invisible — the file is right
// there.
//
// Both failure directions have now happened here:
//
//   export -> missing file   0.4.0 shipped an export re-exporting from
//                            scripts/, which `files` does not ship. Resolved
//                            in the repo, 404 in the tarball (RELEASING.md).
//   file -> missing export   tools/pointer-first.mjs was moved into tools/
//                            SPECIFICALLY so it could be exported — its own
//                            header says so — and the export entry was never
//                            added, while docs/painted-ui.md advertised
//                            `@junoput01/junoui/pointer-first` (20260909-094).
//
// BARE SPECIFIERS ONLY. A documented FILE PATH is not an import: README shows
// `<use href="node_modules/@junoput01/junoui/dist/icons/juno-icons.svg#…">`,
// an HTML URL that the exports map does not govern. A check that did not make
// that distinction would demand an export for every documented path — 1 of the
// 2 hits in the first scan was this false positive, so the distinction is not
// hypothetical.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const EXPORTS = pkg.exports;

/** Every markdown file that ships or is read by a consumer. */
function docs() {
  const out = ['README.md'];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) out.push(p);
    }
  };
  walk('docs');
  return out;
}

/**
 * Bare package specifiers named in the docs, as `exports` keys.
 *
 * A match preceded by a path segment (`node_modules/…`) is a FILE PATH, not a
 * specifier, and is skipped — see the header.
 */
function documentedSpecifiers() {
  const found = new Map();
  for (const file of docs()) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/(\S*)@junoput01\/junoui\/([A-Za-z0-9._/-]+)/g)) {
      if (m[1].includes('/')) continue; // a path, not a specifier
      const sub = './' + m[2].replace(/[.,)`]+$/, '');
      if (!found.has(sub)) found.set(sub, file);
    }
  }
  return found;
}

const DOCUMENTED = documentedSpecifiers();

test('the docs and the exports map were both really read (vacuity floor)', () => {
  assert.ok(docs().length >= 20, `only ${docs().length} markdown files walked`);
  assert.ok(Object.keys(EXPORTS).length >= 20, 'the exports map is suspiciously small');
  assert.ok(DOCUMENTED.size >= 5, `only ${DOCUMENTED.size} documented specifiers found`);
});

test('every exports target exists on disk', () => {
  // The 0.4.0 direction: an export pointing at a file `files` does not ship
  // resolves in the repo and 404s in the tarball. This catches the missing
  // file; pack.test.mjs catches the unshipped one.
  const missing = [];
  for (const [sub, target] of Object.entries(EXPORTS)) {
    const paths = typeof target === 'string' ? [target] : Object.values(target);
    for (const p of paths)
      if (typeof p === 'string' && !existsSync(p)) missing.push(`${sub} -> ${p}`);
  }
  assert.deepEqual(missing, [], 'an exports entry points at a file that does not exist');
});

test('every exports target is inside a directory the tarball ships', () => {
  // Being on disk is not enough — scripts/ resolves locally and is absent from
  // the package. This is the 0.4.0 defect stated as a rule rather than as a
  // memory.
  const shipped = pkg.files;
  const outside = [];
  for (const [sub, target] of Object.entries(EXPORTS)) {
    const paths = typeof target === 'string' ? [target] : Object.values(target);
    for (const p of paths) {
      if (typeof p !== 'string') continue;
      const rel = p.replace(/^\.\//, '');
      if (rel === 'package.json') continue;
      if (!shipped.some((f) => rel === f || rel.startsWith(f.replace(/\/$/, '') + '/')))
        outside.push(`${sub} -> ${p}`);
    }
  }
  assert.deepEqual(outside, [], 'an exports entry points outside package.json "files"');
});

test('every specifier the docs advertise is in the exports map', () => {
  const unreachable = [];
  for (const [sub, file] of DOCUMENTED) {
    if (!(sub in EXPORTS)) unreachable.push(`${sub}  (advertised in ${file})`);
  }
  assert.deepEqual(
    unreachable,
    [],
    'the docs name a package subpath with no exports entry — with an exports map ' +
      'present, that import throws ERR_PACKAGE_PATH_NOT_EXPORTED even though the ' +
      'file ships',
  );
});
