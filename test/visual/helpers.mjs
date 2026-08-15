// Shared fixtures for the visual-regression specs.
//
// Split out of showcase.spec.mjs when the suite grew a second Playwright
// project: `chromium` (fine pointer, no touch) and `chromium-coarse`
// (hasTouch + isMobile, so `(pointer: coarse)` / `(hover: none)` actually
// match). The two projects run DIFFERENT spec files — see the `testIgnore`
// pairs in playwright.config.mjs — because the snapshot path template keys on
// the snapshot name alone, so two projects shooting the same name would
// collide on one baseline file. Coarse snapshots therefore carry a `-coarse`
// segment in their name.
import { expect } from '@playwright/test';

// below md the showcase chrome swaps to the junoui mobile kit (navbar +
// pillbar) — snapshot a couple of pages at a phone viewport too
export const PHONE_PAGES = ['index', 'mobile'];
export const PHONE_VIEWPORT = { width: 390, height: 844 };

export const MODES = ['dark', 'light'];

// Overlay dialogs on showcase/overlays.html. They ship CLOSED (`<dialog>` with
// no `open`), so the plain page snapshots render none of them — every
// modal/drawer/sheet style was outside coverage until these cases opened them.
// See 20260804-001.
export const OVERLAYS = [
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
export const PHONE_OVERLAYS = [
  { id: 'ov-modal', name: 'modal' },
  { id: 'ov-drawer-end', name: 'drawer-end' },
];

// JS-updated widgets drift between runs — mask them out
export const MASKS = (pw) => [
  pw.locator('#clock'),
  pw.locator('[data-prog]'),
  pw.locator('[data-pct]'),
];

export async function visit(pw, page, mode) {
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

export async function shoot(pw, page, mode, name) {
  await visit(pw, page, mode);

  await expect(pw).toHaveScreenshot(name, {
    fullPage: true,
    mask: MASKS(pw),
  });
}

// Open one dialog with the real API the docs prescribe (showModal → top layer
// + ::backdrop), wait until it is genuinely settled, then shoot the VIEWPORT
// (not fullPage): a top-layer element is painted over the viewport, so a
// stitched full-page shot is not what a user sees.
export async function openAndShoot(pw, mode, { id, name }, suffix) {
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

  // No per-case pixel budget any more: the config's global budget is a hard
  // zero (see the tolerance note in playwright.config.mjs), which is tighter
  // than the `maxDiffPixels: 40` cushion this helper used to carry.
  await expect(pw).toHaveScreenshot(`overlay-${name}${suffix}-${mode}.png`, {
    mask: MASKS(pw),
  });
}
