// The consumer gate's verdict/summary line (20260909-116).
//
// THE DEFECT. Gating 0.11.0, the gate printed a stage as PASS with a
// "skipped — registry unreachable" note, the verdict block dropped the
// note entirely, and the summary said "GATE GREEN — 10 stages passed" when
// nine passed and one never ran. Reproduced here directly against the
// real report shape rather than by running the gate, for the same reason
// gate-currency.test.mjs tests baselineVerdict as a pure function: the gate
// itself needs a network and a real consumer checkout.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { stageLine, summarize } from '../scripts/gate-verdict.mjs';

const PASS = (name) => ({ name, ok: true, note: '', skipped: false });
const FAIL = (name, note = '') => ({ name, ok: false, note, skipped: false });
const SKIP = (name, note = '') => ({ name, ok: true, note, skipped: true });

test('all passing, none skipped: the line is the plain count, exactly as before', () => {
  const results = [PASS('a'), PASS('b'), PASS('c')];
  const { red, line } = summarize(results);
  assert.equal(red, false);
  assert.equal(line, 'GATE GREEN — 3 stages passed.');
});

test('the exact reported case: 9 pass, 1 skipped — the summary says both counts', () => {
  const results = [
    ...Array.from({ length: 9 }, (_, i) => PASS(`stage ${i}`)),
    SKIP('this version is not already published', 'registry unreachable'),
  ];
  const { passed, skipped, failed, red, line } = summarize(results);
  assert.equal(passed.length, 9);
  assert.equal(skipped.length, 1);
  assert.equal(failed.length, 0);
  assert.equal(red, false);
  // The bug's exact wrong sentence must not appear.
  assert.notEqual(line, 'GATE GREEN — 10 stages passed.');
  assert.match(line, /^GATE GREEN — 9 passed, 1 skipped \(registry unreachable\)\.$/);
});

test('a skipped stage is never counted as a pass, whatever `ok` says', () => {
  // The actual fix: `skipped` must outrank `ok` in the count, not just in
  // display. Construct the exact shape record() produces for a skip
  // (ok: true) and confirm it lands in neither passed nor failed.
  const results = [SKIP('x', 'network down')];
  const { passed, failed, skipped } = summarize(results);
  assert.equal(passed.length, 0, 'a skipped stage was counted as passed');
  assert.equal(failed.length, 0, 'a skipped stage was counted as failed');
  assert.equal(skipped.length, 1);
});

test('a real failure still turns the gate red even with a skip present', () => {
  // Skips must not be able to mask a genuine failure either.
  const results = [PASS('a'), SKIP('b', 'offline'), FAIL('c', 'exit 1')];
  const { red, line, failed } = summarize(results);
  assert.equal(red, true);
  assert.equal(failed.length, 1);
  assert.match(line, /^GATE RED — 1 of 3 stages failed\. This release is blocked\.$/);
});

test('multiple skips are all named in the summary, not just counted', () => {
  const results = [PASS('a'), SKIP('b', 'reason one'), SKIP('c', 'reason two')];
  const { line } = summarize(results);
  assert.match(line, /reason one/);
  assert.match(line, /reason two/);
});

test('stageLine: SKIP outranks PASS for display, same priority as the count', () => {
  // Constructed with ok: true (record() passes true at both real skip call
  // sites) — if display fell back to `ok`, this would print PASS.
  const s = stageLine(SKIP('x', 'registry unreachable'));
  assert.match(s, /^SKIP\s\s/);
  assert.doesNotMatch(s, /^PASS/);
  assert.match(s, /registry unreachable/);
});

test('stageLine: a plain pass has no dangling separator when there is no note', () => {
  assert.equal(stageLine(PASS('ok stage')), 'PASS  ok stage');
});

test('stageLine: a fail carries its note, the way the stage line always has', () => {
  assert.equal(stageLine(FAIL('build', 'exit 2')), 'FAIL  build — exit 2');
});

// ── wiring: the pure functions being correct is worth nothing if the script
//    still computes its own count inline, the way it did when this shipped ──
const GATE_SRC = readFileSync('scripts/consumer-gate.mjs', 'utf8');

test('the gate imports summarize/stageLine rather than restating the logic', () => {
  assert.match(
    GATE_SRC,
    /import\s*\{\s*stageLine,\s*summarize\s*\}\s*from\s*'\.\/gate-verdict\.mjs'/,
  );
});

test('record() carries a skipped flag through to the results it stores', () => {
  assert.match(GATE_SRC, /function record\(name, ok, note = '', \{ skipped = false \} = \{\}\)/);
  assert.match(GATE_SRC, /const r = \{ name, ok, note, skipped \};/);
});

test('both real skip sites pass { skipped: true } — neither was missed', () => {
  const skipSites = [...GATE_SRC.matchAll(/\{\s*skipped: true,?\s*\}/g)];
  assert.equal(skipSites.length, 2, 'expected exactly the two documented skip call sites');
});

test('the verdict block computes its counts from summarize(), not results.length', () => {
  // The exact defect: "GATE GREEN — ${results.length} stages passed" counts
  // every stage, skipped ones included. Assert that literal is gone.
  assert.doesNotMatch(
    GATE_SRC,
    /GATE GREEN — \$\{results\.length\} stages passed/,
    'the summary still counts results.length as passed — the exact reported bug',
  );
  assert.match(GATE_SRC, /const \{ failed, skipped, red, line \} = summarize\(results\);/);
});

test('the verdict block prints stageLine (with its note), not a bare PASS/FAIL', () => {
  // The second defect: the per-row loop used to print only PASS/FAIL, so a
  // skipped stage's own caveat never reached the block that gets pasted
  // onto a release ticket.
  const verdictBlock = GATE_SRC.slice(GATE_SRC.indexOf('── verdict'));
  assert.match(verdictBlock, /stageLine\(r\)/);
});
