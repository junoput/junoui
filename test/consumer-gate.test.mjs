// The consumer gate's currency check (20260826-039).
//
// THE DEFECT. The gate's claim is that a candidate "compiles into an app that
// consumes it". It checks out a LANE by default, and a lane drifts: it reported
// GATE GREEN twice against a nexora ios/develop that was 260 commits behind its
// own develop, on which the guard that would have failed did not yet exist. The
// gate proved something true and much weaker than the sentence RELEASING.md
// uses to justify it.
//
// WHY THIS FILE RATHER THAN MUTATING THE SCRIPT. The first attempt to
// mutation-test the check ran the whole gate with `--ref <sha>`. A SHA is not a
// branch, so `clone --branch` failed, the check never ran, and every mutation
// "survived" against an empty result — a harness that proves nothing, which is
// the same failure as the gate it was testing. The decision is a pure function
// now and is exercised directly.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { baselineVerdict } from '../scripts/gate-currency.mjs';

const ref = 'ios/develop';
const baseline = 'develop';

test('a lane carrying its baseline passes', () => {
  const v = baselineVerdict({ ancestorCode: 0, ref, baseline });
  assert.equal(v.ok, true);
  assert.match(v.detail, /carries all of develop/);
});

test('a lane behind its baseline fails, and says how far', () => {
  // The 260-commit case, which read as green.
  const v = baselineVerdict({ ancestorCode: 1, behind: '260', ref, baseline });
  assert.equal(v.ok, false);
  assert.match(v.detail, /260 commit\(s\) behind develop/);
  assert.match(v.detail, /snapshot, not the consumer/);
});

test('one commit behind is still behind', () => {
  // No tolerance band. A threshold would need a number nobody can justify, and
  // the 260-commit failure was one missing GUARD, not 260 commits of drift.
  assert.equal(baselineVerdict({ ancestorCode: 1, behind: '1', ref, baseline }).ok, false);
});

test('an unanswerable comparison FAILS rather than passing', () => {
  // The important one. `merge-base --is-ancestor` returns something other than
  // 0 or 1 when the shallow history cannot support the question. Treating that
  // as "fine" would reintroduce the defect in a new place: a gate that cannot
  // tell whether its consumer is current, reporting green.
  for (const code of [128, 129, -1, undefined]) {
    const v = baselineVerdict({ ancestorCode: code, ref, baseline });
    assert.equal(v.ok, false, `exit ${code} was treated as an answer`);
    assert.match(v.detail, /a gate that cannot tell is not a gate/);
  }
});

test('an unknown distance still fails, and says so honestly', () => {
  const v = baselineVerdict({ ancestorCode: 1, behind: null, ref, baseline });
  assert.equal(v.ok, false);
  assert.match(v.detail, /\? commit\(s\) behind/);
});

test('the gate wires the check in, and can be told to skip it', () => {
  // The pure function being correct is worth nothing if nothing calls it. This
  // is the assertion that the earlier mutation pass could not make: skipping
  // the whole block was invisible to every other check here.
  const src = readFileSync('scripts/consumer-gate.mjs', 'utf8');
  assert.match(
    src,
    /baselineVerdict\(\{[\s\S]*?ancestorCode: anc\.code/,
    'the check does not call it',
  );
  assert.match(
    src,
    /if \(opts\.baseline && opts\.baseline !== opts\.ref\)/,
    'the check is not guarded on the option',
  );
  assert.match(
    src,
    /record\(`\$\{opts\.ref\} has taken \$\{opts\.baseline\} back`/,
    'the verdict is not recorded',
  );
  // and the escape hatch exists, so a consumer with no baseline is expressible
  // without editing the script
  assert.match(src, /--no-baseline-check/);
});

test('the fetch uses explicit refspecs', () => {
  // The clone is `--branch <ref>`, whose refspec maps that branch only, so
  // `git fetch origin develop` creates no origin/develop to compare against.
  // That is exactly how this check reported "could not compare" on its own
  // first run — it was wired correctly and asking a question git could not see.
  const src = readFileSync('scripts/consumer-gate.mjs', 'utf8');
  assert.match(src, /\+refs\/heads\/\$\{b\}:refs\/remotes\/origin\/\$\{b\}/);
});

test('the default baseline is develop, and the default ref is a lane of it', () => {
  const src = readFileSync('scripts/consumer-gate.mjs', 'utf8');
  assert.match(src, /ref: 'ios\/develop'/);
  assert.match(src, /baseline: 'develop'/);
});
