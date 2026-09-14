// A WRAPPER COMPONENT REPORTS ZERO STATES AND IS NOT A COVERAGE GAP (20260909-131).
//
// `docs/inventory-elements.md` counts the states a FILE declares. `select` and `field`
// declare none, because both wrap a native control that carries `.juno-input` — so the
// states are in `input.css`, one file over.
//
// That zero has now been read as a gap five times, by three different passes, always in
// the same direction: the gap list on 20260909-131 reported `select` as missing
// `:disabled`/`:invalid` hooks and `field` as "the one zero-state component that is a form
// control wrapper ... a real gap candidate". Both are false, and understating what junoui
// ships is the expensive direction — it causes somebody to build a second time what is
// already here.
//
// WHAT THIS PINS, AND WHY IT IS NOT A TAUTOLOGY: the zero is only truthful while the
// delegation holds. If `select.css` stops routing through `.juno-input`, or `input.css`
// stops declaring the states, the census row stays `0` and silently becomes a real gap
// with nothing to say so. So this asserts the RELATIONSHIP — wrapper points at the control,
// control carries the states — rather than the count.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
const read = (f) => strip(readFileSync(f, 'utf8'));

const INPUT = read('src/css/components/input.css');
const SELECT = read('src/css/components/select.css');
const FIELD = read('src/css/components/field.css');
const CENSUS = readFileSync('docs/inventory-elements.md', 'utf8');

/** The states a form control must carry for the wrappers' zero to be honest. */
const DELEGATED = [':disabled', ':focus-visible', "[aria-invalid='true']"];

test('the files were really read, and comments are not being counted', () => {
  // Vacuity floor. Every assertion below is a substring search, and a search over an
  // empty string finds nothing and reports nothing — which here would read as a pass.
  for (const [name, css] of [
    ['input', INPUT],
    ['select', SELECT],
    ['field', FIELD],
  ])
    assert.ok(css.length > 200, `${name}.css parsed to ${css.length} chars`);
  // And the stripper must actually strip: select.css's usage block mentions `.juno-input`
  // inside a comment, so a checker that counts comments would pass the delegation test
  // below on the documentation alone.
  assert.ok(
    !strip('/* .juno-select > .juno-input */').includes('.juno-select >'),
    'the comment stripper is not stripping',
  );
});

test('select delegates its box, and therefore its states, to .juno-input', () => {
  assert.match(
    SELECT,
    /\.juno-select\s*>\s*\.juno-input/,
    'select.css no longer routes the control through .juno-input — the census row reads ' +
      '0 states and that zero is now a real gap rather than a delegation',
  );
});

test('input carries the states the wrappers delegate to it', () => {
  for (const state of DELEGATED)
    assert.ok(
      INPUT.includes(state),
      `input.css no longer declares ${state}. select and field report 0 states in the ` +
        'census on the strength of this file carrying them; without it both rows are ' +
        'silently wrong and nothing else says so.',
    );
});

test('field states, in its own words, that it owns none', () => {
  // The other half of the delegation, and it is documented rather than structural: field
  // is layout plus the required/error cues, and the control it wraps carries aria-invalid.
  const doc = readFileSync('docs/components/field.md', 'utf8');
  assert.match(doc, /it owns no state/i, 'field.md no longer states its no-state contract');
  assert.match(doc, /aria-invalid/, 'field.md no longer points at the control for validity');
  assert.match(FIELD, /\.juno-field__error/, 'field.css lost its error part');
});

test('the census still records both as zero — if not, this note needs rewriting', () => {
  // The control on the whole file. These assertions explain a ZERO; the day either row
  // stops being zero, the explanation above is stale and a reader would inherit it.
  for (const name of ['select', 'field']) {
    const row = CENSUS.split(`### \`${name}\``)[1];
    assert.ok(row, `no census entry for ${name}`);
    assert.match(
      row.split('###')[0],
      /\*\*States\/hooks\*\* \(0\): _none_/,
      `${name} now declares its own states — update the wrapper note in the census`,
    );
  }
});
