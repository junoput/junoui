// Component structural contract (20260908-019, W5). 20260906-056 is why this
// exists: a native target silently disagreed with the others on COLOUR and
// nothing noticed until a cross-project diff surfaced it. This is the
// analogous check for STRUCTURE — slot order, states, tap floor — asserted
// as relationships against the CSS and against an independently-derived
// census, never as a value this file restates.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { checkInventoryElements } from '../scripts/check-inventory-elements.mjs';

const GENERATOR = join(process.cwd(), 'scripts/build-component-contract.mjs');

const contract = JSON.parse(readFileSync('dist/json/component-contract.json', 'utf8'));
const generatorSrc = readFileSync('scripts/build-component-contract.mjs', 'utf8');
const rust = readFileSync('dist/rust/juno_component_contract.rs', 'utf8');

test('the generator reads the component directory; it does not hand-list components', () => {
  // A hand-typed array of today's covered names would agree with this
  // output and rot the moment a component's CSS changed underneath it —
  // exactly the second-copy shape 20260906-056 was.
  assert.match(
    generatorSrc,
    /readdirSync\(DIR\)/,
    'no longer enumerates src/css/components/ at build time',
  );
  // ...and does not ALSO carry a long literal array of bare component-name
  // strings beside it — the hand-list this generator exists to prevent
  // would look exactly like this.
  const bareNameArray = /\[\s*(['"][a-z-]+['"]\s*,\s*){10,}/;
  assert.ok(
    !bareNameArray.test(generatorSrc),
    'generator source contains a 10+ hand-typed name list',
  );
});

test('every covered component genuinely has a matching CSS file, and none is double-counted', () => {
  const files = new Set(readdirSync('src/css/components').map((f) => f.replace(/\.css$/, '')));
  for (const name of Object.keys(contract.covered)) {
    assert.ok(files.has(name), `covered component "${name}" has no matching CSS file`);
  }
  assert.equal(contract.totalComponentFiles, files.size);

  const coveredNames = Object.keys(contract.covered);
  const excludedNames = Object.keys(contract.excluded);
  assert.equal(
    coveredNames.length + excludedNames.length,
    contract.totalComponentFiles,
    'covered + excluded does not account for every component file',
  );
  assert.deepEqual(
    coveredNames.filter((n) => excludedNames.includes(n)),
    [],
    'a component is listed as both covered and excluded',
  );
});

test('the zero-parts exclusion agrees with the independently-derived census n/a set — not just its count', () => {
  // Two different scripts, two different methodologies (this one parses
  // src/css/components/*.css structurally; the census checker reads its
  // own hand-verified per-component rows), asked the same question — which
  // components have zero BEM parts — and "zero parts" means the same thing
  // in both. A count matching by coincidence is the whole failure mode this
  // programme keeps finding, so this checks the NAMES, not just the number.
  const census = checkInventoryElements();
  assert.equal(
    census.vacuous,
    false,
    'census checker reports vacuous — cannot cross-check against it',
  );

  const mine = Object.entries(contract.excluded)
    .filter(([, e]) => e.reason === 'zero-parts')
    .map(([n]) => n)
    .sort();
  assert.equal(
    mine.length,
    census.tally['n/a'],
    "zero-parts count disagrees with the census's n/a count",
  );

  // The census doesn't expose its own n/a name list programmatically, but it
  // is read straight from docs/inventory-elements.md here — the same
  // artefact a human reads — so a rename on either side that breaks the
  // membership match, not just the count, is caught.
  const doc = readFileSync('docs/inventory-elements.md', 'utf8');
  const blocks = doc.split(/\n### `/).slice(1);
  const censusNA = blocks
    .filter((b) => /\*\*Slot order\*\*: \*\*n\/a\*\*/.test(b))
    .map((b) => b.split('`', 1)[0])
    .sort();
  assert.deepEqual(
    mine,
    censusNA,
    'zero-parts NAMES disagree with the census n/a rows, not just the count',
  );
});

test('every excluded component states why, from a fixed, spelled-out vocabulary', () => {
  const known = new Set([
    'zero-parts',
    'multi-namespace',
    'no-usage-example',
    'usage-incomplete',
    'reorder-mechanism',
    'combinator-disagrees',
    'data-driven-parts',
  ]);
  for (const [name, e] of Object.entries(contract.excluded)) {
    assert.ok(known.has(e.reason), `${name} excluded for an unrecognised reason: ${e.reason}`);
    assert.ok(e.detail && e.detail.length > 0, `${name} excluded with no detail`);
  }
});

test("a covered component's exported order is exactly its own CSS parts — no more, no fewer", () => {
  for (const [name, c] of Object.entries(contract.covered)) {
    const css = readFileSync(`src/css/components/${name}.css`, 'utf8').replace(
      /\/\*[\s\S]*?\*\//g,
      '\n',
    );
    const parts = new Set();
    const re = new RegExp(`\\.juno-${c.root}__([a-zA-Z0-9-]+)`, 'g');
    let m;
    while ((m = re.exec(css))) parts.add(m[1].split('--')[0]);
    assert.deepEqual(
      [...c.order].sort(),
      [...parts].sort(),
      `${name}'s exported order does not match the parts its own CSS declares`,
    );
  }
});

test('switch: exported order agrees with its own sibling-combinator constraint, re-read independently', () => {
  // Not a re-call of the generator's own function — a second, independent
  // reading of the source file, the same shape test/rules.test.mjs uses
  // reading both emitted Rust files rather than trusting one generator run.
  assert.ok(contract.covered.switch, 'switch is no longer covered — check its exclusion reason');
  const css = readFileSync('src/css/components/switch.css', 'utf8');
  assert.match(
    css,
    /\.juno-switch__input:checked \+ \.juno-switch__track/,
    'the constraint this test relies on moved or was removed from switch.css',
  );
  const order = contract.covered.switch.order;
  assert.ok(
    order.indexOf('input') < order.indexOf('track'),
    "exported order puts track before input, contradicting switch.css's own sibling combinator",
  );
});

test('tree: exported order agrees with its own sibling-combinator constraint, re-read independently', () => {
  assert.ok(contract.covered.tree, 'tree is no longer covered — check its exclusion reason');
  const css = readFileSync('src/css/components/tree.css', 'utf8');
  assert.match(
    css,
    /\.juno-tree__count \+ \.juno-tree__trail/,
    'the constraint this test relies on moved or was removed from tree.css',
  );
  const order = contract.covered.tree.order;
  assert.ok(
    order.indexOf('count') < order.indexOf('trail'),
    "exported order puts trail before count, contradicting tree.css's own sibling combinator",
  );
});

test('gizmo, range and slider are excluded for app-supplied positioning, never certified as fixed', () => {
  // The census calls gizmo and range "ambiguous" for the reason this
  // generator finds mechanically: a repeated (gizmo, range) or single
  // (slider) part's visual position comes from a custom property the
  // component's OWN Usage example sets per instance, not from DOM order.
  // slider is not one of the census's 4 named-ambiguous rows — this
  // generator applying the same rule to it that it applies to gizmo/range
  // is a real, stated divergence from the hand census, not a bug: see
  // scripts/build-component-contract.mjs's header for why.
  for (const name of ['gizmo', 'range', 'slider']) {
    assert.ok(!contract.covered[name], `${name} should not be certified as fixed`);
    assert.equal(
      contract.excluded[name].reason,
      'reorder-mechanism',
      `${name} excluded for the wrong reason`,
    );
  }
});

test('the Rust target carries exactly the same covered set as the JSON export', () => {
  const jsonNames = Object.keys(contract.covered).sort();
  const rustNames = [...rust.matchAll(/name: "([a-z-]+)"/g)].map((m) => m[1]).sort();
  assert.deepEqual(
    rustNames,
    jsonNames,
    'dist/rust/juno_component_contract.rs and the JSON export disagree on the covered set',
  );
});

test('package.json exports both targets', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.exports['./component-contract.json'], './dist/json/component-contract.json');
  assert.equal(pkg.exports['./component-contract-rust'], './dist/rust/juno_component_contract.rs');
});

test('the generated header states the excluded set and reasons, not just the covered count', () => {
  assert.match(contract.$comment, /excluded/i);
  assert.ok(
    Object.keys(contract.excluded).length > 0,
    'nothing excluded — the vacuity floor for this file: a census of 52 real component files with nothing excluded has not looked hard enough',
  );
  assert.equal(
    contract.counts.covered + contract.counts.excluded,
    contract.totalComponentFiles,
    'counts.covered + counts.excluded no longer accounts for every file',
  );
  const reasonSum = Object.values(contract.counts.byExclusionReason).reduce((a, b) => a + b, 0);
  assert.equal(
    reasonSum,
    contract.counts.excluded,
    'byExclusionReason does not sum to the excluded count',
  );
});

test('coverage is meaningfully partial, in both directions — the vacuity floor for this whole file', () => {
  // Neither "nothing is ever covered" nor "everything is covered" is a
  // result these assertions could distinguish from a selector matching
  // nothing or a check that never runs. Both extremes get a floor.
  assert.ok(
    contract.counts.covered >= 10,
    `only ${contract.counts.covered} components covered — suspiciously low`,
  );
  assert.ok(
    contract.counts.covered < contract.totalComponentFiles,
    'every single component was certified fixed — this generator is supposed to be conservative',
  );
});

test('the generator REFUSES an empty component directory, at build time — not only in this test', () => {
  // Measured, not hypothetical: moving src/css/components/ aside and running
  // the generator produced `0 of 0 covered ({})`, exit 0 — a hollow but
  // syntactically valid contract. `npm test` runs `npm run build` first and
  // would have caught it via the floor above, but `npm run release` and
  // `npm run prepare` run `npm run build` WITHOUT a `node --test` step in
  // between — the release path is build, not test — so a published tarball
  // could have carried an empty contract with nothing here to stop it. This
  // spawns the real generator as a subprocess against a genuinely empty
  // directory (not a mock, not a re-call of its own function) and asserts
  // it exits non-zero naming the cause, the same shape test/rules.test.mjs
  // uses to drive scripts/test-rust.mjs rather than trusting its own words.
  const scratch = 'test/.scratch-empty-components';
  rmSync(scratch, { recursive: true, force: true });
  mkdirSync(join(scratch, 'src/css/components'), { recursive: true });
  try {
    const result = spawnSync(process.execPath, [GENERATOR], { cwd: scratch, encoding: 'utf8' });
    assert.notEqual(
      result.status,
      0,
      'the generator exited 0 against an empty component directory',
    );
    assert.match(result.stderr, /only 0 \.css files found/, 'the failure does not name the cause');
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

// ── 20260908-050: the 8 usage-incomplete exclusions, decided one at a time —
//    5 fixed (their Usage example now matches their CSS), 2 reclassified to
//    reorder-mechanism (the fix would have been a false certification), 1
//    (table) reclassified to a named, human-decided exception. Named per
//    component rather than asserted as a bare count, because "coverage went
//    up" is not the claim this ticket makes — "coverage is honest" is, and
//    that has to be checked component by component.

test('the 5 genuinely fixable usage-incomplete components are now covered', () => {
  for (const name of ['alert', 'canvas-ink', 'card', 'field', 'thumb']) {
    assert.ok(
      contract.covered[name],
      `${name} should be covered now — its Usage example was completed`,
    );
  }
});

test('pillbar stays excluded — completing its example did not certify a false order', () => {
  // pillbar's own CSS comment says outright that toggle/tray order is free
  // ("the bar reads it via :has(), so DOM order... is free"). Completing
  // the Usage example was a documentation fix, not a coverage fix — this
  // pins that it did NOT flip to covered, and specifically THAT it was the
  // new :has()-sibling detection that caught it, not an accident of some
  // other reason.
  const e = contract.excluded.pillbar;
  assert.ok(e, 'pillbar is not excluded at all — was a false order just certified?');
  assert.equal(e.reason, 'reorder-mechanism');
  assert.match(
    e.detail,
    /:has\(\)/,
    'pillbar is excluded, but not for the :has() reason this test expects',
  );
});

test('scrubber stays excluded — every part is positioned by an app-supplied value, not DOM order', () => {
  const e = contract.excluded.scrubber;
  assert.ok(e, 'scrubber is not excluded at all — was a false order just certified?');
  assert.equal(e.reason, 'reorder-mechanism');
});

test('table is reclassified as data-driven-parts, not padded into usage-incomplete or covered', () => {
  assert.ok(
    !contract.covered.table,
    'table should not be certified fixed — its column parts are app/data-defined',
  );
  const e = contract.excluded.table;
  assert.ok(e, 'table is not excluded at all');
  assert.equal(
    e.reason,
    'data-driven-parts',
    'table is excluded for the wrong reason — check it was not left in usage-incomplete',
  );
});

test('usage-incomplete is now empty — every prior instance was fixed or honestly reclassified', () => {
  assert.equal(
    contract.counts.byExclusionReason['usage-incomplete'] ?? 0,
    0,
    'a usage-incomplete component remains — 20260908-050 should have resolved all 8',
  );
});

test(':has()-sibling detection is wired in, structurally', () => {
  // A structural guard, not a mutation proof — this only checks the code
  // path exists and pillbar's CSS still has the pattern it depends on. The
  // actual proof that removing this detector lets pillbar wrongly become
  // "covered" was done by hand (mutate reorderMechanisms, rebuild, confirm
  // pillbar.covered, restore) — see the ticket 20260908-050 PR description
  // for that run; it is not repeated here as an automated test because
  // doing so would mean shipping a second, parallel copy of
  // reorderMechanisms in the test file to mutate against, which is exactly
  // the kind of second-copy risk this generator exists to avoid elsewhere.
  assert.match(
    generatorSrc,
    /hasSiblingPart\.test\(selector\)/,
    ':has()-sibling detection was removed from reorderMechanisms — pillbar would silently become "covered"',
  );
  assert.match(
    generatorSrc,
    /new RegExp\(`:has/,
    'the :has() detection regex definition itself is gone',
  );
  // And the positive: pillbar's own CSS still has the exact pattern this
  // detector depends on, so the assertion above is not vacuously true.
  const pillbarCss = readFileSync('src/css/components/pillbar.css', 'utf8');
  assert.match(
    pillbarCss,
    /:has\(>\s*\.juno-pillbar__toggle\[aria-expanded='false'\]\)/,
    'pillbar.css no longer has the :has() rule this detector and this test both depend on',
  );
});
