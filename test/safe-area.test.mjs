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

test('the three buckets are documented with their arithmetic', () => {
  // The rule is not a style choice and the doc has to say which is which, or
  // the next consumer picks by taste and is wrong at one end of the range.
  const doc = readFileSync('docs/safe-area.md', 'utf8');
  for (const bucket of ['edge padding', 'clearance', 'floating chrome']) {
    assert.ok(doc.includes(bucket), `the ${bucket} bucket is undocumented`);
  }
  assert.match(doc, /max\(base, inset\)/, 'the edge-padding arithmetic is not stated');
  assert.match(doc, /base \+ inset/, 'the additive arithmetic is not stated');
});
