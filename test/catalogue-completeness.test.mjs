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
  // Empty: every stylesheet has a doc. Keep the mechanism — a new one must
  // be documented or listed here with a reason.
};

const catalogue = readFileSync(CATALOGUE, 'utf8');

const DOCS = readdirSync(DOC_DIR)
  .filter((f) => f.endsWith('.md') && f !== 'README.md')
  .map((f) => f.replace(/\.md$/, ''));

const STYLESHEETS = readdirSync(CSS_DIR)
  .filter((f) => f.endsWith('.css'))
  .map((f) => f.replace(/\.css$/, ''));

/** Catalogue rows as { docName: [classes] }, keyed by the doc the Spec column links. */
function catalogueCells() {
  const out = {};
  for (const line of catalogue.split('\n')) {
    if (!line.startsWith('| ')) continue;
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length < 4) continue;
    const doc = (cells[3].match(/\(\.\/([a-z-]+)\.md\)/) || [])[1];
    if (!doc) continue;
    out[doc] = [...cells[2].matchAll(/`(\.juno-[a-z0-9-]+)`/g)].map((m) => m[1]);
  }
  return out;
}

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

/**
 * Top-level block classes a stylesheet DEFINES, as opposed to references.
 *
 * A component's CSS also names other components' classes — dock.css selects
 * `.juno-icon`, modal.css selects `.juno-btn`, select.css selects
 * `.juno-input`. A plain scan for `.juno-*` reports all of those as this
 * component's surface: it produced 13 candidates where 6 were real.
 *
 * So a class counts only when a rule's SELECTOR STARTS with it. Two exclusions,
 * both found by the check being wrong first:
 *
 *   `.juno-x__part` / `.juno-x--modifier`  not block classes
 *   `.juno-modal.juno-drawer`              a COMPOUND selector defines the
 *                                          pair, not `.juno-modal`. Without
 *                                          excluding a following `.`, drawer
 *                                          reads as defining `.juno-modal`.
 *                                          With it, drawer defines no
 *                                          standalone block class at all —
 *                                          correct, since `.juno-drawer` only
 *                                          ever appears compounded, being a
 *                                          modal variant.
 */
function blockClasses(css) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return new Set(
    [...stripped.matchAll(/(?:^|[,}])\s*(\.juno-[a-z0-9-]+)(?![a-z0-9_.-])[^,{}]*\{/gm)]
      .map((m) => m[1])
      .filter((c) => !c.includes('__') && !c.includes('--')),
  );
}

test('every block class a component defines is listed in its catalogue cell', () => {
  // The showcase guard requires every class a cell LISTS, so an unlisted class
  // is one nothing can require. Six were unlisted when this was written
  // (20260909-081) — all already demonstrated, none of them held by anything.
  const cells = catalogueCells();
  const unlisted = [];
  let found = 0;
  for (const n of STYLESHEETS) {
    const listed = cells[DOC_ALIAS[n] ?? n];
    if (!listed) continue;
    const defined = blockClasses(readFileSync(`${CSS_DIR}/${n}.css`, 'utf8'));
    found += defined.size;
    for (const c of defined) if (!listed.includes(c)) unlisted.push(`${n} -> ${c}`);
  }
  // Vacuity floor: this whole check rests on a regex that has already been
  // wrong twice, and a regex that matches nothing passes silently.
  assert.ok(found >= 55, `only ${found} block classes found — the selector scan is broken`);
  assert.deepEqual(
    unlisted,
    [],
    'a component defines a block class its catalogue Class cell does not list, ' +
      'so nothing can require it to be documented or demonstrated',
  );
});
