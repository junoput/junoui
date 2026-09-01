// The rail↔dock swap, measured on device profiles rather than argued about
// (conformance kit slice 3, 20260826-036 item C).
//
// The unit test checks the DECISION over a device table. This checks that the
// stylesheet acts on it — that a landscape phone actually loses the rail and a
// coarse kiosk actually keeps it. Those are different claims: a correct
// condition authored into the wrong rule, or shadowed by a later one, passes
// the first and fails here.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const css = readFileSync(join(ROOT, 'dist/css/juno.css'), 'utf8');

const SHELL = `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style>
  <nav class="juno-rail juno-rail--responsive" id="rail" aria-label="Primary">
    <a class="juno-rail__item" href="#" aria-current="page"><span class="juno-icon"></span></a>
  </nav>
  <nav class="juno-dock juno-dock--pill juno-dock--responsive" id="dock" aria-label="Primary">
    <a class="juno-dock__item"><span class="juno-dock__bubble"></span></a>
  </nav>`;

/** Real devices. The whole decision rests on where these fall. */
const PROFILES = [
  { name: 'portrait phone', width: 390, height: 844, coarse: true, rail: false },
  { name: 'landscape phone', width: 844, height: 390, coarse: true, rail: false },
  { name: 'tablet portrait', width: 834, height: 1112, coarse: true, rail: true },
  { name: 'tablet landscape', width: 1112, height: 834, coarse: true, rail: true },
  { name: 'coarse kiosk', width: 2560, height: 1440, coarse: true, rail: true },
  { name: 'laptop', width: 1440, height: 900, coarse: false, rail: true },
  { name: 'narrow desktop window', width: 600, height: 900, coarse: false, rail: true },
];

for (const p of PROFILES) {
  test(`${p.name} ${p.rail ? 'keeps' : 'loses'} the rail`, async ({ browser }) => {
    // A fresh context per profile: hasTouch is what makes (pointer: coarse)
    // match in Chromium, and it cannot be changed on a live page.
    const ctx = await browser.newContext({
      viewport: { width: p.width, height: p.height },
      hasTouch: p.coarse,
      isMobile: p.coarse,
      deviceScaleFactor: 1,
    });
    const pw = await ctx.newPage();
    await pw.setContent(SHELL);

    const seen = await pw.evaluate(() => ({
      coarse: matchMedia('(pointer: coarse)').matches,
      rail: getComputedStyle(document.getElementById('rail')).display !== 'none',
    }));

    // The emulation is proven before the reading: if hasTouch stopped making
    // (pointer: coarse) match, every "loses the rail" case below would pass
    // for the wrong reason.
    expect(seen.coarse, 'the pointer emulation did not apply').toBe(p.coarse);
    expect(seen.rail, `${p.width}x${p.height} coarse=${p.coarse}`).toBe(p.rail);

    await ctx.close();
  });
}

test('rotating a phone crosses the condition in both directions', async ({ browser }) => {
  // The case a width-only rule got wrong, and the reason junoui/pointer ships
  // a listener rather than a one-shot read: this changes WITHOUT a reload.
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
  });
  const pw = await ctx.newPage();
  await pw.setContent(SHELL);
  const railShown = () =>
    pw.evaluate(() => getComputedStyle(document.getElementById('rail')).display !== 'none');

  expect(await railShown()).toBe(false); // portrait
  await pw.setViewportSize({ width: 844, height: 390 });
  expect(await railShown(), 'the rail came back in landscape — the width-only defect').toBe(false);
  await pw.setViewportSize({ width: 390, height: 844 });
  expect(await railShown()).toBe(false);

  await ctx.close();
});

test('the dock and the rail are never both hidden', async ({ browser }) => {
  // The pairing this switch exists to make automatic, and the defect this
  // test caught on its first run: paired with the DOCUMENTED
  // `.juno-hide-from-md`, a landscape phone (844x390) hid the rail (coarse and
  // short) AND the dock (844 >= md), leaving no primary navigation at all.
  // Two conditions that happen to line up on a portrait phone do not line up
  // in landscape. .juno-dock--responsive keys on the inverse of the same one.
  for (const p of PROFILES) {
    const ctx = await browser.newContext({
      viewport: { width: p.width, height: p.height },
      hasTouch: p.coarse,
      isMobile: p.coarse,
      deviceScaleFactor: 1,
    });
    const pw = await ctx.newPage();
    await pw.setContent(SHELL);
    const shown = await pw.evaluate(() => ({
      rail: getComputedStyle(document.getElementById('rail')).display !== 'none',
      dock: getComputedStyle(document.getElementById('dock')).display !== 'none',
    }));
    // EXACTLY one, not at least one. "At least one" passed against a bundle
    // where .juno-dock--responsive did not exist at all — the dock was simply
    // always visible, including on a laptop, and the test reported green. An
    // assertion that a broken build satisfies is not an assertion.
    expect(
      [shown.rail, shown.dock].filter(Boolean).length,
      `${p.name}: rail=${shown.rail} dock=${shown.dock}`,
    ).toBe(1);
    expect(shown.rail, `${p.name} shows the wrong half`).toBe(p.rail);
    await ctx.close();
  }
});
