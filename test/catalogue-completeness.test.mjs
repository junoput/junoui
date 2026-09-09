// docs/components/README.md — the component catalogue — checked for
// completeness, in both directions.
//
// CLAUDE.md's "Adding things → Component" step requires a component doc AND a
// catalogue row. Nothing checked either. Seven documented components had no row
// (tree, splitter, range, scrubber, swatch, gizmo, canvas-ink) and one
// stylesheet has no doc at all.
//
// Those seven overlap almost exactly with the components that were also missing
// from docs/accessibility.md's ARIA contract table (20260909-050). That is the
// point: they are not seven independent oversights, they are one cohort of
// components that landed before the checklist named these steps — which is what
// PR 69 fixed going forward. This file is what stops the next one.
//
// TWO DIRECTIONS, because they fail differently:
//
//   doc -> row    a component is documented but invisible in the catalogue.
//                 Checked mechanically by filename, which is safe here: the
//                 Spec column links the file, so there is no naming
//                 convention to guess.
//
//   css -> doc    a stylesheet exists with nothing describing it. NOT safe to
//                 check by filename — `dot.css` declares `.juno-status` and is
//                 documented as `status.md`. That is the same class-prefix-is-
//                 not-the-filename trap that produced 28 false mismatches in
//                 test/census-matches-css.test.mjs's history, so the mapping is
//                 DECLARED and the map is what a reviewer reads.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const CATALOGUE = 'docs/components/README.md';
const DOC_DIR = 'docs/components';
const CSS_DIR = 'src/css/components';

/**
 * Stylesheets whose doc is not `<name>.md`. Filename and documented name differ
 * whenever the class prefix does — keep the reason next to the entry.
 */
const DOC_ALIAS = {
  // declares `.juno-status` / `.juno-status__dot`, not `.juno-dot`
  dot: 'status',
};

/**
 * Stylesheets with no component doc of their own, and why. Should be empty;
 * an entry here is a declared gap rather than an invisible one.
 */
const NO_DOC = {
  'dock-responsive':
    'the reciprocal of .juno-rail--responsive — a pairing variant of dock, ' +
    'documented nowhere, not even inside dock.md (20260909-055)',
};

const catalogue = readFileSync(CATALOGUE, 'utf8');

const DOCS = readdirSync(DOC_DIR)
  .filter((f) => f.endsWith('.md') && f !== 'README.md')
  .map((f) => f.replace(/\.md$/, ''));

const STYLESHEETS = readdirSync(CSS_DIR)
  .filter((f) => f.endsWith('.css'))
  .map((f) => f.replace(/\.css$/, ''));

test('the catalogue, the docs and the stylesheets were all really read (vacuity floor)', () => {
  assert.ok(catalogue.length > 1000, 'the catalogue is suspiciously short');
  assert.ok(DOCS.length >= 45, `only ${DOCS.length} component docs found`);
  assert.ok(STYLESHEETS.length >= 45, `only ${STYLESHEETS.length} stylesheets found`);
  const rows = catalogue.split('\n').filter((l) => l.startsWith('| ')).length;
  assert.ok(rows >= 45, `only ${rows} catalogue rows parsed`);
});

test('every component doc has a row in the catalogue', () => {
  const missing = DOCS.filter((n) => !catalogue.includes(`(./${n}.md)`));
  assert.deepEqual(
    missing,
    [],
    'a component is documented but absent from docs/components/README.md — ' +
      'add a row, per CLAUDE.md "Adding things → Component"',
  );
});

test('every catalogue row links to a doc that exists', () => {
  // The other direction: a renamed or deleted doc leaves a dead link, and a
  // dead link in the catalogue is how a component becomes undiscoverable
  // without anything going red.
  const linked = [...catalogue.matchAll(/\(\.\/([a-z-]+)\.md\)/g)].map((m) => m[1]);
  assert.ok(linked.length >= 45, `only ${linked.length} doc links found in the catalogue`);
  const dead = [...new Set(linked)].filter((n) => !existsSync(`${DOC_DIR}/${n}.md`));
  assert.deepEqual(dead, [], 'the catalogue links a component doc that does not exist');
});

test('every stylesheet has a doc, or is declared as having none', () => {
  const undocumented = STYLESHEETS.filter((n) => {
    if (n in NO_DOC) return false;
    return !existsSync(`${DOC_DIR}/${DOC_ALIAS[n] ?? n}.md`);
  });
  assert.deepEqual(
    undocumented,
    [],
    'a stylesheet has no component doc — write one, or add it to NO_DOC with the reason',
  );
});

test('the alias and gap maps do not name stylesheets that no longer exist', () => {
  const stale = [...Object.keys(DOC_ALIAS), ...Object.keys(NO_DOC)].filter(
    (n) => !STYLESHEETS.includes(n),
  );
  assert.deepEqual(stale, [], 'the map names a stylesheet that is gone');
});

test('every alias points at a doc that exists', () => {
  const broken = Object.entries(DOC_ALIAS).filter(([, doc]) => !existsSync(`${DOC_DIR}/${doc}.md`));
  assert.deepEqual(broken, [], 'DOC_ALIAS points at a doc that does not exist');
});
