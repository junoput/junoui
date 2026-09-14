// density.css states a contract in its header. This asserts the RELATIONSHIP it
// states, not the numbers it happens to have (20260914-143).
//
//     "compact removes PROPORTIONALLY more block (vertical) padding than inline"
//
// PROPORTIONALLY was added by this ticket. Without it the sentence is false for
// the control archetype, which sheds 8px of inline against 6px of block — the
// reverse of what the file says, in the file that says it:
//
//     surface   block 16 -> 10  (-37.5%)   inline 16 -> 12  (-25%)
//     control   block 10 ->  4  (-60%)     inline 20 -> 12  (-40%)
//
// Both forms agree on surface, which is why it read as true for as long as
// anyone checked it against a surface. The ratio form holds for both.
//
// WHY THE RELATIONSHIP RATHER THAN THE VALUES: a test asserting 10 and 4 passes
// for the wrong reason the moment someone retunes the scale deliberately, and it
// says nothing about whether the contract still holds. The ticket that produced
// this repo's clearest statement of it — two mechanisms landing on one value is
// invisible to every check — applies directly: pin what must stay true, not what
// is true today.
//
// IT ALSO MATTERS OUTSIDE THE DOC. 20260909-037's per-component checklist reads
// "both axes or neither — compact removes more block than inline, so a
// half-migration inverts it", and applies that as an ABSOLUTE test. Under the
// absolute reading a control densified only on its block axis looks compliant;
// under the ratio form it does not. Five elements are in exactly that state and
// are tracked on 20260914-143.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const TOKENS = readFileSync('dist/css/juno-tokens.css', 'utf8');
const DENSITY = readFileSync('src/css/density.css', 'utf8');

/** `--juno-space-12` → 12. Resolved from the built tokens, not hardcoded. */
function px(name) {
  const m = TOKENS.match(new RegExp(`^\\s*${name}\\s*:\\s*([\\d.]+)px`, 'm'));
  assert.ok(m, `${name} is not declared in the built token stylesheet`);
  return Number(m[1]);
}

/** The four archetype values inside one density block, resolved to pixels. */
function archetypes(blockSelector) {
  const start = DENSITY.indexOf(blockSelector);
  assert.notEqual(start, -1, `no ${blockSelector} block in density.css`);
  const body = DENSITY.slice(start, DENSITY.indexOf('}', start));
  const read = (alias) => {
    const m = body.match(new RegExp(`${alias}\\s*:\\s*var\\((--juno-space-[\\d]+)\\)`));
    assert.ok(m, `${alias} is not set in ${blockSelector}`);
    return px(m[1]);
  };
  return {
    controlBlock: read('--juno-pad-control-block'),
    controlInline: read('--juno-pad-control-inline'),
    surfaceBlock: read('--juno-pad-surface-block'),
    surfaceInline: read('--juno-pad-surface-inline'),
  };
}

const COMFORTABLE = archetypes("[data-juno-density='comfortable']");
const COMPACT = archetypes("[data-juno-density='compact']");

test('the archetypes were really read, and compact really is smaller', () => {
  // Vacuity floor. Every assertion below is a comparison between two objects;
  // if either resolved to zeros or to the same block twice, the ratios become
  // 0 vs 0 or 1 vs 1 and the contract "holds" while nothing was measured.
  for (const [k, v] of Object.entries(COMFORTABLE)) assert.ok(v > 0, `comfortable ${k} is ${v}`);
  for (const [k, v] of Object.entries(COMPACT)) assert.ok(v > 0, `compact ${k} is ${v}`);
  for (const k of Object.keys(COMFORTABLE))
    assert.ok(COMPACT[k] < COMFORTABLE[k], `compact ${k} is not smaller than comfortable`);
});

test('compact removes proportionally more block than inline — BOTH archetypes', () => {
  // The contract as the header states it. Ratios, because that is the form that
  // is true; see the absolute check below for the form that is not.
  for (const kind of ['control', 'surface']) {
    const shrink = (axis) => 1 - COMPACT[kind + axis] / COMFORTABLE[kind + axis];
    assert.ok(
      shrink('Block') > shrink('Inline'),
      `${kind}: block sheds ${(shrink('Block') * 100).toFixed(1)}% and inline ` +
        `${(shrink('Inline') * 100).toFixed(1)}% — density.css's header promises ` +
        'block sheds proportionally more, so text never crowds its edges.',
    );
  }
});

test('the ABSOLUTE reading is false for control and true for surface', () => {
  // Pinned deliberately, as the thing that made the old wording wrong. If a
  // future retune makes control shed more block than inline in pixels too, this
  // fails — and the right response is to delete this test and simplify the
  // header, not to weaken it. Pinning a known asymmetry is what stops the word
  // "proportionally" being dropped again as redundant.
  const drop = (kind, axis) => COMFORTABLE[kind + axis] - COMPACT[kind + axis];
  assert.ok(
    drop('control', 'Inline') > drop('control', 'Block'),
    'control now sheds more block than inline in absolute px — the header can be ' +
      'simplified and this test removed',
  );
  assert.ok(
    drop('surface', 'Block') > drop('surface', 'Inline'),
    'surface no longer sheds more block than inline in absolute px',
  );
});

test('the header says PROPORTIONALLY, in the sentence stating the contract', () => {
  // The words and the numbers have to move together. Without this the values can
  // satisfy the ratio form while the header goes back to claiming the absolute
  // one, which is exactly the state this ticket found.
  const header = DENSITY.slice(0, DENSITY.indexOf('*/'));
  assert.match(
    header,
    /PROPORTIONALLY more\s+\*\s+block \(vertical\) padding than inline/,
    'density.css\'s header no longer qualifies the claim with "proportionally"',
  );
});
