// Safe-area buckets owned by the library (conformance kit slice 4,
// 20260826-036 item D).
//
// The claim is not "junoui handles notches". It is that there is exactly ONE
// door — every inset reads through the seam — because that is what lets a
// consumer zero an inset in one place and lets a test substitute a literal for
// a device that is not present. A second door is invisible until someone
// overrides the seam and one rule keeps its own env().
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'src/css';
const bundle = readFileSync('dist/css/juno.css', 'utf8');

const sources = () => {
  const out = [join(SRC, 'base.css'), join(SRC, 'layout.css')];
  for (const f of readdirSync(join(SRC, 'components'))) {
    if (f.endsWith('.css')) out.push(join(SRC, 'components', f));
  }
  return out.filter((p) => {
    try {
      readFileSync(p);
      return true;
    } catch {
      return false;
    }
  });
};

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, ' ');
const EDGES = ['top', 'right', 'bottom', 'left'];

test('the stylesheet is actually read', () => {
  assert.ok(bundle.length > 1000);
  assert.ok(sources().length > 10);
});

test('the seam is the only place env() is called', () => {
  // ONE DOOR. A rule that keeps its own env() ignores a consumer's override and
  // ignores a test's substitution, and both failures are silent — the override
  // appears to work everywhere else.
  const offenders = [];
  for (const path of sources()) {
    const css = stripComments(readFileSync(path, 'utf8'));
    for (const m of css.matchAll(/env\(safe-area-inset-(\w+)[^)]*\)/g)) {
      // the seam's own four declarations are the door itself
      const line = css.slice(Math.max(0, m.index - 80), m.index);
      if (/--juno-safe-\w+:\s*$/.test(line)) continue;
      offenders.push(`${path}: ${m[0]}`);
    }
  }
  assert.deepEqual(offenders, [], 'rules calling env() outside the seam');
});

test('all four edges are on the seam', () => {
  for (const e of EDGES) {
    assert.match(
      bundle,
      new RegExp(`--juno-safe-${e}:\\s*env\\(safe-area-inset-${e}, 0px\\)`),
      `--juno-safe-${e} is missing or not reading its own inset`,
    );
  }
});

test('every fallback carries a unit', () => {
  // Inside calc() a unitless 0 is a <number>, which invalidates the sum and
  // DROPS THE WHOLE DECLARATION. A stack would then sit flush at 0 on every
  // device WITHOUT a safe area — the opposite of the intent, and silent.
  const bare = [...bundle.matchAll(/env\(safe-area-inset-\w+,\s*0\s*\)/g)];
  assert.deepEqual(
    bare.map((m) => m[0]),
    [],
    'a bare 0 fallback will drop its declaration inside calc()',
  );
});

test('the letterbox override zeroes the bottom edge and ONLY the bottom edge', () => {
  // The first version of this test asserted all four, and asserted it with the
  // wrong reason attached ("no notch to clear"). It was a guard pinning a
  // defect: measured on an iPhone 16 Pro / iOS 18.7, the letterboxed window is
  // 812 of 874 points and sits at the TOP of the screen, so
  //   · its top edge is UNDER the Dynamic Island — the top inset is real, and
  //     zeroing it puts content under the Island in the one window this
  //     attribute exists for;
  //   · the home indicator is at screen y 840-874, outside the window, while
  //     iOS still reports inset-bottom as 34 — that one is the phantom.
  // Left and right are 0 in portrait and real in landscape; neither is a
  // phantom. See 20260815-039, which states this explicitly, and the NX EXPAND
  // testbed that measured the geometry.
  const rule = /html\[data-juno-letterboxed\]\s*\{([^}]*)\}/.exec(bundle);
  assert.ok(rule, 'no letterbox override');
  assert.match(rule[1], /--juno-safe-bottom:\s*0px/, 'the bottom inset is not zeroed');
  for (const e of EDGES.filter((x) => x !== 'bottom')) {
    assert.doesNotMatch(
      rule[1],
      new RegExp(`--juno-safe-${e}:\\s*0px`),
      `${e} is zeroed by the letterbox override, and it is not a phantom — ` +
        `zeroing top puts content under the Dynamic Island`,
    );
  }
});

test('each floating primitive publishes its own edge offset', () => {
  // Declared once and consumed by every site that needs it, so a consumer takes
  // the max() form by restating ONE token. Before these, the form was written
  // separately at each site and a consumer that changed one silently disagreed
  // with the other — 16px of dead band at inset 0, 24px at inset 34.
  for (const t of ['dock', 'pillbar', 'toast']) {
    assert.match(bundle, new RegExp(`--juno-${t}-edge-offset:`), `${t} has no published offset`);
  }
});

test('a published offset is composed from the seam, not from env()', () => {
  // Otherwise restating the seam moves some chrome and not the rest.
  for (const t of ['dock', 'pillbar', 'toast']) {
    const decl = new RegExp(`--juno-${t}-edge-offset:\\s*([^;]+);`).exec(bundle);
    assert.ok(decl, `${t} offset missing`);
    assert.match(decl[1], /var\(--juno-safe-\w+\)/, `${t} offset does not read the seam`);
    assert.ok(!/env\(/.test(decl[1]), `${t} offset calls env() directly`);
  }
});

/**
 * The bucket table's rows, read as ROWS rather than as a bag of strings
 * (20260914-096 item 5).
 *
 * The previous version made five independent presence checks — three bucket
 * names and two formulas — and so could not see which formula belonged to which
 * bucket. Its mutation: swap the "Because" text between the edge-padding and
 * clearance rows, keeping both names and both formulas verbatim. All five
 * assertions passed while the document told a consumer the opposite of the rule
 * at both ends.
 *
 * That matters more here than in most places, because this table exists
 * precisely to stop a consumer choosing arithmetic by taste — and a reader who
 * follows a cross-attributed row is wrong at exactly the extreme the bucket was
 * invented for.
 */
function bucketRows() {
  const doc = readFileSync('docs/safe-area.md', 'utf8');
  const rows = new Map();
  for (const line of doc.split('\n')) {
    const m = /^\|\s*\*\*([^*]+)\*\*\s*\|([^|]*)\|([^|]*)\|/.exec(line);
    if (m) rows.set(m[1].trim(), { rule: m[2].trim(), because: m[3].trim() });
  }
  return rows;
}

/** Every bucket, its arithmetic, and a phrase only its OWN reasoning contains. */
const BUCKETS = [
  ['edge padding', /max\(base, inset\)/, /double-pads/],
  ['clearance', /base \+ inset/, /lands short/],
  ['floating chrome', /base \+ inset/, /sits _off_ the edge/],
  ['available-space cap', /100% - 2 \* edge/, /subtracted_ from how much room/],
];

test('the bucket table was really parsed as rows (vacuity floor)', () => {
  // Without this, a table reformatted past the regex yields an empty map and
  // every assertion below iterates nothing — four buckets agreeing perfectly
  // because none was read.
  const rows = bucketRows();
  assert.ok(rows.size >= 4, `only ${rows.size} bucket rows parsed from safe-area.md`);
});

test('every bucket is documented with ITS OWN arithmetic and ITS OWN reason', () => {
  // The pairing, not the presence. Each `because` pattern is a phrase that
  // appears in that row's reasoning and nowhere else, so a cross-attribution
  // fails rather than passing on the shared vocabulary.
  const rows = bucketRows();
  for (const [name, rule, because] of BUCKETS) {
    const row = rows.get(name);
    assert.ok(row, `the ${name} bucket is undocumented`);
    assert.match(row.rule, rule, `the ${name} row does not state its arithmetic`);
    assert.match(
      row.because,
      because,
      `the ${name} row's reasoning is not its own — a formula or an explanation ` +
        `has been attributed to the wrong bucket, which is worse than an absent ` +
        `row because the document still reads as complete`,
    );
  }
});

test('the table has not grown a bucket this test does not know about', () => {
  // The direction that caught this file out. `available-space cap` landed on
  // 2026-09-14 and this test still enumerated three buckets — stale within
  // hours of the change, and silent about it, because a fixed list cannot see
  // an addition. Now an addition fails loudly and cheaply.
  const unknown = [...bucketRows().keys()].filter((k) => !BUCKETS.some(([n]) => n === k));
  assert.deepEqual(
    unknown,
    [],
    'safe-area.md documents a bucket this test does not check. Add it to BUCKETS ' +
      'with the phrase unique to its own reasoning.',
  );
});
