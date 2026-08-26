// The dock's horizontal budget, asserted against the layout it predicts.
//
// Why it is published at all (20260826-027): a consumer deciding how many
// items fit — and whether they still hold a tap target — had to re-derive the
// bar's inline geometry from the numbers in dock.css. Two of them did, in
// prose, twice, and both drifted the same way: they subtracted 12px of inline
// padding where the pill actually spends 8 (--juno-space-4 a side, not
// --juno-space-12), so every per-item width came out ~0.8px low. The direction
// was safe and the answer was wrong, which is the worst kind of number to keep
// in a comment.
//
// --juno-dock-item-inline is a PREDICTION: __item is `flex: 1 1 0`, so the
// layout, not the token, decides the width. That is exactly why it is asserted
// against the measured box here — a published derivation nothing checks is the
// hand-derivation problem again, moved upstream.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BUNDLE = join(dirname(dirname(dirname(fileURLToPath(import.meta.url)))), 'dist/css/juno.css');
const css = readFileSync(BUNDLE, 'utf8');

const TAP = 44; // --juno-size-tap-comfortable

const items = (n) =>
  Array.from(
    { length: n },
    (_, i) =>
      `<a class="juno-dock__item" aria-label="item ${i}"><span class="juno-dock__bubble"><span class="juno-icon"></span></span></a>`,
  ).join('');

// A viewport meta is required, not cosmetic: without it an emulated mobile page
// lays out at the UA's 980px default and every width measured here is a
// different bar than the one on the device.
const page = (n, variant) =>
  `<meta name="viewport" content="width=device-width,initial-scale=1">
   <style>${css}</style>
   <nav class="juno-dock ${variant}" id="d" style="--juno-dock-items:${n}">${items(n)}</nav>
   <div id="predict" style="inline-size:var(--juno-dock-item-inline)"></div>
   <div id="fit" style="inline-size:var(--juno-dock-fit-inline)"></div>`;

// The budget lives on .juno-dock, and #predict/#fit are outside it — so they
// read the :root inheritance, not the bar's. Mirror the bar's own values onto
// the probes instead of guessing which variant is mounted.
const measure = (pw) =>
  pw.evaluate(() => {
    const d = document.getElementById('d');
    const cs = getComputedStyle(d);
    for (const id of ['predict', 'fit']) {
      const el = document.getElementById(id);
      // Copy the DERIVED values, not just their inputs: --juno-dock-item-inline
      // is declared on .juno-dock, so outside the bar `var()` resolves to
      // nothing, inline-size is invalid at computed-value time, and the probe
      // silently falls back to `auto` — reporting the container's width as the
      // prediction. A custom property's computed value already has its inner
      // var()s substituted, so what lands on the probe is self-contained.
      for (const p of [
        '--juno-dock-items',
        '--juno-dock-margin-inline',
        '--juno-dock-pad-inline',
        '--juno-dock-border-inline',
        '--juno-dock-avail',
        '--juno-dock-chrome-inline',
        '--juno-dock-item-inline',
        '--juno-dock-fit-inline',
      ]) {
        el.style.setProperty(p, cs.getPropertyValue(p));
      }
    }
    const round = (n) => +n.toFixed(2);
    return {
      item: round(d.querySelector('.juno-dock__item').getBoundingClientRect().width),
      bar: round(d.getBoundingClientRect().width),
      predicted: round(document.getElementById('predict').getBoundingClientRect().width),
      fit: round(document.getElementById('fit').getBoundingClientRect().width),
    };
  });

for (const variant of ['juno-dock--pill', 'juno-dock--float']) {
  for (const width of [320, 390]) {
    for (const n of [3, 4, 5]) {
      test(`${variant} predicts the item width it lays out — ${n} items at ${width}px`, async ({
        page: pw,
      }) => {
        await pw.setViewportSize({ width, height: 800 });
        await pw.setContent(page(n, variant));
        const m = await measure(pw);
        // the prediction IS the layout, not an approximation of it
        expect(m.predicted).toBe(m.item);
        // and the bar really is the viewport less its own inline margin
        expect(m.bar).toBe(width - 24);
      });
    }
  }
}

test('--juno-dock-fit-inline is the width at which the items exactly hold the tap target', async ({
  page: pw,
}) => {
  // The one answer junoui can give exactly: below this, drop an item.
  for (const n of [3, 4, 5]) {
    await pw.setViewportSize({ width: 390, height: 800 });
    await pw.setContent(page(n, 'juno-dock--pill'));
    const { fit } = await measure(pw);
    expect(fit).toBe(n * TAP + 34); // 34 = 2 x (12 margin + 4 padding + 1 border)

    // measured at exactly that viewport, an item is exactly the tap target
    await pw.setViewportSize({ width: fit, height: 800 });
    await pw.setContent(page(n, 'juno-dock--pill'));
    expect((await measure(pw)).item).toBe(TAP);

    // and one pixel narrower it is not — the boundary is real, not a rounding
    await pw.setViewportSize({ width: fit - 1, height: 800 });
    await pw.setContent(page(n, 'juno-dock--pill'));
    expect((await measure(pw)).item).toBeLessThan(TAP);
  }
});

test('the base bar spends no inline chrome, so its items get the whole viewport', async ({
  page: pw,
}) => {
  // The full-bleed variant carries a top-edge border only. A budget that
  // charged it the pill's 34px would under-report every item by 6.8px.
  await pw.setViewportSize({ width: 390, height: 800 });
  await pw.setContent(page(5, ''));
  const m = await measure(pw);
  expect(m.bar).toBe(390);
  expect(m.predicted).toBe(m.item);
  expect(m.item).toBe(390 / 5);
});

test('the published terms are what the bar actually paints', async ({ page: pw }) => {
  // The reason the budget cannot drift from the bar: one declaration feeds
  // both. If a future edit sets the margin/padding/border directly again, the
  // sum keeps reporting the old geometry and nothing else notices.
  await pw.setViewportSize({ width: 390, height: 800 });
  await pw.setContent(page(4, 'juno-dock--pill'));
  const painted = await pw.evaluate(() => {
    const cs = getComputedStyle(document.getElementById('d'));
    const probe = (v) => {
      const el = document.createElement('div');
      el.style.inlineSize = cs.getPropertyValue(v);
      document.body.append(el);
      const w = el.getBoundingClientRect().width;
      el.remove();
      return +w.toFixed(2);
    };
    return {
      marginToken: probe('--juno-dock-margin-inline'),
      padToken: probe('--juno-dock-pad-inline'),
      borderToken: probe('--juno-dock-border-inline'),
      margin: parseFloat(cs.marginLeft),
      pad: parseFloat(cs.paddingLeft),
      border: parseFloat(cs.borderLeftWidth),
    };
  });
  expect(painted.marginToken).toBe(painted.margin);
  expect(painted.padToken).toBe(painted.pad);
  expect(painted.borderToken).toBe(painted.border);
});
