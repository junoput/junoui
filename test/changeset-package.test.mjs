// A changeset that names a package not in the workspace takes the whole
// release job down, silently — 20260914-145. `.changeset/pagination-dead-
// fallback.md` shipped `'junoui': patch` instead of `'@junoput01/junoui':
// patch`, twice in one day, both from the same author. `changeset version`
// is the only thing that resolves a changeset's package name against the
// workspace, and it runs in CI and nowhere else: `npm run lint`, `npm test`
// (427 assertions before this file) and `npm run gate:consumer` (a real
// consumer build against the packed tarball) all pass with the wrong name,
// because a changeset is not part of the tarball — `pack.test.mjs` asserts
// `.changeset/` never ships, so no amount of gating the ARTEFACT sees this.
//
// The consequence is worse than a red job: `changeset version`'s first act
// is to reset `changeset-release/main` to the new tip and regenerate it; a
// bad changeset makes that exit 1 before the reset, so the Version PR's tip
// FREEZES. A frozen tip and a current tip are indistinguishable from the
// outside — 20260914-075's currency check reads the same either way — so
// this doesn't just fail loudly, it fails in a shape that reads as "nothing
// happened yet."
//
// So this belongs in `npm test`, not `scripts/consumer-gate.mjs`. The gate
// packs and builds a consumer once before a release; this has to fail on the
// PR that introduces the changeset, or it catches the mistake a day late and
// only when someone remembers to run the gate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const PKG_NAME = pkg.name;
const VALID_BUMPS = new Set(['patch', 'minor', 'major']);

/**
 * The package/bump lines inside a changeset's YAML frontmatter — the same
 * `'<name>': <bump>` lines `changeset version` reads. Returns [] for a file
 * with no frontmatter or no recognisable lines in it, rather than throwing,
 * so a totally malformed file is a reportable failure and not a crash.
 */
function packageLines(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return [];
  const lines = [];
  for (const line of m[1].split('\n')) {
    const lm = line.match(/^'([^']+)':\s*(\S+)\s*$/);
    if (lm) lines.push({ name: lm[1], bump: lm[2] });
  }
  return lines;
}

function changesetFiles() {
  return readdirSync('.changeset')
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .sort();
}

test('the extraction was really read (vacuity floor)', () => {
  const files = changesetFiles();
  assert.ok(files.length >= 20, `only ${files.length} changeset files found`);
});

test('the frontmatter parser rejects a wrong package name (control)', () => {
  // Proves the regex can fail, not just pass — the exact shape that let
  // 'junoui': patch through twice: a front-matter parser matching nothing
  // reports a clean sweep just as readily as one matching everything.
  const wrong = packageLines("---\n'junoui': patch\n---\n\nbody\n");
  assert.deepEqual(wrong, [{ name: 'junoui', bump: 'patch' }]);
  assert.notEqual(wrong[0].name, PKG_NAME, 'control fixture must name the WRONG package');

  const empty = packageLines('no frontmatter here at all');
  assert.deepEqual(empty, [], 'a file with no frontmatter must parse to zero lines, not throw');
});

test("every changeset names this workspace's package, with a valid bump", () => {
  const wrongName = [];
  const wrongBump = [];
  const empty = [];

  for (const file of changesetFiles()) {
    const text = readFileSync(join('.changeset', file), 'utf8');
    const lines = packageLines(text);
    if (lines.length === 0) {
      empty.push(file);
      continue;
    }
    for (const { name, bump } of lines) {
      if (name !== PKG_NAME) wrongName.push(`${file}: '${name}' (expected '${PKG_NAME}')`);
      if (!VALID_BUMPS.has(bump)) wrongBump.push(`${file}: bump '${bump}'`);
    }
  }

  assert.deepEqual(
    empty,
    [],
    'a changeset with no parseable package/bump line — changeset version would ' +
      'silently skip it rather than apply it',
  );
  assert.deepEqual(
    wrongName,
    [],
    `a changeset names a package not in this workspace (package.json name is ` +
      `'${PKG_NAME}') — this is invisible to lint, test, and gate:consumer, and ` +
      "only fails inside CI's changeset version step, freezing the Version PR's " +
      'tip without a visible error (20260914-145)',
  );
  assert.deepEqual(wrongBump, [], 'a changeset declares a bump other than patch/minor/major');
});
