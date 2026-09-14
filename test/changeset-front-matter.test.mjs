// A CHANGESET NAMING A PACKAGE THAT IS NOT IN THE WORKSPACE TAKES THE RELEASE
// JOB DOWN, AND NOTHING ELSE IN THIS REPO CAN SEE IT (20260914-145).
//
// `.changeset/pagination-dead-fallback.md` landed with `'junoui': patch`. The
// package is `@junoput01/junoui`. CI:
//
//     run 34882676431 on 22cec3a:  build pass, visual pass, release FAILURE
//     error Found changeset pagination-dead-fallback for package junoui
//           which is not in the workspace
//
// WHY IT IS WORSE THAN A RED JOB. The release action's first act is to check out
// `changeset-release/main`, reset it to the new tip and run `changeset version`.
// That exits 1, so the Version PR is never written and its tip STAYS WHERE IT
// WAS. The release ticket's currency check is "has the tip moved" — and a tip
// frozen by a crash reads exactly like a tip that is simply current. The most
// visible symptom of the pipeline being broken is nothing changing.
//
// WHY NO EXISTING CHECK REACHES IT. `npm run lint`, `npm test` and the 10-stage
// `npm run gate:consumer` all passed with the wrong name. The name is resolved
// against the workspace only by `changeset version`, which runs in CI; and
// `pack.test.mjs` asserts `.changeset/` never ships, so gating the TARBALL
// cannot see a changeset by construction. This belongs in `npm test`, where it
// fails on the PR that introduces the file, rather than in the gate, which runs
// once before a release and would catch it a day late.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PKG = JSON.parse(readFileSync('package.json', 'utf8')).name;
const BUMPS = new Set(['patch', 'minor', 'major']);

/** Every changeset file — `README.md` is changesets' own explainer, not one. */
const files = () =>
  readdirSync('.changeset')
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((f) => join('.changeset', f));

/**
 * The `'<package>': <bump>` lines of one changeset's front matter.
 *
 * Front matter is the block between the first two `---` lines.
 *
 * SCOPING TO IT IS DEFENSIVE AND IS NOT LOAD-BEARING TODAY — measured, not
 * assumed: mutating this to parse the whole file leaves the suite GREEN,
 * because no current changeset body contains a line shaped like
 * `'something': word`. It stays because a body easily could — a changeset
 * describing this very defect would quote `'junoui': patch` and be read as a
 * second declaration — and because `declared-token-fallback.test.mjs` hit
 * exactly that: it flagged the comment that explained it.
 *
 * Stated rather than claimed as a catch, because a mutation that survives is
 * the honest result and hiding it would make the next reader trust the scoping
 * for a reason that is not yet true.
 */
function declarations(file) {
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(m, `${file} has no front matter block`);
  return [...m[1].matchAll(/^\s*'([^']+)'\s*:\s*(\S+)\s*$/gm)].map((d) => ({
    pkg: d[1],
    bump: d[2],
    file,
  }));
}

test('the changeset directory was really read, and the predicate discriminates', () => {
  // Floors first: an empty selector or a front-matter regex that matches nothing
  // reports a clean sweep, which is this project's most-repeated failure shape.
  const all = files();
  assert.ok(all.length >= 20, `only ${all.length} changesets found`);
  const decls = all.flatMap(declarations);
  assert.ok(decls.length >= 20, `only ${decls.length} package declarations parsed`);

  // And the control: the predicate must REJECT the name that caused this, or
  // "every changeset names the package" is satisfied by a check that accepts
  // anything. `junoui` is the unscoped form and is what a reader copies out of
  // the docs' prose.
  assert.notEqual(PKG, 'junoui', 'package.json now IS `junoui` — this guard is moot');
  assert.ok(PKG.endsWith('/junoui'), `unexpected package name ${PKG}`);
});

test('every changeset names the package exactly as package.json spells it', () => {
  const wrong = files()
    .flatMap(declarations)
    .filter((d) => d.pkg !== PKG)
    .map((d) => `${d.file}: '${d.pkg}' — package.json says '${PKG}'`);
  assert.deepEqual(
    wrong,
    [],
    'a changeset names a package that is not in the workspace. `changeset ' +
      'version` exits 1 on this, which fails the release job AND freezes the ' +
      'Version PR at its previous tip — where it looks current rather than stuck.',
  );
});

test('every changeset declares a bump changesets understands', () => {
  const wrong = files()
    .flatMap(declarations)
    .filter((d) => !BUMPS.has(d.bump))
    .map((d) => `${d.file}: '${d.bump}'`);
  assert.deepEqual(wrong, [], `a changeset declares a bump that is not one of ${[...BUMPS]}`);
});

test('no changeset is left with an empty body', () => {
  // Not a release blocker — a reader one. An empty changeset still versions the
  // package and then contributes a blank bullet to CHANGELOG.md, which ships:
  // `CHANGELOG.md` is in package.json's `files`.
  const empty = files().filter((f) => {
    const text = readFileSync(f, 'utf8');
    return text.slice(text.indexOf('---', 3) + 3).trim().length === 0;
  });
  assert.deepEqual(empty, [], 'a changeset has front matter and no description');
});
