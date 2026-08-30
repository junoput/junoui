// The swatch claim a source scan cannot make: the checked indicator is
// actually VISIBLE when an option is selected (X5 / 20260829-025).
//
// The node guard asserts the rules are present and shaped right. A mutation
// adding `visibility: hidden` to the glyph survived all of it — the rules were
// still there, the selected rule still set display:block, and the check still
// never appeared. "Colour is never the only signal" is a claim about what
// renders, so it is measured where things render.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const css = readFileSync(join(ROOT, 'dist/css/juno.css'), 'utf8');

const PALETTE = `
<div class="juno-palette" role="listbox" aria-label="Colour">
  <button class="juno-palette__option" id="on" role="option" aria-selected="true"
          style="--juno-swatch-color:#1F6FEB" aria-label="Azure">
    <svg class="juno-icon juno-palette__check" id="check-on" aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12l6 6L20 6" stroke="currentColor" fill="none"/></svg>
  </button>
  <button class="juno-palette__option" id="off" role="option" aria-selected="false"
          style="--juno-swatch-color:#C41E3A" aria-label="Crimson">
    <svg class="juno-icon juno-palette__check" id="check-off" aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12l6 6L20 6" stroke="currentColor" fill="none"/></svg>
  </button>
</div>`;

const mount = (pw) =>
  pw.setContent(
    `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style>${PALETTE}`,
  );

test('the selected option actually paints its check', async ({ page: pw }) => {
  await mount(pw);
  const box = await pw.locator('#check-on').boundingBox();
  expect(box, 'the check has no box').not.toBeNull();
  expect(box.width).toBeGreaterThan(0);
  expect(box.height).toBeGreaterThan(0);

  // ...and it is not hidden by some other mechanism. `display` was the one the
  // source check knew about; visibility and opacity are the two that slipped
  // past it.
  const style = await pw.evaluate(() => {
    const cs = getComputedStyle(document.getElementById('check-on'));
    return { display: cs.display, visibility: cs.visibility, opacity: cs.opacity };
  });
  expect(style.display).not.toBe('none');
  expect(style.visibility).toBe('visible');
  expect(Number(style.opacity)).toBeGreaterThan(0.5);
});

test('an unselected option paints no check', async ({ page: pw }) => {
  // The other half: if every option shows a check, the indicator says nothing.
  await mount(pw);
  expect(await pw.locator('#check-off').boundingBox()).toBeNull();
});

test('the selected option carries a second, non-colour cue', async ({ page: pw }) => {
  // A check inside a 24px square is small, so selection also grows a ring. Two
  // non-colour cues, because colour is never the only signal.
  await mount(pw);
  const shadows = await pw.evaluate(() => ({
    on: getComputedStyle(document.getElementById('on')).boxShadow,
    off: getComputedStyle(document.getElementById('off')).boxShadow,
  }));
  expect(shadows.on).not.toBe(shadows.off);
  // three layers on the selected one: inset ring, outset ring, active ring
  expect(shadows.on.split(/,(?![^(]*\))/).length).toBeGreaterThan(
    shadows.off.split(/,(?![^(]*\))/).length,
  );
});
