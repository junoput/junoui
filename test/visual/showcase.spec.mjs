// Visual-regression: full-page snapshot of every showcase page, dark + light.
// The theme is set the way a real visitor's would persist — via localStorage,
// which app.js reads before first paint (so no flash, deterministic mode).
//
// This file is the FINE-POINTER half of the suite: it runs under the
// `chromium` project only (playwright.config.mjs ignores it for
// `chromium-coarse`). Its "phone" cases are a desktop context resized to
// 390x844 — a width change and nothing more, which is the point: they pin the
// width-driven branches while coarse.spec.mjs pins the pointer-driven ones.
// See 20260815-006.
import { expect, test } from '@playwright/test';
import {
  MASKS,
  MODES,
  OVERLAYS,
  PHONE_OVERLAYS,
  PHONE_PAGES,
  PHONE_VIEWPORT,
  openAndShoot,
  shoot,
} from './helpers.mjs';

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
      mask: MASKS(pw),
    });
  });
}
