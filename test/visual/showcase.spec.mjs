// Visual-regression: full-page snapshot of every showcase page, dark + light.
// The theme is set the way a real visitor's would persist — via localStorage,
// which app.js reads before first paint (so no flash, deterministic mode).
import { test, expect } from '@playwright/test';

const PAGES = [
  'index',
  'foundations',
  'buttons',
  'forms',
  'data-display',
  'tables',
  'loaders',
  'overlays',
  'alerts',
  'tabs',
  'icons',
  'layout',
  'mobile',
];

// below md the showcase chrome swaps to the junoui mobile kit (navbar +
// pillbar) — snapshot a couple of pages at a phone viewport too
const PHONE_PAGES = ['index', 'mobile'];
const PHONE_VIEWPORT = { width: 390, height: 844 };

const MODES = ['dark', 'light'];

async function shoot(pw, page, mode, name) {
  // seed the persisted theme before any script runs
  await pw.addInitScript((m) => {
    localStorage.setItem('juno:mode', m);
    localStorage.setItem('juno:palette', 'standard');
    localStorage.setItem('juno:density', 'comfortable');
    localStorage.setItem('juno:text', 'base');
  }, mode);

  await pw.goto(`/showcase/${page}.html`, { waitUntil: 'networkidle' });
  // fonts must be in before we shoot, or metrics shift the layout
  await pw.evaluate(() => document.fonts.ready);

  await expect(pw).toHaveScreenshot(name, {
    fullPage: true,
    // JS-updated widgets drift between runs — mask them out
    mask: [pw.locator('#clock'), pw.locator('[data-prog]'), pw.locator('[data-pct]')],
  });
}

for (const mode of MODES) {
  for (const page of PAGES) {
    test(`${page} — ${mode}`, async ({ page: pw }) => {
      await shoot(pw, page, mode, `${page}-${mode}.png`);
    });
  }
  for (const page of PHONE_PAGES) {
    test(`${page} (phone) — ${mode}`, async ({ page: pw }) => {
      await pw.setViewportSize(PHONE_VIEWPORT);
      await shoot(pw, page, mode, `${page}-phone-${mode}.png`);
    });
  }
}
