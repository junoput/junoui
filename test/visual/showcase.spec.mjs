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

// Overlay dialogs on showcase/overlays.html. They ship CLOSED (`<dialog>` with
// no `open`), so the plain page snapshots above render none of them — every
// modal/drawer/sheet style was outside coverage until these cases opened them.
// See 20260804-001.
const OVERLAYS = [
  { id: 'ov-modal', name: 'modal' },
  { id: 'ov-modal-danger', name: 'modal-warning' },
  { id: 'ov-drawer-end', name: 'drawer-end' },
  { id: 'ov-drawer-start', name: 'drawer-start' },
  { id: 'ov-drawer-bottom', name: 'sheet-bottom' },
  { id: 'ov-slideover', name: 'slideover' },
];

// below md the centered modal becomes a bottom sheet (modal.css media query)
// and side drawers cap short of the full width (drawer.css) — both are pure
// media-query branches, invisible at the desktop viewport.
const PHONE_OVERLAYS = [
  { id: 'ov-modal', name: 'modal' },
  { id: 'ov-drawer-end', name: 'drawer-end' },
];

async function visit(pw, page, mode) {
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
}

async function shoot(pw, page, mode, name) {
  await visit(pw, page, mode);

  await expect(pw).toHaveScreenshot(name, {
    fullPage: true,
    // JS-updated widgets drift between runs — mask them out
    mask: [pw.locator('#clock'), pw.locator('[data-prog]'), pw.locator('[data-pct]')],
  });
}

// Open one dialog with the real API the docs prescribe (showModal → top layer
// + ::backdrop), wait until it is genuinely settled, then shoot the VIEWPORT
// (not fullPage): a top-layer element is painted over the viewport, so a
// stitched full-page shot is not what a user sees.
async function openAndShoot(pw, mode, { id, name }, suffix) {
  await visit(pw, 'overlays', mode);

  await pw.evaluate((el) => document.getElementById(el).showModal(), id);

  // "open" is not "settled": the entry transition (opacity + transform, and
  // the discrete overlay/display steps) is still running on the frame after
  // showModal. `animations: 'disabled'` only freezes things at capture time,
  // so assert the end state explicitly — otherwise a mid-transition frame
  // becomes the baseline and every later run is a coin flip.
  await expect
    .poll(
      () =>
        pw.evaluate((el) => {
          const d = document.getElementById(el);
          if (!d.open) return false;
          const cs = getComputedStyle(d);
          const settled =
            cs.opacity === '1' &&
            (cs.transform === 'none' || cs.transform === 'matrix(1, 0, 0, 1, 0, 0)');
          const quiet = d.getAnimations({ subtree: true }).every((a) => a.playState !== 'running');
          return settled && quiet;
        }, id),
      { message: `dialog #${id} never settled open` },
    )
    .toBe(true);

  await expect(pw).toHaveScreenshot(`overlay-${name}${suffix}-${mode}.png`, {
    // Tighter than the config's global 1%-of-pixels budget, on purpose. An
    // overlay is a small surface inside a full viewport shot, so a real style
    // change moves very few pixels: fattening the bottom sheet's top radius
    // 8px → 32px moves 321 (ratio 0.0003) and would pass at 1%; even shrinking
    // the sheet's whole height 60dvh → 50dvh only reaches 0.011 in dark mode.
    // A budget that swallows those is the same blind suite this case exists to
    // fix. 40px is an anti-flake cushion only — the record env equals the check
    // env (both ubuntu-24.04), so an honest run diffs zero.
    maxDiffPixels: 40,
    maxDiffPixelRatio: 0,
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

  for (const ov of OVERLAYS) {
    test(`overlay ${ov.name} (open) — ${mode}`, async ({ page: pw }) => {
      await openAndShoot(pw, mode, ov, '');
    });
  }
  for (const ov of PHONE_OVERLAYS) {
    test(`overlay ${ov.name} (open, phone) — ${mode}`, async ({ page: pw }) => {
      await pw.setViewportSize(PHONE_VIEWPORT);
      await openAndShoot(pw, mode, ov, '-phone');
    });
  }

  // auto mode — fresh visitor, nothing stored: the theme must follow the
  // emulated OS scheme (data-juno-mode stays unset)
  test(`index (auto) — os ${mode}`, async ({ page: pw }) => {
    await pw.emulateMedia({ colorScheme: mode });
    await pw.goto('/showcase/index.html', { waitUntil: 'networkidle' });
    await pw.evaluate(() => document.fonts.ready);
    expect(await pw.evaluate(() => document.documentElement.dataset.junoMode)).toBeUndefined();

    await expect(pw).toHaveScreenshot(`index-auto-${mode}.png`, {
      fullPage: true,
      mask: [pw.locator('#clock'), pw.locator('[data-prog]'), pw.locator('[data-pct]')],
    });
  });
}
