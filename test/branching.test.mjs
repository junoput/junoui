// The branch model, kept in step with the CI triggers (20260901-057).
//
// junoui has one long-lived branch. The failure this guards is specific and has
// already happened: `develop` existed, looked like a valid PR target, and got
// NO CI at all — because ci.yml filters `pull_request` to `main`, so a PR
// against it showed an empty check list, which looks identical to green.
//
// So the set of branches CI acts on and the set this repo documents have to be
// the same set, and a disagreement is a test failure rather than something
// someone notices after opening a PR into a hole.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
const doc = readFileSync('docs/branching.md', 'utf8');

/** The `branches: [...]` lists under each trigger in a workflow. */
function triggerBranches(yaml) {
  const on = yaml.slice(yaml.indexOf('\non:'), yaml.indexOf('\njobs:'));
  return [...on.matchAll(/branches:\s*\[([^\]]*)\]/g)].map((m) =>
    m[1]
      .split(',')
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean),
  );
}

test('the parser reads a branch list, and can come back empty', () => {
  // Its own test, because a parser that silently returns [] would make every
  // assertion below vacuous — the shape of guard this repo keeps re-learning.
  assert.deepEqual(triggerBranches('\non:\n  push:\n    branches: [main]\njobs:\n'), [['main']]);
  assert.deepEqual(triggerBranches('\non:\n  workflow_dispatch:\njobs:\n'), []);
  assert.deepEqual(triggerBranches('\non:\n  push:\n    branches: [a, b]\njobs:\n'), [['a', 'b']]);
});

test('every branch CI NAMES is main, and nothing else', () => {
  // Named, not "at least one named". An ABSENT filter is not a violation — it
  // is the recommended fix, since an unfiltered pull_request trigger runs CI on
  // a PR to any base, so a mis-targeted PR is honestly red or green instead of
  // showing an empty check list. The first version of this test required a
  // filter to exist and would therefore have blocked the improvement it is
  // written to argue for.
  const named = new Set(triggerBranches(ci).flat());
  assert.deepEqual(
    [...named],
    named.size ? ['main'] : [],
    'ci.yml names a branch other than main — document it in docs/branching.md ' +
      'or remove it, but do not leave a branch that CI half-knows about',
  );
});

test('the doc and the pull_request filter agree about whether the class is open', () => {
  // The residual is only a residual while the trigger is filtered. When the
  // filter goes, this test is what tells whoever removed it that the doc now
  // overstates the danger — rather than leaving a document that warns about a
  // trap the repo has already closed.
  const on = ci.slice(ci.indexOf('\non:'), ci.indexOf('\njobs:'));
  const prBlock = /pull_request:\s*\n(\s+branches:[^\n]*)?/.exec(on);
  const filtered = Boolean(prBlock && prBlock[1]);
  const claimsOpen = /does not close the class/i.test(doc);
  assert.equal(
    claimsOpen,
    filtered,
    filtered
      ? 'pull_request is still filtered, so docs/branching.md must keep the residual'
      : 'pull_request is no longer filtered — the class is closed, so the residual ' +
          'section in docs/branching.md is now wrong and should say so',
  );
});

test('the documented model says one long-lived branch, and names it', () => {
  assert.match(doc, /exactly one long-lived branch: `main`/);
});

test('the doc records why develop was deleted, not merely that it was', () => {
  // A deletion with no stated reason gets undone by the next person who thinks
  // a develop branch is normal. The numbers are the argument.
  assert.match(doc, /`develop` was deleted/);
  assert.match(doc, /0.*ever/s, 'the doc no longer states develop had no commits of its own');
  assert.match(doc, /all 33 merged PRs targeted/, 'the evidence for the deletion is gone');
});

test('the doc states the residual that survives the fix', () => {
  // This assertion used to demand the doc say the class was OPEN, which was
  // right until the filter was dropped and then became a test pinning a defect.
  // The state-dependent half is handled by the bidirectional test above; what
  // belongs here is the part that is true either way.
  //
  // A branch with no PR open still gets no CI until one exists. That is by
  // design — workflow_dispatch covers wanting a run first — and it is the
  // reason the visual baselines once drifted for months with nobody seeing a
  // red job (20260815-011). A doc that dropped it would read as "everything is
  // covered now", which is the failure this ticket is about, one turn later.
  assert.match(doc, /no PR open/i, 'the doc no longer states that a PR-less branch gets no CI');
  assert.match(doc, /20260815-011/, 'the doc lost the incident that makes that residual concrete');
});

test('the doc distinguishes nexora’s develop from junoui having one', () => {
  // scripts/consumer-gate.mjs mentions `develop` and `ios/develop` a dozen
  // times. They are the CONSUMER's branches. Without this note the next reader
  // greps, finds them, and concludes junoui has a develop after all.
  assert.match(doc, /are \*\*nexora's\*\*, not junoui's/);
});

test('no other workflow acts on a branch the model does not name', () => {
  // pages.yml deploys the showcase on push to main. If a workflow ever acts on
  // a branch this repo says does not exist, one of the two is wrong.
  for (const wf of ['pages.yml', 'visual-baselines.yml']) {
    const yaml = readFileSync(`.github/workflows/${wf}`, 'utf8');
    for (const b of triggerBranches(yaml).flat()) {
      assert.equal(b, 'main', `${wf} acts on "${b}", which docs/branching.md does not name`);
    }
  }
});
