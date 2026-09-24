// Pins the four properties showcase/device/harness.js's desktop
// viewport-framing switch (20260918-003, PR #141) documents about itself in
// its own comments, so a later edit that breaks one of them fails loudly
// instead of rotting silently. showcase/ does not ship (not in
// package.json's `files`), so this is a dev-instrument regression test, not
// a release gate — no screenshots, assertions only.
//
// Runs under BOTH Playwright projects (the filename matches neither
// `coarse.spec.mjs$` nor `showcase.spec.mjs$`, so playwright.config.mjs's
// testIgnore pairs let it through to `chromium` — fine pointer — and
// `chromium-coarse` — hasTouch+isMobile) rather than hand-building contexts,
// which is what actually exercises the switch's own guard: it keys on
// `matchMedia('(pointer: coarse), (hover: none)')`, exactly what
// distinguishes the two projects.
import { expect, test } from '@playwright/test';
import { assertServingThisCheckout } from './helpers.mjs';

const PAGE = '/showcase/device/buttons.html';

test('the switch appears only for a fine pointer', async ({ page: pw }) => {
  await assertServingThisCheckout(pw);
  await pw.goto(PAGE, { waitUntil: 'domcontentloaded' });

  const coarse = await pw.evaluate(() => matchMedia('(pointer: coarse), (hover: none)').matches);
  const switchCount = await pw.locator('.dh-viewport-switch').count();

  // Guarded on the measured pointer type rather than the project name: the
  // switch's own condition IS the pointer/hover media query, so asserting
  // against that query is what actually exercises the guard rather than
  // assuming project config still sets hasTouch/isMobile the way it did when
  // this test was written.
  expect(switchCount, `coarse=${coarse}`).toBe(coarse ? 0 : 1);
});

test.describe('mobile-mode iframe (fine pointer only)', () => {
  test.skip(
    ({ isMobile }) => isMobile,
    'the switch does not render for a coarse pointer — nothing to click',
  );

  test('mobile mode opens a real 390x844 nested browsing context', async ({ page: pw }) => {
    await assertServingThisCheckout(pw);
    await pw.goto(PAGE, { waitUntil: 'domcontentloaded' });

    await expect(pw.locator('.dh-viewport-switch')).toHaveCount(1);
    await pw.locator('[data-dh-mode="mobile"]').click();

    await expect(pw.locator('.dh-viewport-frame-wrap')).toBeVisible();

    // The iframe loads the SAME url as the parent document (frame.src =
    // location.pathname), so `page.frame({ url })` matches the TOP document
    // too and silently hands back the parent — caught once during review of
    // PR #141. Select the child explicitly instead.
    const childFrame = pw.frames().find((f) => f !== pw.mainFrame());
    expect(childFrame, 'the mobile-preview iframe never attached').toBeTruthy();

    const bezelBox = await pw.locator('.dh-viewport-frame').boundingBox();
    expect(bezelBox?.width).toBe(390);
    expect(bezelBox?.height).toBe(844);

    const inner = await childFrame.evaluate(() => ({
      selfIsTop: window.self === window.top,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      coarse: matchMedia('(pointer: coarse)').matches,
      switchCount: document.querySelectorAll('.dh-viewport-switch').length,
    }));

    // width/height/dvh-keyed breakpoints resolve against a REAL 390x844
    // viewport inside the frame, not a div wearing a costume.
    expect(inner.innerWidth).toBe(390);
    expect(inner.innerHeight).toBe(844);

    // window.self !== window.top guard: the nested page does not inject a
    // second switch of its own.
    expect(inner.selfIsTop, 'the nested page thinks it is the top document').toBe(false);
    expect(inner.switchCount, 'the nested page injected a second switch').toBe(0);

    // The documented limitation, verified rather than asserted from the
    // spec: an iframe cannot spoof the primary input device. A mouse-driven
    // desktop stays a fine pointer inside a 390px frame exactly as it does
    // inside a 390px window.
    expect(inner.coarse, 'a nested iframe reported pointer:coarse — it cannot').toBe(false);

    // Desktop toggles the frame back off.
    await pw.locator('[data-dh-mode="desktop"]').click();
    await expect(pw.locator('.dh-viewport-frame-wrap')).toBeHidden();
    const srcAfter = await pw.locator('.dh-viewport-frame').getAttribute('src');
    expect(
      srcAfter,
      'switching back to desktop should stop the nested page, not just hide it',
    ).toBeNull();
  });
});
