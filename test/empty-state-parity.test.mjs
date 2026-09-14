// `.juno-empty` and `.juno-table__empty` are declared to be the same thing, and
// nothing enforced it until this file (20260914-084).
//
// `load-state.css`'s own header says `.juno-empty` is the "Generalized,
// table-agnostic form of the existing .juno-table__empty (table.css) — same
// anatomy, any region". The two rule bodies are byte-identical today. That
// agreement is INTENTIONAL, DOCUMENTED, and was held by nothing but whoever
// remembered the sentence: edit either one and the frame renders correctly, the
// gate stays green, the comment still claims "same anatomy", and the claim is
// quietly false.
//
// ASSERT THE RELATIONSHIP, NOT THE VALUE. A test pinning both to `56px 24px`
// would pass for the wrong reason — it would be satisfied by two rules that
// agree on padding and disagree on everything else — and it would have to be
// edited every time the value legitimately changes, which is exactly when
// somebody is most likely to edit only one side. A test that asserts the two
// bodies MATCH fails precisely when the documented claim stops being true, and
// is silent when the shared value moves in both places.
//
// This deliberately does NOT say the two should be one class. Whether
// `.juno-table__empty` becomes a composition of `.juno-empty` changes what a
// consumer's markup must say, and a table's empty row has structural constraints
// a generic region does not. That is a decision; this is a check.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const CSS = readFileSync('dist/css/juno.css', 'utf8');
const LOAD_SRC = readFileSync('src/css/components/load-state.css', 'utf8');

/**
 * The declarations of a rule, read from the BUILT bundle, normalised to a
 * comparable set.
 *
 * Read from `dist/` rather than from the two sources because the claim is about
 * what ships. A future build step that rewrote one file and not the other would
 * be invisible to a source comparison.
 */
function declarations(selector) {
  // The exact selector followed by optional space and `{` — so `.juno-empty`
  // does not match `.juno-empty--unknown` or `.juno-empty__icon`.
  const re = new RegExp(`(^|[},])\\s*${selector.replace(/[.]/g, '\\.')}\\s*\\{([^}]*)\\}`, 'm');
  const m = CSS.match(re);
  assert.ok(m, `${selector} has no rule of its own in the built bundle`);
  return m[2]
    .split(';')
    .map((d) => d.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .sort();
}

test('both rules were really found, with real declarations (vacuity floor)', () => {
  // Without this, a selector that stopped matching would make the comparison
  // below `[] === []` — two empty sets agree perfectly and prove nothing.
  const a = declarations('.juno-empty');
  const b = declarations('.juno-table__empty');
  assert.ok(a.length >= 6, `.juno-empty parsed only ${a.length} declarations`);
  assert.ok(b.length >= 6, `.juno-table__empty parsed only ${b.length} declarations`);
});

test('the two empty-state blocks still declare the same thing', () => {
  assert.deepEqual(
    declarations('.juno-table__empty'),
    declarations('.juno-empty'),
    'load-state.css calls .juno-empty the "generalized, table-agnostic form of ' +
      '.juno-table__empty — same anatomy". They have diverged. Either change both, ' +
      'or change that comment and this test, but do not leave the claim standing ' +
      'while it is false. If the divergence is deliberate, say which declaration ' +
      'differs and why in both files.',
  );
});

test('the comment that makes this a requirement is still there', () => {
  // The other direction: if someone deletes the "same anatomy" claim, this file
  // is asserting a relationship nobody is promising any more, and should go too.
  assert.match(
    LOAD_SRC,
    /table-agnostic form/,
    'load-state.css no longer claims .juno-empty generalizes .juno-table__empty — ' +
      'if that relationship is over, delete this test with it',
  );
});
