// The conformance checklist (slice 7, 20260826-036 item G).
//
// The kit's own anti-goal says: "Anything in G that the doctor cannot check is
// a checklist item a reader will skip. Prefer fewer checks that run." So this
// file holds the checklist to that, mechanically — every claimed check must
// point at something that exists, and the gaps section must still be there.
//
// A checklist is prose, and prose rots faster than anything else in a repo.
// This is the cheapest thing that stops it becoming aspirational.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const doc = readFileSync('docs/conformance-checklist.md', 'utf8');
const doctor = readFileSync('tools/doctor.mjs', 'utf8');

test('the checklist exists and is not a stub', () => {
  assert.ok(doc.length > 1200, 'the checklist is suspiciously short');
});

test('every "checked by the doctor" claim maps to a check the doctor makes', () => {
  // The claims and the code that backs them. If a row is added to that table
  // without a check behind it, this is the thing that notices.
  const claims = [
    ['tap floor', /shortTargets/],
    ['primary navigation', /navigationVerdict/],
    ['class', /unknownClasses/],
    ['scroll sideways', /overflowsInline/],
  ];
  for (const [phrase, backing] of claims) {
    assert.ok(
      doc.toLowerCase().includes(phrase.toLowerCase()),
      `the checklist no longer claims: ${phrase}`,
    );
    assert.match(doctor, backing, `nothing in the doctor backs the "${phrase}" claim`);
  }
});

test('every doc the checklist points at exists', () => {
  // A checklist whose links 404 is worse than no checklist: it looks like the
  // subject is covered somewhere else.
  const missing = [];
  for (const m of doc.matchAll(/\]\(\.\/([^)#]+)(?:#[^)]*)?\)/g)) {
    const path = `docs/${m[1]}`;
    if (!existsSync(path)) missing.push(path);
  }
  assert.deepEqual(missing, []);
});

test('the checklist names the landscape-phone case explicitly', () => {
  // The one every width-based table misses, and the reason the doctor has a
  // profile at 844x390 at all. If this sentence goes, the next reader has no
  // way to know why that profile is there.
  assert.match(doc, /844/, 'the landscape-phone dimensions are gone');
  assert.match(doc, /wider than/i);
});

test('the checklist keeps a "what nothing checks yet" section', () => {
  // THE anti-goal, stated as a test. A checklist that omits its own gaps is
  // the failure it exists to prevent — it reads as coverage of the things
  // nobody looked at.
  assert.match(doc, /What nothing checks yet/i);
  for (const gap of ['WebKit', 'env()', 'Routes you did not visit', 'how it LOOKS']) {
    assert.ok(doc.includes(gap), `the gaps section no longer names ${gap}`);
  }
});

test('the doctor and the checklist agree about the limits', () => {
  // Two places state what is uncovered — the CLI output and this doc — and
  // they are read by the same person in different moments. Drift between them
  // is how a limit quietly disappears from one of them.
  for (const gap of ['WebKit', 'env()', 'never the picture']) {
    assert.ok(doctor.includes(gap), `the doctor no longer admits ${gap}`);
  }
  for (const gap of ['WebKit', 'env()', 'appearance.md']) {
    assert.ok(doc.includes(gap), `the checklist no longer admits ${gap}`);
  }
});
