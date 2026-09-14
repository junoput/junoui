// Hard rule 3 of CLAUDE.md, which nothing enforced (20260914-126).
//
//     "Namespace everything `juno`: `--juno-*`, `.juno-*`, `JunoTokens`,
//      `data-juno-*`. Never introduce `aero`."
//
// and, two lines up, the claim it rests on:
//
//     "`aero` survives only inside `design/`, the original imported canvas,
//      which is reference-only."
//
// THAT CLAIM WAS FALSE WHEN THIS TEST WAS WRITTEN. `style-dictionary.config.mjs`
// carried four occurrences — two custom format NAMES, `scss/aero` and `js/aero`,
// and the two references to them. Internal identifiers, never emitted, so
// nothing consumer-facing said `aero`; but a contributor grepping to verify the
// rename found them in a live build file and had to work out whether they
// mattered.
//
// Renamed to `scss/juno`/`js/juno` in the same change, with the generated
// outputs verified byte-identical before and after — the safety argument for
// touching a build config at all.
//
// SCOPE, and why it is not simply "grep the repo":
//
//   design/  is the imported reference canvas. It is SUPPOSED to say aero — it
//            is the original AERO·UI document — and it does not ship.
//   CLAUDE.md itself describes the rename and therefore names the old brand.
//            Excluding it by name rather than by pattern, so a stray `aero`
//            appearing anywhere ELSE in that file still fails.
//   dist/    is generated and gitignored; it is checked anyway, because a
//            format name leaking into output is exactly what this rule is for.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SKIP_DIRS = new Set(['node_modules', '.git', 'design', '.relgate', 'test-results']);
const EXTS = ['.css', '.mjs', '.js', '.ts', '.json', '.md', '.html', '.yml', '.scss'];

/** Every source file the rule applies to. `design/` and node_modules are out. */
function files() {
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.') && e.name !== '.github') continue;
      if (SKIP_DIRS.has(e.name)) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (EXTS.some((x) => e.name.endsWith(x))) out.push(p);
    }
  };
  walk('.');
  return out;
}

const FILES = files();

/** Files that name the old brand deliberately. See the loop below for why each. */
const EXPECTED = new Set(['CLAUDE.md', 'test/no-aero.test.mjs', 'dist/js/identity.js']);

test('the tree was really walked (vacuity floor)', () => {
  // Without this, a skip-list that swallowed everything would make the
  // assertion below iterate nothing and pass — zero hits out of zero files
  // reads exactly like a clean repo.
  assert.ok(FILES.length >= 150, `only ${FILES.length} source files walked`);
  assert.ok(
    FILES.some((f) => f.endsWith('style-dictionary.config.mjs')),
    'the walk missed style-dictionary.config.mjs — the file this rule was broken in',
  );
  assert.ok(existsSync('design'), 'design/ is gone; this test excludes it and should be revisited');
});

test('every declared exception is a file that still exists', () => {
  // The half nobody writes. An exclusion naming a file that has been renamed or
  // deleted silently stops applying to anything and becomes a claim about
  // nothing, while the list still reads as deliberate.
  const stale = [...EXPECTED].filter((f) => !existsSync(f));
  assert.deepEqual(stale, [], 'an exception names a file that is no longer there');
});

test('no `aero` outside design/ — CLAUDE.md hard rule 3', () => {
  const hits = [];
  for (const f of FILES) {
    // Three files name the old brand on purpose. Excluded BY NAME rather than
    // by pattern, so the exclusion cannot silently widen and a stray `aero`
    // anywhere else still fails.
    //
    //   CLAUDE.md                 describes the rename
    //   this file                 quotes the rule it enforces
    //   dist/js/identity.js       STAMPS THE BRANCH NAME into the build, so it
    //                             carries whatever the current branch is called.
    //                             Without this the guard fails for anyone
    //                             working on a branch named after the thing
    //                             being removed — which is how it first failed,
    //                             on `chore/rename-aero-formats`. A detector
    //                             that breaks on the branch doing the work is
    //                             anti-correlated with the work.
    if (EXPECTED.has(f)) continue;
    const text = readFileSync(f, 'utf8');
    for (const m of text.matchAll(/aero/gi)) {
      const line = text.slice(0, m.index).split('\n').length;
      hits.push(`${f}:${line}`);
    }
  }
  assert.deepEqual(
    hits,
    [],
    'CLAUDE.md says `aero` survives only inside design/ and that the name must ' +
      'never be introduced. Rename to the `juno` equivalent — and if the name is ' +
      'internal, like a Style Dictionary format identifier, verify the generated ' +
      'output is byte-identical before and after rather than assuming it.',
  );
});
