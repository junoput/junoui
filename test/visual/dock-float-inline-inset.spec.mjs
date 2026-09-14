// The dock's FLOATING variants must clear both horizontal insets (20260914-067).
//
// `--pill` and `--float` wrote `margin: 0 var(--juno-dock-margin-inline)
// var(--juno-dock-edge-offset)`. The block term sheds its inset by construction
// (base.css); the inline term was a flat `--juno-space-12`. So one axis of one
// declaration was safe-area aware and the other was not — the same asymmetry the
// pillbar had, where the corner variants positioned correctly and the width did
// not (20260914-059).
//
// Measured before the fix at 844x390 with 59px insets: bar 12..832, first item's
// leading edge at 17, against a housing ending at 59.
//
// UNCONDITIONAL, unlike the base bar. These variants are `position: fixed;
// inset-inline: 0`, so they sit against the viewport whatever they are nested
// in, and there is no double-padding case to decide. The in-flow base bar does
// have one and is deliberately not covered here — see 20260914-066, and do not
// read a green in this file as covering it.
//
// Insets are driven by hand: real `env()` is 0 in headless chromium.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const CSS = readFileSync(join(ROOT, 'dist/css/juno.css'), 'utf8');

const VW = 844;
const INSET = 59;
const GAP = 12; // --juno-space-12, the design margin these variants declare

const page = (safe, variant) => `<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${CSS}</style>
<style>:root{--juno-safe-left:${safe}px;--juno-safe-right:${safe}px;}</style>
<nav class="juno-dock ${variant}" id="d">${Array.from(
  { length: 5 },
  (_, i) =>
    `<a class="juno-dock__item" href="#" aria-label="a${i}"><span class="juno-icon"></span><span class="juno-dock__label">a${i}</span></a>`,
).join('')}</nav>`;

const box = (pw) =>
  pw.evaluate(() => {
    const bar = document.getElementById('d');
    const b = bar.getBoundingClientRect();
    const items = [...bar.querySelectorAll('.juno-dock__item')];
    const f = items[0].getBoundingClientRect();
    const l = items[items.length - 1].getBoundingClientRect();
    return {
      left: Math.round(b.left),
      right: Math.round(b.right),
      firstLeft: Math.round(f.left),
      lastRight: Math.round(l.right),
    };
  });

for (const variant of ['juno-dock--pill', 'juno-dock--float']) {
  test(`${variant} clears both housings in landscape`, async ({ page: pw }) => {
    await pw.setViewportSize({ width: VW, height: 390 });
    await pw.setContent(page(INSET, variant));
    const r = await box(pw);

    // The bar's own edges, which is what the margin controls.
    expect(r.left, 'the bar starts under the left housing').toBe(INSET + GAP);
    expect(r.right, 'the bar ends under the right housing').toBe(VW - INSET - GAP);

    // And the thing a user actually touches. The bar could clear the housing
    // while an item overhung it; asserting only the bar would not see that.
    expect(r.firstLeft, 'the first item is under the left housing').toBeGreaterThanOrEqual(INSET);
    expect(r.lastRight, 'the last item is under the right housing').toBeLessThanOrEqual(VW - INSET);
  });

  test(`${variant} is unchanged where there are no insets`, async ({ page: pw }) => {
    // The quiet side: with zero insets the margin must still be the plain design
    // gap. A fix that added a constant, or that applied an inset twice, would
    // move every desktop dock — and the loud test cannot see it.
    await pw.setViewportSize({ width: VW, height: 390 });
    await pw.setContent(page(0, variant));
    const r = await box(pw);
    expect(r.left, 'the design gap changed on a device with no insets').toBe(GAP);
    expect(r.right).toBe(VW - GAP);
  });
}
