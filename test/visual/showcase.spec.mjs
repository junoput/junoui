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
];

const MODES = ['dark', 'light'];

for (const mode of MODES) {
  for (const page of PAGES) {
    test(`${page} — ${mode}`, async ({ page: pw }) => {
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

      await expect(pw).toHaveScreenshot(`${page}-${mode}.png`, {
        fullPage: true,
        // JS-updated widgets drift between runs — mask them out
        mask: [pw.locator('#clock'), pw.locator('[data-prog]'), pw.locator('[data-pct]')],
      });
    });
  }
}
