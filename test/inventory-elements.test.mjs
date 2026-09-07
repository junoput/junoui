// Runs docs/inventory-elements.md's prose-vs-rows checker as part of `npm
// test`, not just as a script someone has to remember to type. Without this
// file, `scripts/check-inventory-elements.mjs` guards nothing: nobody runs it
// on an edit, the summary drifts from the rows again, and nothing goes red
// (20260906-054, review #3 — grep found zero references to it in package.json,
// test/, or .github/workflows, and the merged branch's test count was
// unchanged at 253, which is the proof it never ran).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkInventoryElements, MIN_ROWS } from '../scripts/check-inventory-elements.mjs';

test('inventory-elements.md prose matches its own per-component rows', () => {
  const result = checkInventoryElements();

  // The checker's own vacuity floor, asserted here too: a walker that parses
  // zero (or too few) rows must fail loudly, not report agreement between two
  // empty sets. Do not let `vacuous` silently short-circuit past the assertion
  // below into a pass.
  assert.equal(
    result.vacuous,
    false,
    result.vacuous ? `VACUOUS: ${result.vacuousReason}` : undefined,
  );
  assert.ok(
    result.rowCount >= MIN_ROWS,
    `only ${result.rowCount} component rows parsed (floor is ${MIN_ROWS})`,
  );

  if (result.failures.length > 0) {
    const detail = result.failures
      .map((f) => `docs/inventory-elements.md:${f.line}: ${f.msg}`)
      .join('\n');
    assert.fail(`inventory-elements.md prose disagrees with its own rows:\n${detail}`);
  }
});
