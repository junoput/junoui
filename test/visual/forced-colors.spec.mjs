// Forced colors (Windows High Contrast): the borders that survive the palette
// swap, asserted as COMPUTED VALUES rather than screenshots.
//
// Why not a snapshot: the defect this covers (20260815-029) was a transparent
// border under forced-colors, and "transparent border" and "border the same
// colour as the surface behind it" look identical in a diff while meaning
// different things. A computed border-color is unarguable.
//
// Why it needs asserting at all: junoui's forced-colors block used to sit in
// base.css, which the bundler emits before components/, so every component's
// own `border` declaration beat it on source order. Three of the four selectors
// were rescued by the UA's own repaint and looked fine; .juno-badge was not,
// because it sets `forced-color-adjust: none` to keep its status fill — and
// that opt-out also disables the repaint. Relying on the UA to fix our cascade
// is not a contract, and it differs by engine.
import { expect, test } from '@playwright/test';

const MARKUP = `
  <span class="juno-badge" id="badge">STATUS</span>
  <button class="juno-btn" id="btn">ACTION</button>
  <div class="juno-card" id="card">card</div>
  <div class="juno-readout" id="readout">readout</div>`;

const TRANSPARENT = /rgba\(0, 0, 0, 0\)|transparent/;

// Emulation is applied per page with emulateMedia(), NOT via `use:
// { forcedColors }`. The fixture form did not reach the context in this setup
// (Playwright 1.61) and the suite ran with forced-colors OFF — while two of the
// eight cases still "passed", because their borders are opaque anyway. The
// instrument check inside each test is what surfaced that, and it stays for
// exactly that reason: a forced-colors suite that silently runs unforced is
// green and worthless.
test.describe('forced-colors: active', () => {
  for (const id of ['badge', 'btn', 'card', 'readout']) {
    test(`${id} keeps a visible border in the system palette`, async ({ page }) => {
      await page.emulateMedia({ forcedColors: 'active' });
      await page.goto('/showcase/index.html', { waitUntil: 'domcontentloaded' });
      await page.evaluate(
        (m) => document.body.insertAdjacentHTML('afterbegin', `<div id="fc">${m}</div>`),
        MARKUP,
      );
      // Instrument check FIRST: a spec that silently ran without the emulation
      // would report a green forced-colors suite while testing nothing. This
      // caught a real setup error while the spec was being written.
      const active = await page.evaluate(() => matchMedia('(forced-colors: active)').matches);
      expect(active, 'forced-colors emulation must be in effect').toBe(true);

      const el = page.locator(`#${id}`);
      const { color, width } = await el.evaluate((node) => {
        const cs = getComputedStyle(node);
        return { color: cs.borderColor, width: cs.borderTopWidth };
      });
      expect(color, `${id} border-color under forced-colors`).not.toMatch(TRANSPARENT);
      expect(parseFloat(width), `${id} border-width`).toBeGreaterThan(0);
    });
  }
});
