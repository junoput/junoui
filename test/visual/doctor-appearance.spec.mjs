// The doctor's appearance checks, driven end to end (20260901-065).
//
// WHY THIS FILE EXISTS. A geovista terrain fix landed the same afternoon that
// passed its tests, improved both watched metrics, and shattered the far field
// of the frame. It was caught by looking at the render. The conformance kit's
// whole claim is that a consumer should not have to re-derive correctness by
// hand — so the honest question is which of its checks a wrong screen can pass.
//
// Every check in the kit answers a question about GEOMETRY, PRESENCE or TEXT.
// None of them looks at what is painted. This file closes the part of that gap
// that is cheap and certain — an element that occupies space and cannot be seen
// or tapped — and `docs/appearance.md` states the part that is not.
//
// Driven through a browser rather than over fixtures because the mechanism
// under test is `elementFromPoint`, and a fixture asserting my idea of what it
// returns would be a test of my idea.
import { expect, test } from '@playwright/test';
import { chromium } from 'playwright';
import { writeFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { runDoctor } from '../../tools/doctor.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const css = readFileSync(join(ROOT, 'dist/css/juno.css'), 'utf8');

function fixture(body) {
  const dir = mkdtempSync(join(tmpdir(), 'juno-appearance-'));
  const file = join(dir, 'index.html');
  writeFileSync(
    file,
    `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
     <style>${css}</style>${body}`,
  );
  return pathToFileURL(file).href;
}

const RAIL = `<nav class="juno-rail juno-rail--responsive"><a class="juno-rail__item" href="#"><span class="juno-icon"></span></a></nav>`;
const DOCK = `<nav class="juno-dock juno-dock--pill juno-dock--responsive"><a class="juno-dock__item" href="#"><span class="juno-dock__bubble"></span></a></nav>`;
const NAV = RAIL + DOCK;

const run = (url, profiles = ['desktop']) =>
  runDoctor({ url, profiles, allowed: [], json: false }, { chromium });
const findings = async (body, profiles) =>
  (await run(fixture(body), profiles)).results.flatMap((r) => r.findings);

test('a conformant page still reports nothing', async () => {
  // The control. Without it every case below passes against a probe that
  // simply fires on everything, which is the failure mode of a new check.
  const f = await findings(NAV + `<button style="inline-size:44px;block-size:44px">ok</button>`);
  expect(f, f.join('\n')).toEqual([]);
});

// ── the three cheap invisibilities ───────────────────────────────────────
// Each is a control of exactly the right SIZE. The tap-floor check calls all
// three fine, which is the point.

for (const [name, style] of [
  ['visibility:hidden', 'visibility:hidden'],
  ['opacity:0', 'opacity:0'],
  ['an ancestor with opacity:0', null],
]) {
  test(`a 44px control is reported when it is invisible via ${name}`, async () => {
    const btn = `<button aria-label="ghost" style="inline-size:44px;block-size:44px${
      style ? ';' + style : ''
    }">x</button>`;
    const body = NAV + (style ? btn : `<div style="opacity:0">${btn}</div>`);
    const f = await findings(body);
    expect(f.join(' ')).toMatch(/laid out but not on screen: ghost 44x44/);
    // ...and NOT as a short target, because it is not short. Two questions.
    expect(f.join(' ')).not.toMatch(/below the floor/);
  });
}

test('a 44px control covered by an overlay is reported', async () => {
  // The one a geometry probe is most likely to certify: correct size, correct
  // position, painted underneath something.
  const f = await findings(
    NAV +
      `<button aria-label="buried" style="position:fixed;inset-block-start:100px;inset-inline-start:10px;inline-size:44px;block-size:44px">x</button>
       <div style="position:fixed;inset:0;background:#000;z-index:var(--juno-z-overlay)"></div>`,
  );
  expect(f.join(' ')).toMatch(/laid out but not on screen: buried 44x44 — covered at its centre/);
});

test('a control under a scrim that ignores the pointer is NOT reported', async () => {
  // pointer-events:none means the scrim is not between the finger and the
  // control, and elementFromPoint agrees. A check that flagged this would be
  // noise on every app with a decorative overlay, and a noisy probe is one
  // nobody runs.
  const f = await findings(
    NAV +
      `<button aria-label="fine" style="position:fixed;inset-block-start:100px;inset-inline-start:10px;inline-size:44px;block-size:44px">x</button>
       <div style="position:fixed;inset:0;pointer-events:none"></div>`,
  );
  expect(f, f.join('\n')).toEqual([]);
});

test('a control whose own child paints over it is NOT reported', async () => {
  // elementFromPoint returns the descendant. That is still the control.
  const f = await findings(
    NAV +
      `<button aria-label="wrapped" style="inline-size:44px;block-size:44px"><span style="display:block;inline-size:100%;block-size:100%"></span></button>`,
  );
  expect(f, f.join('\n')).toEqual([]);
});

// ── navigation presence is now about paint, not about display ────────────

test('a navigation buried under an overlay counts as no navigation', async () => {
  // Before this, `display !== 'none'` plus a rect called it present. A dock
  // nobody can see or press is not navigation, and reporting it as present is
  // the probe certifying a broken screen.
  //
  // The overlay uses --juno-z-overlay (4000) and not a literal: the first
  // version of this fixture used 99, one below the dock's own --juno-z-raised
  // (100), so the dock was never covered and the test failed for a reason that
  // had nothing to do with the check. Reading the token beat guessing a number.
  const f = await findings(
    NAV +
      `<div style="position:fixed;inset:0;background:#000;z-index:var(--juno-z-overlay)"></div>`,
    ['phone'],
  );
  expect(f.join(' ')).toMatch(/no primary navigation is visible/);
});

test('a navigation at opacity 0 counts as no navigation', async () => {
  const f = await findings(
    RAIL + `<nav class="juno-dock juno-dock--pill juno-dock--responsive" style="opacity:0"></nav>`,
    ['phone'],
  );
  expect(f.join(' ')).toMatch(/no primary navigation is visible/);
});
