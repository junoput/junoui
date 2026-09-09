// The consumer gate's "is this version already published?" stage (20260909-122).
//
// THE DEFECT. The stage asked `npm view <pkg>@<version> version` and treated
// ANY non-zero exit as "registry unreachable". npm exits NON-ZERO WITH E404
// when the version does not exist — which is this stage's SUCCESS condition.
// Measured on this box:
//
//   npm view @junoput01/junoui@0.11.0 version  ->  E404, exit 1   NOT published
//   npm view @junoput01/junoui@0.10.0 version  ->  0.10.0, exit 0     published
//
// So the stage could return FAIL or SKIP and **could never return PASS for a
// genuine release candidate**, because an unpublished version always 404s. It
// had been vacuous for every release the gate ever ran, and before
// 20260909-116 it printed that vacuum as PASS — the note was the only tell and
// the verdict block stripped it.
//
// The first test below is therefore the one that matters: PASS must be
// REACHABLE. A stage with an unreachable success value is not a check.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { publishedVerdict } from '../scripts/gate-published.mjs';

const LIST = JSON.stringify(['0.9.0', '0.10.0']);

test('PASS is reachable: a version absent from the list passes', () => {
  // The case the old implementation could not express. If this ever starts
  // failing, the stage has gone vacuous again in some new way.
  const v = publishedVerdict({ code: 0, out: LIST, version: '0.11.0' });
  assert.equal(v.ok, true);
  assert.equal(v.skipped, false, 'a successful check must not be recorded as skipped');
  assert.match(v.note, /not on the registry/);
});

test('FAIL: a version already on the registry blocks', () => {
  const v = publishedVerdict({ code: 0, out: LIST, version: '0.10.0' });
  assert.equal(v.ok, false);
  assert.equal(v.skipped, false);
  assert.match(v.note, /already on the registry/);
  assert.match(v.note, /changeset version/, 'the note should say what to do about it');
});

test('SKIP: a non-zero exit is unknown, not a pass and not a failure', () => {
  const v = publishedVerdict({ code: 1, out: '', version: '0.11.0' });
  assert.equal(v.skipped, true);
  assert.match(v.note, /registry unreachable/);
});

test('all three outcomes are distinguishable from one another', () => {
  // The property the old code lacked, stated directly rather than implied by
  // the three cases above passing separately.
  const pass = publishedVerdict({ code: 0, out: LIST, version: '0.11.0' });
  const fail = publishedVerdict({ code: 0, out: LIST, version: '0.10.0' });
  const skip = publishedVerdict({ code: 1, out: '', version: '0.11.0' });
  const shape = (v) => `${v.ok}/${v.skipped}`;
  assert.equal(new Set([shape(pass), shape(fail), shape(skip)]).size, 3);
});

test('a single-version package yields a bare string, not an array', () => {
  // npm returns a string rather than a list when only one version exists.
  // Treating that as unparseable would skip the check for a package's second
  // release, which is exactly when it matters most.
  assert.equal(publishedVerdict({ code: 0, out: '"0.1.0"', version: '0.1.0' }).ok, false);
  assert.equal(publishedVerdict({ code: 0, out: '"0.1.0"', version: '0.2.0' }).ok, true);
});

test('unparseable or unexpected output skips rather than guessing', () => {
  const junk = publishedVerdict({ code: 0, out: 'not json', version: '0.11.0' });
  assert.equal(junk.skipped, true);
  const odd = publishedVerdict({ code: 0, out: '{"a":1}', version: '0.11.0' });
  assert.equal(odd.skipped, true);
});

// ── wiring: the decision being right is worth nothing if the gate still asks
//    the question that cannot be answered ──────────────────────────────────
const GATE_SRC = readFileSync('scripts/consumer-gate.mjs', 'utf8');

test('the gate asks for the version LIST, not for one version', () => {
  // `npm view <pkg>@<version> version` is the call whose exit code cannot
  // distinguish "absent" from "unreachable". It must not come back.
  assert.match(GATE_SRC, /'view', junouiPkg\.name, 'versions', '--json'/);
  assert.doesNotMatch(GATE_SRC, /`\$\{junouiPkg\.name\}@\$\{junouiPkg\.version\}`/);
});

test('the gate delegates the decision rather than restating it', () => {
  assert.match(GATE_SRC, /import \{ publishedVerdict \} from '\.\/gate-published\.mjs'/);
  assert.match(GATE_SRC, /publishedVerdict\(\{/);
});
