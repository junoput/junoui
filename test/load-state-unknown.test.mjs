// `.juno-empty` and `.juno-empty--unknown` must stay DISTINGUISHABLE (20260914-055).
//
// From geovista's survey reply (20260909-129), a consumer that cannot use a
// line of this CSS: "nothing-found and nothing-looked are different sentences."
// `.juno-empty` is documented as terminal — the load resolved, nothing will
// appear without new input. `--unknown` is the other half: not determined yet,
// resolves later on its own.
//
// THE ASSERTION THAT MATTERS IS THAT THEY DIFFER. A modifier that exists but
// changes nothing would pass any "does the class exist" check while delivering
// exactly the collapse the ticket was filed about — the two states would be one
// state with two names. So the test below reads the built CSS and requires the
// modifier to actually carry a declaration.
//
// AND NOT BY COLOUR. docs/accessibility.md's rule is that colour never carries
// meaning alone. If the only difference were a colour token, a colourblind or
// screen-reader user would see one state where there are two — so the
// distinguishing declaration must not be a colour property.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const CSS = readFileSync('dist/css/juno.css', 'utf8');
const SRC = readFileSync('src/css/components/load-state.css', 'utf8');
const DOC = readFileSync('docs/components/load-state.md', 'utf8');
const A11Y = readFileSync('docs/accessibility.md', 'utf8');

/** The declaration block for a selector in the bundled CSS. */
function blockFor(selector) {
  const i = CSS.indexOf(selector);
  assert.notEqual(i, -1, `${selector} is not in the built bundle`);
  const open = CSS.indexOf('{', i);
  const close = CSS.indexOf('}', open);
  return CSS.slice(open + 1, close).trim();
}

test('the modifier reaches the built bundle at all (vacuity floor)', () => {
  // Everything below reads dist/. If the bundler stopped including
  // load-state.css, each assertion would be checking a string that is simply
  // absent and the failures would point at the wrong thing.
  assert.ok(CSS.includes('.juno-empty'), 'the bundle has no .juno-empty');
  assert.ok(CSS.includes('.juno-empty--unknown'), 'the bundle has no .juno-empty--unknown');
});

test('--unknown actually changes something, rather than existing in name only', () => {
  const block = blockFor('.juno-empty--unknown');
  assert.ok(block.length > 0, 'the modifier has an empty declaration block — it changes nothing');
  assert.match(block, /[a-z-]+\s*:/, 'the modifier carries no declaration');
});

test('the distinction is not carried by colour', () => {
  // accessibility.md: colour never carries meaning alone. A colour-only
  // modifier would collapse the two states for anyone who cannot see it.
  const block = blockFor('.juno-empty--unknown');
  assert.doesNotMatch(
    block,
    /(^|[;\s])color\s*:/,
    'the only difference must not be a colour — pair it with a non-colour signal',
  );
});

test('both states are documented as different, not as synonyms', () => {
  // The failure this guards is a doc that lists the class without saying when
  // to use which — which is how two states become one state with two names.
  assert.match(DOC, /juno-empty--unknown/, 'the component doc never mentions the modifier');
  assert.match(DOC, /terminal/i, 'the doc no longer says empty is terminal');
  assert.match(
    DOC,
    /not determined yet/i,
    'the doc no longer states what unknown means, only that it exists',
  );
});

test('the ARIA contract says the two must not announce alike', () => {
  // The visual cue is a dashed border. A screen-reader user cannot see it, so
  // the text has to carry the distinction — if that instruction is lost, the
  // state is inaccessible while still looking correct.
  const row = A11Y.split('\n').find((l) => l.includes('Load state — unknown'));
  assert.ok(row, 'accessibility.md has no contract row for the unknown state');
  assert.match(row, /must not announce/i, 'the row no longer distinguishes it from empty');
});

test('the source records why this exists, not just that it does', () => {
  // The consumer evidence is the reason this is junoui's problem rather than
  // one app's. Losing it makes the modifier look arbitrary to the next reader.
  assert.match(SRC, /20260909-129/, 'the source lost the survey reply this came from');
  // \s+ not a literal space: the quote is line-wrapped in the CSS comment, and
  // a phrase pinned as one line breaks on reflow rather than on meaning — the
  // same brittleness corrected in branching.test.mjs earlier (20260909-114).
  assert.match(SRC, /different\s+sentences/, 'the source lost the evidence for the distinction');
});
