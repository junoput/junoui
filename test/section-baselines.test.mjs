// Baseline bookkeeping for section-scoped shots (20260826-006).
//
// THE DISTINCTION THIS FILE EXISTS TO MAKE LOUD, because it is the whole
// reason these baselines drifted for months before (ci.yml, 20260815-011):
//
//   A baseline that never existed  -> RECORD IT. Nothing is being overwritten,
//                                     there is no prior picture to compare
//                                     against, and no judgement is involved.
//   A baseline that CHANGED        -> A HUMAN LOOKS FIRST. Something that used
//                                     to render one way now renders another,
//                                     and only a person can say whether that
//                                     was the intent.
//
// Playwright already distinguishes them ("A snapshot doesn't exist … writing
// actual" versus a pixel-diff failure), but only in the log of a browser job
// that takes two minutes and is read after the fact. This runs in `npm test`,
// in milliseconds, with no browser — so "you added a section and owe a new
// baseline" is stated before the visual suite is ever reached, and is never
// confused with "a picture moved".
//
// It covers the SECTION shots only. Full-page baselines cannot be enumerated
// from source (they depend on overlay state, viewports and projects), so this
// deliberately does not claim to audit them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { sectionShotName } from './visual/helpers.mjs';

const SHOTS = 'test/visual/__screenshots__';
const MODES = ['dark', 'light'];
const PLATFORM = 'linux'; // the platform CI checks; darwin is updated locally

/** Every `data-vr-shot` id declared in the showcase, by page. */
function declared() {
  const out = [];
  for (const file of readdirSync('showcase').filter((f) => f.endsWith('.html'))) {
    const page = file.replace(/\.html$/, '');
    const html = readFileSync(join('showcase', file), 'utf8');
    for (const m of html.matchAll(/<section[^>]*\sdata-vr-shot="([^"]+)"/g)) {
      out.push({ page, id: m[1] });
    }
  }
  return out;
}

/** The audit, as a pure function over two sets.
 *
 *  Separated from the filesystem so it can be tested on SYNTHETIC input. On a
 *  healthy tree there are no orphans and nothing missing, so `orphans = []` and
 *  `missing = []` are indistinguishable from the real thing — mutation showed
 *  both directions could be deleted with the suite staying green. A comparison
 *  is only evidence where its subjects are allowed to disagree. */
export function auditBaselines({ expected, onDisk }) {
  const want = new Set(expected);
  const have = new Set(onDisk);
  return {
    missing: expected.filter((f) => !have.has(f)),
    orphans: [...have].filter((f) => isSectionShot(f) && !want.has(f)),
  };
}

const expected = declared().flatMap(({ page, id }) =>
  MODES.map((mode) => sectionShotName(page, id, mode).replace(/\.png$/, `-${PLATFORM}.png`)),
);
const onDisk = new Set(readdirSync(SHOTS));

/** Section shots live in their own `section-` namespace, so telling them from
 *  full-page baselines is a prefix test rather than a heuristic over the stem.
 *  The first version of this audit tried to guess — it had to decide whether
 *  `mobile-phone-dark` was a viewport variant or a section called `phone` — and
 *  claimed `index-auto-dark-linux.png` as an orphan on its first run. */
const isSectionShot = (file) => file.startsWith('section-') && file.endsWith(`-${PLATFORM}.png`);

test('a declared section id is unique within its page', () => {
  // Two sections sharing an id write the same file: the second overwrites the
  // first and a component loses its picture with nothing going red.
  const seen = new Set();
  for (const { page, id } of declared()) {
    const key = `${page}/${id}`;
    assert.ok(!seen.has(key), `two sections on ${page} both declare data-vr-shot="${id}"`);
    seen.add(key);
  }
});

test('every declared section has a baseline — a missing one is NEW, and recording it is safe', () => {
  const { missing } = auditBaselines({ expected, onDisk: [...onDisk] });
  assert.deepEqual(
    missing,
    [],
    `NEW BASELINE(S) NEEDED — nothing is being overwritten, so recording these is the safe case:\n` +
      missing.map((f) => `    ${f}`).join('\n') +
      `\n  Record on the runner (the visual-baselines workflow, or the visual-diff-report\n` +
      `  artifact of a failing run), NEVER locally: baselines are pinned to ubuntu-24.04 and a\n` +
      `  local render encodes this machine's fonts.\n\n` +
      `  EXPECTED ONCE per new section: a baseline can only be recorded from a run that\n` +
      `  rendered it, so the first push of a section is red here and in the visual job, and\n` +
      `  green on the next. That is a bootstrap, not a defect — but it is red for a REASON\n` +
      `  you can act on, which is why it is not silenced.\n\n` +
      `  This is NOT the same as a baseline that CHANGED — that one needs a human to look first.`,
  );
});

test('every section baseline still has a section declaring it', () => {
  // The other direction, which nothing else checks. A renamed or deleted
  // section leaves its picture behind, and a stale baseline is worse than none:
  // it is a green check over a component that no longer exists.
  const { orphans } = auditBaselines({ expected, onDisk: [...onDisk] });
  assert.deepEqual(
    orphans,
    [],
    `section baselines with no declaring section — delete them or restore the section:\n` +
      orphans.map((f) => `    ${f}`).join('\n'),
  );
});

test('the audit can tell a section shot from a full-page one, in both directions', () => {
  // Without both directions the orphan check either claims every full-page
  // baseline or nothing at all, and in both cases it is inert.
  assert.equal(isSectionShot('section-mobile-fold-slot-dark-linux.png'), true);
  assert.equal(isSectionShot('mobile-dark-linux.png'), false);
  assert.equal(isSectionShot('mobile-phone-coarse-dark-linux.png'), false);
  assert.equal(
    isSectionShot('index-auto-dark-linux.png'),
    false,
    'the file that broke the first version',
  );
  assert.equal(
    isSectionShot('section-mobile-fold-slot-dark-darwin.png'),
    false,
    'darwin is not the checked platform',
  );
});

test('the audit reports both directions on synthetic input', () => {
  // The self-test, and it exists because mutation found it missing: on a
  // healthy tree `missing = []` and `orphans = []` are true whatever the code
  // does, so deleting either direction survived the whole suite. Here they are
  // fed a tree that HAS both, where a broken audit cannot agree by accident.
  const got = auditBaselines({
    expected: ['section-mobile-fold-slot-dark-linux.png', 'section-mobile-gone-dark-linux.png'],
    onDisk: [
      'section-mobile-fold-slot-dark-linux.png',
      'section-mobile-stale-dark-linux.png',
      'mobile-dark-linux.png',
    ],
  });
  assert.deepEqual(
    got.missing,
    ['section-mobile-gone-dark-linux.png'],
    'the MISSING direction is dead',
  );
  assert.deepEqual(
    got.orphans,
    ['section-mobile-stale-dark-linux.png'],
    'the ORPHAN direction is dead',
  );
});

test('the audit and the shot builder share one filename rule', () => {
  // Not two copies that agree today: shootSection and this file both call
  // sectionShotName. Mutation showed a second copy here stayed green when the
  // helper dropped its prefix.
  assert.equal(sectionShotName('mobile', 'fold-slot', 'dark'), 'section-mobile-fold-slot-dark.png');
  assert.ok(
    isSectionShot(sectionShotName('mobile', 'fold-slot', 'dark').replace(/\.png$/, '-linux.png')),
  );
});
