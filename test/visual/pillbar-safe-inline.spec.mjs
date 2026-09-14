// The corner pillbar must not run under a horizontal sensor housing (20260914-059).
//
// Found by nexora, which carried an override for it (20260909-126, override C):
// "In landscape, 100vw still spans under the sensor housing, so a cap that
// knows nothing about the HORIZONTAL insets lets the pill run under it."
//
// The corner variants POSITION themselves correctly — `--top-right` already
// sheds `--juno-safe-right` from its own edge. What was unbounded was the
// WIDTH: `max-inline-size: calc(100% - 2 * edge)`, and for a `position: fixed`
// element `100%` is the viewport, insets included. So the right edge landed
// correctly and the pill grew leftward past the housing.
//
// WHY THIS IS A BROWSER TEST AND NOT A UNIT TEST. The bug is a resolved layout
// value; nothing in the stylesheet text says whether the pill ends up on screen.
// Measured before the fix at 844x390 with 59px insets: cap 812px, width 812px,
// LEFT EDGE AT -39px — off-screen entirely, not merely under the housing.
//
// AND WHY THE INSETS ARE SET BY HAND. `env(safe-area-inset-*)` is 0 in headless
// chromium, so a probe that just loads the page sees no insets, measures no
// difference, and "proves" the fix unnecessary. The custom properties base.css
// derives from env() are driven directly instead — the same values, without
// needing a notched device.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const CSS = readFileSync(join(ROOT, 'dist/css/juno.css'), 'utf8');
const INSET = 59; // iPhone landscape sensor housing, the case nexora hit

/**
 * Enough items that `fit-content` exceeds the cap, so the cap is what governs.
 *
 * Icon children rather than text, as in pillbar-budget.spec.mjs: an icon is a
 * fixed box, so the natural width does not move with font metrics. A text
 * label would make the fixture's own precondition — that the cap binds —
 * depend on whichever freetype the machine has.
 */
const page = (safe) => `<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${CSS}</style>
<style>:root{--juno-safe-left:${safe}px;--juno-safe-right:${safe}px;}</style>
<div class="juno-pillbar juno-pillbar--top-right" id="pill">${Array.from(
  { length: 24 },
  (_, i) =>
    `<button class="juno-pillbar__item" aria-label="a${i}"><span class="juno-icon"></span></button>`,
).join('')}</div>`;

const box = (pw) =>
  pw.evaluate(() => {
    const r = document.getElementById('pill').getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) };
  });

test('landscape: the pill stays inside both horizontal insets when the cap binds', async ({
  page: pw,
}) => {
  await pw.setViewportSize({ width: 844, height: 390 });
  await pw.setContent(page(INSET));
  const r = await box(pw);

  // The fixture only means anything if the cap is actually governing — with a
  // pill narrower than the cap this would pass while testing nothing.
  expect(r.width, 'fixture assumption: the cap should be binding').toBeGreaterThan(600);

  expect(r.left, 'the pill runs under (or past) the left housing').toBeGreaterThanOrEqual(INSET);
  expect(r.right, 'the pill runs under the right housing').toBeLessThanOrEqual(844 - INSET);
});

test('no insets: the cap is unchanged, so nothing shifts on a device without them', async ({
  page: pw,
}) => {
  // The quiet side. A fix that shed the insets unconditionally — or that
  // subtracted a wrong constant — would shrink the pill on every desktop, and
  // the loud test above cannot see that.
  await pw.setViewportSize({ width: 844, height: 390 });
  await pw.setContent(page(0));
  const r = await box(pw);
  const edge = 2 * 16; // --juno-pillbar-edge on both sides
  expect(r.width, 'with zero insets the cap must be the old 100% - 2*edge').toBe(844 - edge);
});
