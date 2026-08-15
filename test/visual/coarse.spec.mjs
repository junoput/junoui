// Visual-regression: the COARSE-POINTER half of the suite.
//
// Runs under the `chromium-coarse` project only (playwright.config.mjs ignores
// showcase.spec.mjs for it, and ignores this file for `chromium`). That
// project supplies hasTouch + isMobile, which is what makes `(pointer: coarse)`
// and `(hover: none)` match in Chromium — resizing a desktop context to a
// phone viewport, which is all showcase.spec.mjs's "phone" cases do, changes
// the width and nothing else. See 20260815-006.
//
// Snapshot names carry a `-coarse` segment: snapshotPathTemplate keys on the
// name + platform only, so a coarse shot named like a desktop one would
// overwrite that baseline.
import { test } from '@playwright/test';
import { MODES, PHONE_OVERLAYS, PHONE_PAGES, openAndShoot, shoot } from './helpers.mjs';

// Guard, not decoration: if the project ever loses its touch flags this fails
// loudly instead of silently re-shooting the fine-pointer rendering into the
// coarse baselines. `hover: none` rides on the same emulation; assert both,
// because the fallbacks in table.css key off hover, not pointer.
test.beforeEach(async ({ page: pw }) => {
  await pw.goto('/showcase/index.html', { waitUntil: 'domcontentloaded' });
  const media = await pw.evaluate(() => ({
    coarse: matchMedia('(pointer: coarse)').matches,
    noHover: matchMedia('(hover: none)').matches,
    touchPoints: navigator.maxTouchPoints,
  }));
  if (!media.coarse || !media.noHover) {
    throw new Error(
      `coarse project is not coarse: ${JSON.stringify(media)} — the touch flags in ` +
        'playwright.config.mjs stopped taking effect, so every snapshot below is a ' +
        'desktop rendering under a coarse name',
    );
  }
});

for (const mode of MODES) {
  for (const page of PHONE_PAGES) {
    test(`${page} (coarse) — ${mode}`, async ({ page: pw }) => {
      await shoot(pw, page, mode, `${page}-phone-coarse-${mode}.png`);
    });
  }

  for (const ov of PHONE_OVERLAYS) {
    test(`overlay ${ov.name} (open, coarse) — ${mode}`, async ({ page: pw }) => {
      await openAndShoot(pw, mode, ov, '-phone-coarse');
    });
  }
}
