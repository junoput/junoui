// States a consumer CANNOT write in HTML must be documented (20260914-087).
//
// `.juno-checkbox:indeterminate` shipped on 2026-06-29 with a styled dash and
// was mentioned in no documentation for eleven weeks. `accessibility.md` said the
// component's "State is native `checked`" — not merely incomplete, but a positive
// statement that there are two states. It was found sideways, while checking a
// DIFFERENT ticket's claim that the hook did not exist.
//
// WHY THIS ONE HID WHEN OTHER STATES DO NOT. `:indeterminate` is the only
// pseudo-class in src/css that is BOTH a user-visible state AND unsettable from
// markup: `indeterminate` is a DOM property, `<input indeterminate>` does
// nothing. So:
//
//   · no showcase page can render it, because you cannot write one — no visual
//     baseline has ever contained it;
//   · the "every component has an ARIA row" guard passes, because it asserts the
//     ROW exists rather than that it covers the component's states;
//   · and a consumer reading the row is told the state model and has no reason
//     to look further.
//
// A DECLARED LIST, NOT A DERIVED ONE. Requiring every styled pseudo-class to be
// documented would drag in `:-webkit-scrollbar`, `:nth-child`, `:has` and
// `:root` — implementation detail, not API — and produce a check that is mostly
// false positives. What is checkable instead is GROWTH: the inventory below is
// the set of pseudo-classes src/css styles today, and a new arrival fails with
// the question that matters, "can a consumer set this from markup?".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const DIR = 'src/css/components';
const CHECKBOX_DOC = readFileSync('docs/components/checkbox.md', 'utf8');
const A11Y = readFileSync('docs/accessibility.md', 'utf8');

/**
 * States that cannot be set from markup, and therefore have to be documented or
 * they are undiscoverable. Each entry names where the documentation must live.
 */
const SCRIPT_ONLY = [
  {
    state: ':indeterminate',
    css: 'checkbox.css',
    docs: [
      [
        'docs/components/checkbox.md',
        CHECKBOX_DOC,
        /el\.indeterminate = true|\.indeterminate = true/,
      ],
      ['docs/accessibility.md', A11Y, /indeterminate/],
    ],
    announces: /mixed/,
  },
];

/**
 * Every pseudo-class src/css styles today. NOT a list of documented API — most
 * of these are structural and correctly undocumented. It exists so that a NEW
 * one has to be looked at once, and classified.
 */
const KNOWN_PSEUDO = new Set([
  'hover',
  'focus',
  'focus-visible',
  'focus-within',
  'active',
  'not',
  'is',
  'where',
  'has',
  'first-child',
  'last-child',
  'only-child',
  'nth-child',
  'root',
  'before',
  'after',
  'popover-open',
  'placeholder',
  'placeholder-shown',
  'disabled',
  'checked',
  'indeterminate',
  'backdrop',
  'open',
  'target',
  'empty',
  'first-of-type',
  'last-of-type',
  'marker',
  'selection',
  'lang',
  'dir',
  'link',
  'visited',
  'enabled',
  'required',
  'invalid',
  'valid',
  'optional',
  'read-only',
  'defined',
  'modal',
  'user-invalid',
  'user-valid',
  'in-range',
  'out-of-range',
  'default',
  'autofill',
  'any-link',
  'nth-of-type',
  '-webkit-scrollbar',
  '-webkit-scrollbar-thumb',
  '-webkit-scrollbar-track',
  '-webkit-details-marker',
  '-webkit-slider-thumb',
  '-moz-range-thumb',
  '-webkit-slider-runnable-track',
  '-moz-range-track',
  '-webkit-progress-bar',
  '-webkit-progress-value',
  '-moz-progress-bar',
  '-webkit-search-cancel-button',
  '-webkit-outer-spin-button',
  '-webkit-inner-spin-button',
  '-webkit-calendar-picker-indicator',
]);

function styledPseudoClasses() {
  const found = new Map();
  for (const f of readdirSync(DIR)) {
    if (!f.endsWith('.css')) continue;
    const css = readFileSync(`${DIR}/${f}`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/:(-?[a-z][a-z-]*)(?=[^{}]*\{)/g)) {
      if (!found.has(m[1])) found.set(m[1], new Set());
      found.get(m[1]).add(f);
    }
  }
  return found;
}

test('the stylesheets were really read (vacuity floor)', () => {
  const all = styledPseudoClasses();
  assert.ok(all.size >= 15, `only ${all.size} pseudo-classes found across ${DIR}`);
  assert.ok(all.has('indeterminate'), 'the checkbox no longer styles :indeterminate at all');
});

for (const { state, css, docs, announces } of SCRIPT_ONLY) {
  test(`${state} is still styled in ${css} (the premise this test rests on)`, () => {
    // If the CSS goes away, the documentation requirement goes with it — and the
    // failure should say so rather than reporting a missing doc for a state that
    // no longer exists.
    const files = styledPseudoClasses().get(state.slice(1));
    assert.ok(files?.has(css), `${state} is no longer styled in ${css} — remove this entry too`);
  });

  for (const [name, text, pattern] of docs) {
    test(`${state} is documented in ${name}`, () => {
      assert.match(
        text,
        pattern,
        `${state} is styled in ${css} and cannot be set from markup, so a consumer ` +
          `who is not told about it cannot discover it — no attribute exposes it, ` +
          `no showcase page can render it, and no visual baseline contains it.`,
      );
    });
  }

  test(`${state}'s announced value is stated, not just its existence`, () => {
    // The failure this guards is a doc that mentions the state without saying
    // what a screen reader reports — which is the part a consumer cannot infer,
    // since it is a third value rather than a shade of the other two.
    assert.match(A11Y, announces, `accessibility.md does not say what ${state} announces as`);
  });
}

test('no NEW pseudo-class has appeared unclassified', () => {
  // The growth guard, and the only part of this file that generalises. A new
  // arrival is not necessarily a defect — most are structural. It has to be
  // looked at ONCE and put in the right list.
  const unknown = [...styledPseudoClasses().entries()]
    .filter(([name]) => !KNOWN_PSEUDO.has(name))
    .map(([name, files]) => `:${name}  (${[...files].join(', ')})`);
  assert.deepEqual(
    unknown,
    [],
    'a pseudo-class is styled that this file has not seen. Ask the question that ' +
      'matters: CAN A CONSUMER SET THIS FROM MARKUP? If yes, add it to ' +
      'KNOWN_PSEUDO and move on. If no, it needs a SCRIPT_ONLY entry and ' +
      'documentation, or it will be invisible the way :indeterminate was for ' +
      'eleven weeks.',
  );
});
