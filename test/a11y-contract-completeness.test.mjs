// docs/accessibility.md's "ARIA contract (per component)" table, checked for
// COMPLETENESS against src/css/components.
//
// CLAUDE.md points component authors at that table as the per-component ARIA
// contract, and docs/accessibility.md says it "states exactly what junoui
// guarantees ... and what you must wire up". Nothing checked that every
// component is in it. Fourteen are not.
//
// WHY THIS IS NOT A REGEX. The table's first column is prose, deliberately —
// `dot.css` is covered by "Badge / status dot", `drawer.css` by
// "Modal / drawer / sheet", `load-state.css` by three separate rows. Any check
// derived from filenames is lossy in exactly the direction that produces
// confident false positives: a filename sweep reported 16 absent components, of
// which `toggle-button`, `load-state` and `dock-responsive` were all present
// under prose names. So the mapping below is DECLARED, and the map is the thing
// a reviewer reads.
//
// AND A FILENAME SWEEP ALSO PRODUCES FALSE PRESENCES, which is worse because a
// search that succeeds ends the enquiry. `tree` was reported as covered. Its
// only occurrence in the document is inside the Rail / dock row —
//
//     the hidden one leaves the tree via `display:none`
//
// — which is the ACCESSIBILITY TREE, an unrelated sense of the word. `tree` is
// a nine-part interactive component with a keyboard visual-regression spec and
// 21 aria mentions in its own doc, and it has no row at all.
//
// WHAT THIS TEST DOES NOT DO: it does not check that a row is CORRECT, only
// that every component is accounted for. Judging an ARIA contract needs a
// person; noticing that a new component silently has none does not, and that
// is the failure this exists to stop.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const DOC = 'docs/accessibility.md';
const COMPONENT_DIR = 'src/css/components';

/** Component stylesheet -> the exact first-column label of its table row. */
const COVERED = {
  accordion: 'Accordion',
  alert: 'Alert',
  avatar: 'Avatar',
  badge: 'Badge / status dot',
  breadcrumb: 'Breadcrumb',
  button: 'Button',
  card: 'Card',
  checkbox: 'Checkbox / radio',
  chip: 'Chip / tag',
  divider: 'Divider',
  dock: 'Rail / dock',
  'dock-responsive': 'Rail / dock',
  dot: 'Badge / status dot',
  drawer: 'Modal / drawer / sheet',
  field: 'Input / select / textarea',
  icon: 'Icon',
  input: 'Input / select / textarea',
  list: 'List',
  'load-state': 'Load state — shimmer',
  loader: 'Loader (indeterminate)',
  menu: 'Menu / dropdown',
  modal: 'Modal / drawer / sheet',
  navbar: 'Navbar',
  pagination: 'Pagination',
  pillbar: 'Pillbar',
  popover: 'Popover',
  rail: 'Rail / dock',
  reload: 'Reload',
  select: 'Input / select / textarea',
  skeleton: 'Skeleton',
  slider: 'Slider',
  stepper: 'Stepper',
  splitter: 'Splitter',
  switch: 'Switch',
  table: 'Table / data grid',
  tabs: 'Tabs',
  toast: 'Toast',
  tree: 'Tree',
  'toggle-button': 'Toggle button',
  tooltip: 'Tooltip',
};

/**
 * Components with NO row, each with the reason it has none. This list is the
 * point of the test: it is a declared gap rather than an invisible one, and it
 * should shrink. Adding a component here instead of writing its row is a
 * decision someone can see and object to (20260909-050).
 */
const NO_ROW = {
  // Contract exists in the component's own doc; not yet indexed in the table.
  // The number is aria/role mentions in docs/components/<name>.md.
  range: 'own doc covers it (18)',
  scrubber: 'own doc covers it (18)',
  gizmo: 'own doc covers it (13)',
  swatch: 'own doc covers it (11)',
  'icon-loader': 'own doc covers it (9) — arc carries role=status; may fold into a Loader row',
  segmented: 'own doc covers it (7)',
  gauge: 'own doc covers it (6)',
  thumb: 'own doc covers it (4)',
  'fold-slot': 'own doc covers it (3)',
  spark: 'own doc covers it (2)',
  // No ARIA contract stated anywhere. Plausibly correct — both are
  // non-interactive surfaces — but the table states that explicitly for other
  // components ("No ARIA to add", "no role needed"), so silence is not the
  // same as a stated absence.
  readout: 'no ARIA mentioned in its own doc either; a data tile may need none, but say so',
  'canvas-ink':
    'no ARIA mentioned in its own doc either; a paint surface may need none, but say so',
};

/** First-column labels of the ARIA contract table. */
function tableRows() {
  const doc = readFileSync(DOC, 'utf8');
  const start = doc.indexOf('## The ARIA contract (per component)');
  assert.notEqual(start, -1, `${DOC} has no "ARIA contract (per component)" section`);
  const rest = doc.slice(start);
  const end = rest.indexOf('These are interaction concerns');
  assert.notEqual(end, -1, 'the ARIA contract table has no closing paragraph to bound it');
  return rest
    .slice(0, end)
    .split('\n')
    .filter((l) => l.startsWith('| '))
    .map((l) => l.slice(1, l.indexOf('|', 1)).trim())
    .filter((c) => c && c !== 'Component' && !/^-+$/.test(c));
}

const ROWS = tableRows();
const COMPONENTS = readdirSync(COMPONENT_DIR)
  .filter((f) => f.endsWith('.css'))
  .map((f) => f.replace(/\.css$/, ''));

test('the table and the component set were both really read (vacuity floor)', () => {
  // Without this, a changed heading or a moved directory makes every assertion
  // below iterate an empty list and pass.
  assert.ok(ROWS.length >= 30, `only ${ROWS.length} rows parsed from the ARIA table`);
  assert.ok(COMPONENTS.length >= 45, `only ${COMPONENTS.length} component stylesheets found`);
});

test('every declared row label actually exists in the table', () => {
  // Catches a renamed row, which would otherwise leave a component silently
  // mapped to nothing while this file still claims it is covered.
  const missing = [...new Set(Object.values(COVERED))].filter((label) => !ROWS.includes(label));
  assert.deepEqual(missing, [], 'COVERED names a row the table does not have');
});

test('every component is either mapped to a row or declared as a gap, never both', () => {
  const unaccounted = COMPONENTS.filter((c) => !(c in COVERED) && !(c in NO_ROW));
  assert.deepEqual(
    unaccounted,
    [],
    'a component is in neither COVERED nor NO_ROW — give it a row in docs/accessibility.md, ' +
      'or add it to NO_ROW with the reason',
  );

  const both = COMPONENTS.filter((c) => c in COVERED && c in NO_ROW);
  assert.deepEqual(both, [], 'a component is both mapped and declared missing');
});

test('the map does not name components that no longer exist', () => {
  const stale = [...Object.keys(COVERED), ...Object.keys(NO_ROW)].filter(
    (c) => !COMPONENTS.includes(c),
  );
  assert.deepEqual(stale, [], 'the map names a component with no stylesheet');
});

test('every declared gap carries a reason', () => {
  const empty = Object.entries(NO_ROW)
    .filter(([, why]) => !why || why.trim().length < 10)
    .map(([c]) => c);
  assert.deepEqual(
    empty,
    [],
    'a gap is declared with no reason — an unexplained gap gets closed by the next person with the same wrong assumption',
  );
});
