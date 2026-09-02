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

test('every branch CI acts on is main, and nothing else', () => {
  const lists = triggerBranches(ci);
  assert.ok(lists.length > 0, 'ci.yml declares no branch filters at all');
  const named = new Set(lists.flat());
  assert.deepEqual(
    [...named],
    ['main'],
    'ci.yml names a branch other than main — document it in docs/branching.md ' +
      'or remove it, but do not leave a branch that CI half-knows about',
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

test('the doc keeps the residual: the CLASS is not closed by the deletion', () => {
  // Deleting one branch removes one trap. Any other base still gets zero checks
  // while the pull_request trigger is filtered, and that is an operator change.
  // A doc that claimed the problem was solved would be the more dangerous
  // outcome of this ticket.
  assert.match(doc, /does not close the class/i);
  assert.match(doc, /pull_request` trigger is filtered/);
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
