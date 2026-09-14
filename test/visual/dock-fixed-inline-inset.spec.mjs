// `.juno-dock--fixed` must keep its items out of the housings (20260914-070).
//
// It is `position: fixed; inset-inline: 0`, so it escapes any ancestor's padding
// box and sits against the viewport whatever it is nested in. That makes the
// inset unconditional — the same argument that made `--pill`/`--float`
// unconditional in 20260914-067, which is where this should have been caught.
// It was missed because that ticket enumerated "the FLOATING variants", and the
// property that matters is "positioned against the viewport".
//
// THE FIX IS A DIFFERENT BUCKET FROM ITS SIBLINGS' and the tests below are
// shaped by that. `--pill`/`--float` take the inset in their MARGIN, so the
// whole bar moves inward. This bar is full-bleed by design: its background must
// keep spanning edge to edge, or a bar stopping short of the housing reads as
// broken. So the inset is PADDING, the bar's box stays the full viewport, and
// asserting the bar had moved would be asserting a regression.
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
const ITEMS = 5;

const items = () =>
  Array.from(
    { length: ITEMS },
    (_, i) =>
      `<a class="juno-dock__item" href="#" aria-label="a${i}"><span class="juno-icon"></span><span class="juno-dock__label">a${i}</span></a>`,
  ).join('');

/** `nested` puts the bar inside a shell that has ALREADY padded by both insets. */
const page = (safe, nested) => {
  const bar = `<nav class="juno-dock juno-dock--fixed" id="d">${items()}</nav>`;
  return `<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${CSS}</style>
<style>:root{--juno-safe-left:${safe}px;--juno-safe-right:${safe}px;}</style>
${nested ? `<div class="juno-app-shell"><main class="juno-app-shell__main">${bar}</main></div>` : bar}`;
};

const box = (pw) =>
  pw.evaluate(() => {
    const bar = document.getElementById('d');
    const b = bar.getBoundingClientRect();
    const all = [...bar.querySelectorAll('.juno-dock__item')];
    return {
      barLeft: Math.round(b.left),
      barRight: Math.round(b.right),
      firstLeft: Math.round(all[0].getBoundingClientRect().left),
      lastRight: Math.round(all[all.length - 1].getBoundingClientRect().right),
    };
  });

for (const nested of [false, true]) {
  const where = nested ? 'inside an app-shell that already padded' : 'at the viewport root';

  test(`--fixed keeps its items out of both housings, ${where}`, async ({ page: pw }) => {
    // The nested arm is the one that matters. A reader could reasonably expect
    // the shell's own padding to cover this; it cannot, because a fixed element
    // is not laid out inside it. Before the fix BOTH arms read 0..844.
    await pw.setViewportSize({ width: VW, height: 390 });
    await pw.setContent(page(INSET, nested));
    const r = await box(pw);

    expect(r.firstLeft, 'the first item is under the left housing').toBeGreaterThanOrEqual(INSET);
    expect(r.lastRight, 'the last item is under the right housing').toBeLessThanOrEqual(VW - INSET);

    // The bar itself must NOT have moved: full-bleed is the design, and a fix
    // that shrank the box would be a regression wearing the shape of a fix.
    expect(r.barLeft, 'the bar stopped being full-bleed').toBe(0);
    expect(r.barRight, 'the bar stopped being full-bleed').toBe(VW);
  });
}

test('--fixed is unchanged where there are no insets', async ({ page: pw }) => {
  // The quiet side: with zero insets the items must reach the bar's own edges,
  // or this fix has cost every desktop dock its first and last item's width.
  await pw.setViewportSize({ width: VW, height: 390 });
  await pw.setContent(page(0, false));
  const r = await box(pw);
  expect(r.barLeft).toBe(0);
  expect(r.barRight).toBe(VW);
  expect(r.firstLeft, 'an inset was applied where there is none').toBe(0);
  expect(r.lastRight, 'an inset was applied where there is none').toBe(VW);
});
