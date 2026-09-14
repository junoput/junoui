// Rules that are DECLARED to be the same thing, and were held by nothing
// (20260914-084).
//
// junoui has several pairs of rules with byte-identical bodies. Some of those
// pairs are a documented relationship — one component's own header says it
// generalises or varies another — and some are just the same idiom written
// twice. Only the first kind is a promise, and until this file nothing checked
// any of them: edit one side, the frame renders correctly, the gate stays green,
// the comment still claims they match, and the claim is quietly false.
//
// ASSERT THE RELATIONSHIP, NOT THE VALUE. A test pinning `.juno-empty` to
// `56px 24px` would pass for the wrong reason — satisfied by two rules agreeing
// on padding and differing everywhere else — and would need editing every time
// the value legitimately moves, which is exactly when somebody edits one side
// only. Comparing declaration SETS fails when the claim stops being true and is
// silent when the shared value moves in both places.
//
// THE MAP IS DECLARED, NOT DERIVED. Finding identical bodies is easy and would
// be the wrong test: it would pin coincidences as though they were promises, and
// it would go green the day someone broke a pair by editing both sides into a
// new agreement. Each entry below names the evidence that the pair is a
// commitment, and the pairs that were checked and NOT adopted are listed too —
// the exceptions are where the next defect hides.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const CSS = readFileSync('dist/css/juno.css', 'utf8');
const SRC = (f) => readFileSync(`src/css/components/${f}`, 'utf8');

/**
 * Pairs that MUST agree, each with the source claim that makes it a requirement
 * and a regex pinning that claim, so ending the relationship deliberately takes
 * the entry with it rather than leaving a promise nobody is making.
 */
const DECLARED = [
  {
    a: '.juno-empty',
    b: '.juno-table__empty',
    file: 'load-state.css',
    claim: /table-agnostic form/,
    why: 'load-state.css calls .juno-empty the "Generalized, table-agnostic form of the existing .juno-table__empty (table.css) — same anatomy, any region"',
  },
  {
    a: '.juno-empty__icon',
    b: '.juno-table__empty-icon',
    file: 'load-state.css',
    claim: /table-agnostic form/,
    why: 'same claim as the block above — "same anatomy" covers the icon, and pinning the block while leaving its icon free is how half a relationship survives',
  },
  {
    a: '.juno-alert__icon',
    b: '.juno-toast__icon',
    file: 'toast.css',
    claim: /alert, but elevated/,
    why: 'toast.css describes the toast as "alert, but elevated (shadow) and stacked in a fixed corner" — a declared variant, so its parts track alert\'s',
  },
  {
    a: '.juno-alert__close',
    b: '.juno-toast__close',
    file: 'toast.css',
    claim: /alert, but elevated/,
    why: 'same declared variant relationship as the icon above',
  },
];

/**
 * Identical bodies that are NOT adopted, with the reason. Both are the same
 * idiom written twice rather than a commitment by either component, and pinning
 * them would assert a promise nobody made — which is worse than no test,
 * because a later author would have to argue with a green check to diverge.
 */
const NOT_DECLARED = [
  [
    '.juno-choice / .juno-switch',
    'both are "a <label> wrapping a form control" — inline-flex, control gap, sans 13, pointer. Neither file mentions the other; the agreement is the idiom, not a claim.',
  ],
  [
    '.juno-seg__opt input / .juno-switch__input',
    'both are the visually-hidden-but-focusable input idiom. Same: a shared technique, not a declared relationship.',
  ],
];

/** The declarations of a rule in the BUILT bundle, normalised to a sorted set.
 *
 *  Read from dist/ rather than the sources because the claim is about what
 *  ships — a build step that rewrote one file and not the other would be
 *  invisible to a source comparison. The regex requires the rule's own `{`, so
 *  `.juno-empty` does not match `.juno-empty--unknown` or `.juno-empty__icon`. */
function declarations(selector) {
  const re = new RegExp(`(^|[},])\\s*${selector.replace(/[.]/g, '\\.')}\\s*\\{([^}]*)\\}`, 'm');
  const m = CSS.match(re);
  assert.ok(m, `${selector} has no rule of its own in the built bundle`);
  return m[2]
    .split(';')
    .map((d) => d.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .sort();
}

test('every pinned rule was really found, with real declarations (vacuity floor)', () => {
  // Without this, a selector that stopped matching would reduce a comparison to
  // `[] === []` — two empty sets agree perfectly and prove nothing.
  assert.ok(DECLARED.length >= 4, 'the declared map has shrunk unexpectedly');
  for (const { a, b } of DECLARED) {
    for (const sel of [a, b]) {
      const d = declarations(sel);
      assert.ok(d.length >= 3, `${sel} parsed only ${d.length} declarations`);
    }
  }
});

for (const { a, b, why } of DECLARED) {
  test(`${a} and ${b} still declare the same thing`, () => {
    assert.deepEqual(
      declarations(b),
      declarations(a),
      `${why}. They have diverged. Either change both, or change that claim AND ` +
        `this entry — but do not leave the claim standing while it is false. If ` +
        `the divergence is deliberate, say which declaration differs and why in ` +
        `both files.`,
    );
  });
}

test('the source claims that make these requirements are still there', () => {
  // The other direction. If someone ends a relationship deliberately, its entry
  // should go with it rather than pinning a promise nobody is making.
  for (const { a, b, file, claim } of DECLARED) {
    assert.match(
      SRC(file),
      claim,
      `${file} no longer states the relationship behind ${a} / ${b} — if it is ` +
        `over, delete that entry from DECLARED with it`,
    );
  }
});

test('the un-adopted identical pairs are recorded with reasons', () => {
  // The exceptions are the point. An unexplained gap gets closed by the next
  // person with the same broken assumption — and here the wrong move (pinning a
  // coincidence) is the one that looks like more coverage.
  assert.ok(NOT_DECLARED.length >= 2, 'the un-adopted list has been emptied');
  for (const [pair, reason] of NOT_DECLARED) {
    assert.ok(reason && reason.length > 40, `${pair} is listed with no real reason`);
  }
});
