// BOTH SIDES OF THE SWITCH (20260914-156).
//
// `test/visual/global-setup.mjs` prints a note explaining that local showcase
// diffs are expected on a dev box. Asserting only that it PRINTS proves the
// code can write to stderr; it says nothing about whether the condition is read
// at all — an unconditional banner and a working one are indistinguishable from
// the loud side. So the quiet side is the load-bearing case here: in CI, where
// the baselines ARE authoritative, the note must not appear, or it teaches
// exactly the wrong thing on the one machine whose failures are real.
import { test } from 'node:test';
import assert from 'node:assert/strict';

/** Runs the setup with CI forced on or off, capturing stderr. */
async function run(ci) {
  const { default: globalSetup } = await import(
    // A fresh module instance per call: the function reads process.env at call
    // time, but importing once and relying on that is a coupling worth not
    // having in a test about conditions.
    `./visual/global-setup.mjs?ci=${ci}`
  );
  const before = process.env.CI;
  const chunks = [];
  const write = process.stderr.write.bind(process.stderr);
  process.stderr.write = (chunk) => {
    chunks.push(String(chunk));
    return true;
  };
  try {
    if (ci) process.env.CI = '1';
    else delete process.env.CI;
    globalSetup();
  } finally {
    process.stderr.write = write;
    if (before === undefined) delete process.env.CI;
    else process.env.CI = before;
  }
  return chunks.join('');
}

test('outside CI it says why a local showcase red is expected', async () => {
  const out = await run(false);
  assert.match(out, /NOT EVIDENCE OF A REGRESSION/);
  assert.match(out, /20260803-001/, 'the note must name the ticket that decided this');
  assert.match(out, /ubuntu-24\.04/, 'the note must name where the baselines come from');
  // And it must point at what IS meaningful locally, or the reader concludes
  // the whole suite is worthless on this box and stops running any of it.
  assert.match(out, /Geometry specs/);

  // The launch-failure hint (20260918-002). It has to name the DISCRIMINATOR —
  // which call threw — rather than only the remedy: "Target page, context or
  // browser has been closed" is printed both when the browser dies at launch
  // and when a page kills it, and a reader who has only the remedy still cannot
  // tell which case they are in.
  assert.match(out, /browserType\.launch:/);
  assert.match(out, /chromium-libs/);

  // BOTH causes of a launch failure, and both sides of the split. The first
  // version named only the missing libraries; the full chrome binary cannot
  // launch on this box even with them staged, so a reader who had staged them
  // was told, in effect, that their failure was impossible (20260918-002).
  assert.match(out, /full chrome binary/i);
  assert.match(out, /chrome-headless-shell/);
  // And the other branch has to be present, or the note explains one case and
  // leaves the reader in the other with nothing.
  assert.match(out, /page\.goto:/);
  assert.match(out, /free memory/i);

  // FONTCONFIG (20260918-002 reopened): a bare page with no date input and no
  // custom CSS crashes identically on this box with no fontconfig config at
  // all, reproduced on a quiet box with 10Gi free — memory pressure is not
  // the only cause, and it is not even the deterministic one. The note must
  // name fontconfig ahead of memory, and the FONTCONFIG_FILE remedy, or a
  // reader with a quiet box and no fontconfig chases the wrong hypothesis.
  assert.match(out, /fontconfig/i);
  assert.match(out, /FONTCONFIG_FILE/);
});

test('in CI it prints nothing at all', async () => {
  // The quiet side. If this ever fails, the banner is unconditional and the one
  // environment whose failures are real is being told to ignore them.
  assert.equal(await run(true), '');
});
