// Every component appears somewhere in the showcase.
//
// CLAUDE.md's "Adding things → Component" requires a showcase entry alongside
// the doc and the catalogue row. Nothing checked it, and two components have
// none — the same two that were also missing from the ARIA contract table
// (20260909-050) and the catalogue (20260909-055). Third surface, same cohort.
//
// WHERE THE PROBE CLASS COMES FROM, and why it is not derived. A component's
// base class cannot be computed from its stylesheet:
//
//   by filename          `dot.css` declares `.juno-status`, not `.juno-dot`
//   by first line-start  `dock-responsive.css` has none — every selector is
//                        indented inside an @media, so the extraction returns
//                        EMPTY and `grep -q ""` then matches every file. That
//                        is not a component that passed, it is a check that
//                        could not fail. It silently passed my first sweep.
//   by frequency         picks `.juno-badge--soft` over `.juno-badge`, and
//                        `.juno-btn--sm` over `.juno-btn`. Frequency is not
//                        primacy.
//
// So the class is READ FROM docs/components/README.md's Class column — a
// curated mapping that already exists, is reviewed, and is held complete by
// test/catalogue-completeness.test.mjs. One declaration, three surfaces using
// it, rather than a fourth copy that agrees today.
//
// A cell may name more than one class (`swatch` is `.juno-swatch` /
// `.juno-palette`); EVERY one of them must appear, because each is a
// separate piece of public surface a consumer can reach for.
//
// AND THE PROBE DROPS THE LEADING DOT. The catalogue writes the CSS SELECTOR
// (`.juno-badge`); markup carries the CLASS (`class="juno-badge"`). Searching
// HTML for the selector form finds nothing — the first run of this test
// reported 31 of 52 components missing, including `.juno-badge` and
// `.juno-card`, which are plainly all over the showcase. Every error ran the
// same direction, which is the lossy-extractor signature rather than 31 real
// absences.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const CATALOGUE = 'docs/components/README.md';
const SHOWCASE_DIR = 'showcase';

/**
 * Components deliberately absent from the showcase, with the reason. Should
 * shrink; an entry here is a declared gap rather than an invisible one.
 */
const NOT_SHOWN = {};

/** Every showcase page, including showcase/device/. */
function showcaseHtml() {
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) out.push(p);
    }
  };
  walk(SHOWCASE_DIR);
  return out;
}

const PAGES = showcaseHtml();
const MARKUP = PAGES.map((p) => readFileSync(p, 'utf8')).join('\n');

/** [component label, [classes]] from the catalogue's Class column. */
function catalogueClasses() {
  const md = readFileSync(CATALOGUE, 'utf8');
  const out = [];
  for (const line of md.split('\n')) {
    if (!line.startsWith('| ')) continue;
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length < 4) continue;
    const [, label, classCell] = cells;
    if (!label || label === 'Component' || /^-+$/.test(label)) continue;
    const classes = [...classCell.matchAll(/`(\.juno-[a-z0-9-]+)`/g)].map((m) => m[1]);
    if (classes.length) out.push([label, classes]);
  }
  return out;
}

const ROWS = catalogueClasses();

test('the catalogue and the showcase were both really read (vacuity floor)', () => {
  // Without this, a changed table shape or a moved showcase directory makes
  // the assertion below iterate an empty list and pass — which is exactly how
  // the first version of this sweep reported dock-responsive as covered.
  assert.ok(PAGES.length >= 20, `only ${PAGES.length} showcase pages found`);
  assert.ok(MARKUP.length > 50_000, 'the concatenated showcase markup is suspiciously small');
  assert.ok(ROWS.length >= 45, `only ${ROWS.length} catalogue rows yielded a class`);
});

test('every probe class is a real class, not an empty match', () => {
  // The failure that made the first sweep vacuous was an EMPTY probe string.
  // Assert the shape before trusting any result computed from it.
  const bad = ROWS.filter(([, classes]) => classes.some((c) => !/^\.juno-[a-z0-9-]{2,}$/.test(c)));
  assert.deepEqual(
    bad.map(([l]) => l),
    [],
    'a catalogue Class cell yielded something that is not a juno class',
  );
});

test('every component appears in the showcase, or is declared as absent', () => {
  const missing = [];
  for (const [label, classes] of ROWS) {
    // EVERY listed class, not any. A cell naming two classes describes two
    // pieces of public surface, and passing on the first one leaves the rest
    // invisible to this guard: `.juno-canvas-scrim` is declared in
    // canvas-ink.css, documented in that component's class table, and was
    // shown nowhere — while this test passed, because `.juno-canvas-ink` was
    // present (20260909-076).
    if (classes.every((c) => MARKUP.includes(c.slice(1)))) continue;
    if (classes.some((c) => c in NOT_SHOWN)) continue;
    missing.push(`${label} (${classes.join(' / ')})`);
  }
  assert.deepEqual(
    missing,
    [],
    'a component has no showcase entry — add one, per CLAUDE.md "Adding things → Component", ' +
      'or list its class in NOT_SHOWN with the reason',
  );
});

test('a declared absence is still actually absent', () => {
  // The half nobody writes: when someone finally adds the entry, this fails
  // and makes them delete the excuse, instead of leaving a stale claim that
  // the component is missing.
  const present = Object.keys(NOT_SHOWN).filter((c) => MARKUP.includes(c.slice(1)));
  assert.deepEqual(
    present,
    [],
    'NOT_SHOWN names a class that IS in the showcase now — delete the entry',
  );
});

test('every declared absence carries a reason', () => {
  const empty = Object.entries(NOT_SHOWN)
    .filter(([, why]) => !why || why.trim().length < 10)
    .map(([c]) => c);
  assert.deepEqual(empty, [], 'a declared absence has no reason');
});
