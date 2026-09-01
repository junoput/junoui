// .juno-fold in the showcase (20260826-006).
//
// The fold shipped with no showcase entry, so it was outside the
// visual-regression suite entirely — every other component gets a pixel diff
// on every change and this one got none.
//
// A snapshot DOES cover this component's real failure, which is not true of
// every component and is why the entry is worth having: the fold's defect
// (20260826-002) was that a folded slot could not reach zero when composed
// with .juno-pillbar__item, and a slot 44px wide instead of 0 moves the row it
// sits in. That is visible in a static shot.
//
// But a baseline is a picture, and this file asserts the NUMBER. Two reasons.
// A pixel diff on a 44px row shift can be argued down; `0.00` cannot. And the
// Linux baselines are recorded on a runner by a separate manual workflow, so
// between an intended visual change and its re-recording there is a window
// where the snapshot proves nothing — this runs in that window too.
import { expect, test } from '@playwright/test';

import { hideDeclaredSections } from './helpers.mjs';

const box = (pw, sel) => pw.locator(sel).evaluate((el) => el.getBoundingClientRect().width);

test.beforeEach(async ({ page: pw }) => {
  await pw.addInitScript(() => {
    localStorage.setItem('juno:mode', 'dark');
    localStorage.setItem('juno:palette', 'standard');
    localStorage.setItem('juno:density', 'comfortable');
    localStorage.setItem('juno:text', 'base');
  });
  await pw.goto('/showcase/mobile.html', { waitUntil: 'networkidle' });
  await pw.evaluate(() => document.fonts.ready);
});

test('the showcase demonstrates a fold in both resting states', async ({ page: pw }) => {
  // If either bar goes, the section stops showing the thing it exists to show
  // and the baseline quietly becomes a picture of one state.
  await expect(pw.locator('#fold-out .juno-fold')).toHaveCount(1);
  await expect(pw.locator('#fold-in .juno-fold[data-juno-in]')).toHaveCount(1);
});

test('the folded slot measures zero, composed with __item', async ({ page: pw }) => {
  // THE defect this component shipped: .juno-pillbar__item declares
  // min-inline-size (the tap floor) and padding-inline, and a border-box width
  // cannot resolve below its own padding. The fold releases all three when
  // folded. Anything above 0 here is that bug returning.
  const w = await box(pw, '#fold-out .juno-fold');
  expect(w).toBe(0);
});

test('the present slot keeps the tap floor', async ({ page: pw }) => {
  // The control, and it is not decoration: releasing the floor unconditionally
  // rather than only when folded would pass the test above and ship a 20px tap
  // target. Both halves or neither.
  const w = await box(pw, '#fold-in .juno-fold');
  const tap = await pw.evaluate(() =>
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--juno-size-tap-min')),
  );
  expect(w).toBeGreaterThanOrEqual(tap);
});

test('a declared section leaves LAYOUT when hidden for the page shot', async ({ page: pw }) => {
  // The mechanism that makes this section additive rather than disruptive.
  //
  // A full-page baseline is every component on the page stacked vertically, so
  // adding one moves everything below it and reds every unrelated section. A
  // section marked data-vr-shot is therefore removed from the page shot and
  // shot on its own.
  //
  // `display: none` is load-bearing and `visibility: hidden` would NOT do: the
  // section has to leave layout, or the page is still taller and every baseline
  // below it still moves — the same bug with an extra step. So the assertion is
  // on the page HEIGHT, not on whether the section is visible.
  // Calls the PRODUCTION helper, not a copy of its rule. The first version of
  // this test pasted `display: none` inline, so mutating helpers.mjs to
  // `visibility: hidden` left it green — a guard that reimplements the thing it
  // guards can only ever report on itself.
  const before = await pw.evaluate(() => document.documentElement.scrollHeight);
  const section = await pw.locator('[data-vr-shot]').evaluate((el) => el.offsetHeight);
  await hideDeclaredSections(pw);
  const after = await pw.evaluate(() => document.documentElement.scrollHeight);

  expect(section).toBeGreaterThan(0);
  expect(before - after).toBeGreaterThanOrEqual(section);
  // and measured against main on this branch: 4086 shown, 3835 hidden, and
  // main's own mobile.html is 3835 — the existing baselines are untouched.
});

test('every declared shot id on a page is unique', async ({ page: pw }) => {
  // Two sections sharing an id write the same baseline file, so the second
  // silently overwrites the first and one component loses its picture without
  // anything going red.
  const ids = await pw.evaluate(() =>
    [...document.querySelectorAll('[data-vr-shot]')].map((el) => el.dataset.vrShot),
  );
  expect(ids.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);
});

test('the two rows differ by exactly the folded item and its gap', async ({ page: pw }) => {
  // The property a reader of the snapshot is meant to see, stated as a number.
  // Same markup, one attribute apart — so any difference other than one item
  // plus one gap means the fold is moving something it should not.
  const [out, inn, item, gap] = await Promise.all([
    box(pw, '#fold-out'),
    box(pw, '#fold-in'),
    pw.locator('#fold-in .juno-fold').evaluate((el) => el.getBoundingClientRect().width),
    pw.locator('#fold-in').evaluate((el) => parseFloat(getComputedStyle(el).columnGap)),
  ]);
  expect(inn - out).toBeCloseTo(item + gap, 1);
});
