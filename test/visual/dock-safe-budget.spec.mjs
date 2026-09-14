// The dock's published item budget must describe the SAFE width (20260914-066).
//
// `--juno-dock-avail` feeds `--juno-dock-item-inline`, which exists so a
// consumer can decide how many items fit without re-deriving the arithmetic
// (20260815-055). It was `100vw`, and `100vw` spans under the sensor housing in
// landscape — so the number junoui publishes was larger than the room that
// exists, and a consumer trusting it fits one item too many.
//
// Same shape as the pillbar's width cap (20260914-059), found by sweeping for it
// rather than by waiting for the next consumer report. It is NOT one of
// docs/safe-area.md's three buckets: those answer "how far from the edge should
// this sit", and this answers "how much room is there between the housings".
//
// WHAT THIS DOES NOT TEST, because it is not fixed. The bar itself still paints
// full-bleed under the housing at the viewport root. That half cannot be fixed
// by padding the bar — the dock is the edge-padding bucket, and `.juno-app-shell`
// already pads by the same two insets, so an unconditional padding double-pads
// when nested. 20260914-066 carries it as a decision. The assertions below are
// deliberately about the BUDGET only, so nobody reads a green here as covering
// the rendering.
//
// The insets are driven by hand: real `env(safe-area-inset-*)` is 0 in headless
// chromium, so a spec that merely loads the page measures no difference and
// "proves" the fix unnecessary.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const CSS = readFileSync(join(ROOT, 'dist/css/juno.css'), 'utf8');

const VW = 844;
const INSET = 59; // iPhone landscape sensor housing
const ITEMS = 5;

const page = (safe) => `<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${CSS}</style>
<style>:root{--juno-safe-left:${safe}px;--juno-safe-right:${safe}px;}</style>
<nav class="juno-dock juno-dock--fixed" id="dock">${Array.from(
  { length: ITEMS },
  (_, i) =>
    `<a class="juno-dock__item" href="#"><span class="juno-icon"></span><span class="juno-dock__label">a${i}</span></a>`,
).join('')}</nav>
<div id="avail" style="block-size:1px"></div>
<div id="item" style="block-size:1px"></div>`;

/**
 * Read the budget by letting the browser resolve it onto a probe.
 *
 * The derived properties are declared on `.juno-dock`, so outside the bar
 * `var()` resolves to nothing and `inline-size` falls back to `auto` — the
 * probe would then report its container's width as the prediction, which is a
 * plausible wrong number rather than an error. Copying the resolved values
 * across is the fix dock-budget.spec.mjs already uses.
 */
const budget = (pw) =>
  pw.evaluate(() => {
    const cs = getComputedStyle(document.getElementById('dock'));
    const put = (id, prop) => {
      const el = document.getElementById(id);
      el.style.setProperty('inline-size', cs.getPropertyValue(prop));
      return Math.round(el.getBoundingClientRect().width * 100) / 100;
    };
    return {
      avail: put('avail', '--juno-dock-avail'),
      item: put('item', '--juno-dock-item-inline'),
    };
  });

test('the budget is the safe width, not the viewport width', async ({ page: pw }) => {
  await pw.setViewportSize({ width: VW, height: 390 });
  await pw.setContent(page(INSET));
  const b = await budget(pw);

  expect(b.avail, 'the budget still spans under both housings').toBe(VW - 2 * INSET);
  expect(b.item, 'the per-item figure does not follow the budget').toBeCloseTo(
    (VW - 2 * INSET) / ITEMS,
    1,
  );

  // The number this fix exists to stop anyone publishing. Stated as its own
  // assertion so a future change that quietly restores it fails with the reason
  // rather than with an arithmetic mismatch.
  expect(b.avail, 'the budget is back to raw 100vw').not.toBe(VW);
});

test('with no insets the budget is unchanged, so nothing moves on a device without them', async ({
  page: pw,
}) => {
  // The quiet side. A fix that subtracted a constant, or that shed the insets
  // twice, would shrink every desktop dock's budget — and the loud test above
  // cannot see that, because it only ever runs with insets present.
  await pw.setViewportSize({ width: VW, height: 390 });
  await pw.setContent(page(0));
  const b = await budget(pw);
  expect(b.avail, 'with zero insets the budget must still be the full viewport').toBe(VW);
  expect(b.item).toBeCloseTo(VW / ITEMS, 1);
});
