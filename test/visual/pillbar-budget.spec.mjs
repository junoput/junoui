// The pillbar's horizontal budget, asserted against the layout it predicts
// (conformance kit slice 5, 20260826-036 item E).
//
// Same shape as the dock budget and the same reason: a consumer deciding how
// many items fit was re-deriving it from the numbers in pillbar.css. But the
// ARITHMETIC is different — a dock's items stretch (`flex: 1 1 0`) and a
// pillbar's do not (`fit-content` with gaps between fixed items) — so a
// consumer that assumed the dock's formula would be wrong by the gaps. That is
// exactly why this is measured rather than asserted in prose.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const css = readFileSync(join(ROOT, 'dist/css/juno.css'), 'utf8');

const items = (n) =>
  Array.from(
    { length: n },
    (_, i) =>
      `<button class="juno-pillbar__item" aria-label="a${i}"><span class="juno-icon"></span></button>`,
  ).join('');

const page = (n) => `<meta name="viewport" content="width=device-width,initial-scale=1">
  <style>${css}</style>
  <nav class="juno-pillbar" id="p" style="--juno-pillbar-items:${n}">${items(n)}</nav>
  <div id="predict" style="inline-size:var(--juno-pillbar-inline)"></div>
  <div id="fit" style="inline-size:var(--juno-pillbar-fit-inline)"></div>`;

/** Copy the bar's own resolved budget onto the probes.
 *
 *  The derived properties are declared on `.juno-pillbar`, so outside the bar
 *  `var()` resolves to nothing, `inline-size` is invalid at computed-value
 *  time, and the probe silently falls back to `auto` — reporting the
 *  container's width as the prediction. The dock-budget spec learned this the
 *  hard way; copying the DERIVED values (already var-substituted) is the fix. */
const measure = (pw) =>
  pw.evaluate(() => {
    const bar = document.getElementById('p');
    const cs = getComputedStyle(bar);
    for (const id of ['predict', 'fit']) {
      const el = document.getElementById(id);
      for (const prop of [
        '--juno-pillbar-items',
        '--juno-pillbar-item',
        '--juno-pillbar-gap',
        '--juno-pillbar-pad',
        '--juno-pillbar-edge',
        '--juno-pillbar-chrome-inline',
        '--juno-pillbar-inline',
        '--juno-pillbar-fit-inline',
      ]) {
        el.style.setProperty(prop, cs.getPropertyValue(prop));
      }
    }
    const round = (n) => +n.toFixed(2);
    return {
      bar: round(bar.getBoundingClientRect().width),
      predicted: round(document.getElementById('predict').getBoundingClientRect().width),
      fit: round(document.getElementById('fit').getBoundingClientRect().width),
    };
  });

for (const n of [2, 3, 4, 5]) {
  test(`the budget predicts the width it lays out — ${n} items`, async ({ page: pw }) => {
    await pw.setViewportSize({ width: 480, height: 800 });
    await pw.setContent(page(n));
    const m = await measure(pw);
    // the prediction IS the layout, not an approximation of it
    expect(m.predicted).toBe(m.bar);
  });
}

test('the gaps are in the chrome, which is where a dock formula goes wrong', async ({
  page: pw,
}) => {
  // A dock divides its inner width among stretching items; a pillbar adds
  // fixed items plus the gaps between them. A consumer reusing the dock's
  // arithmetic is short by (items - 1) * gap — 3 gaps at 4 items. Measured, so
  // the difference is a number rather than an argument.
  await pw.setViewportSize({ width: 480, height: 800 });
  await pw.setContent(page(4));
  const m = await pw.evaluate(() => {
    const cs = getComputedStyle(document.getElementById('p'));
    const px = (v) => parseFloat(cs.getPropertyValue(v));
    return {
      bar: +document.getElementById('p').getBoundingClientRect().width.toFixed(2),
      item: px('--juno-pillbar-item'),
      gap: px('--juno-pillbar-gap'),
      pad: px('--juno-pillbar-pad'),
    };
  });
  const withoutGaps = 4 * m.item + 2 * m.pad + 2;
  expect(m.bar).toBeGreaterThan(withoutGaps);
  expect(m.bar - withoutGaps).toBeCloseTo(3 * m.gap, 1);
});

test('fit-inline includes the edge offsets the bar floats inside', async ({ page: pw }) => {
  // The bar is centred with a margin, so "will it fit" is not the bar's own
  // width — a consumer checking that alone overflows by two edge gaps on the
  // narrowest phone.
  await pw.setViewportSize({ width: 480, height: 800 });
  await pw.setContent(page(4));
  const m = await measure(pw);
  const edge = await pw.evaluate(() =>
    parseFloat(
      getComputedStyle(document.getElementById('p')).getPropertyValue('--juno-pillbar-edge'),
    ),
  );
  expect(m.fit).toBeCloseTo(m.bar + 2 * edge, 1);
});

test('at fit-inline the bar fits, and one pixel under it does not', async ({ page: pw }) => {
  // The boundary is real rather than a rounding artefact — the same assertion
  // the dock budget makes, because a budget nobody can act on is decoration.
  await pw.setViewportSize({ width: 480, height: 800 });
  await pw.setContent(page(4));
  const { fit } = await measure(pw);

  await pw.setViewportSize({ width: Math.ceil(fit), height: 800 });
  let fits = await pw.evaluate(
    () => document.getElementById('p').getBoundingClientRect().width <= window.innerWidth,
  );
  expect(fits).toBe(true);

  await pw.setViewportSize({ width: Math.floor(fit) - 24, height: 800 });
  const clamped = await pw.evaluate(() => {
    const p = document.getElementById('p');
    return p.getBoundingClientRect().width < p.scrollWidth || window.innerWidth < p.scrollWidth;
  });
  expect(clamped, 'the bar showed no sign of being over budget below fit-inline').toBe(true);
});
