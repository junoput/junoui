// A PROGRESS BAR MUST FILL FROM THE READING-DIRECTION START (20260914-166).
//
// `.juno-bar__fill` used `left: 0`, so a 30%-complete bar inside `dir="rtl"`
// filled from the LEFT — measured identical to LTR, 0..120 of a 0..400 bar.
// Progress ran backwards for every RTL reader, and nothing caught it: the
// showcase is LTR, so no screenshot could show it, and hard rule 6 (logical
// properties) was checked by reading rather than by a test.
//
// ASSERT THE RELATIONSHIP, NOT THE PIXEL. `0..120` and `280..400` are this
// fixture's numbers at 400px and 30%; what must stay true is that the fill is
// flush with the bar's INLINE-START edge in whichever direction the document
// runs. A test pinning 280 would fail on any width change and would say nothing
// about direction.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const CSS = readFileSync(
  join(dirname(dirname(dirname(fileURLToPath(import.meta.url)))), 'dist/css/juno.css'),
  'utf8',
);

async function measure(pw, dir, extraClass = '') {
  await pw.setViewportSize({ width: 400, height: 200 });
  await pw.setContent(`<html dir="${dir}"><style>${CSS}</style>
    <div class="juno-bar ${extraClass}" id="bar" style="--juno-progress:30">
      <div class="juno-bar__fill" id="fill"></div>
    </div>`);
  return pw.evaluate(() => {
    const r = (id) => {
      const q = document.getElementById(id).getBoundingClientRect();
      return { left: Math.round(q.left), right: Math.round(q.right), width: Math.round(q.width) };
    };
    return { bar: r('bar'), fill: r('fill') };
  });
}

test('the fixture really renders a partial bar (vacuity floor)', async ({ page }) => {
  // Without this, a fill of zero width sits flush with BOTH edges and satisfies
  // every assertion below in both directions.
  const { bar, fill } = await measure(page, 'ltr');
  expect(bar.width).toBeGreaterThan(300);
  expect(fill.width).toBeGreaterThan(0);
  expect(fill.width).toBeLessThan(bar.width);
});

for (const [dir, flushEdge, farEdge] of [
  ['ltr', 'left', 'right'],
  ['rtl', 'right', 'left'],
]) {
  test(`dir=${dir}: the fill is flush with the inline-start edge`, async ({ page }) => {
    const { bar, fill } = await measure(page, dir);
    expect(
      fill[flushEdge],
      `a ${dir} progress bar must start at its ${flushEdge} edge — it filled ` +
        `${fill.left}..${fill.right} inside a bar at ${bar.left}..${bar.right}`,
    ).toBe(bar[flushEdge]);
    expect(fill[farEdge]).not.toBe(bar[farEdge]);
  });
}

test('the indeterminate segment starts outside the inline-start edge', async ({ page }) => {
  // The rule's own offset, before the animation moves it.
  const ltr = await measure(page, 'ltr', 'juno-bar--indeterminate');
  const rtl = await measure(page, 'rtl', 'juno-bar--indeterminate');
  expect(ltr.fill.left).toBeLessThan(ltr.bar.left);
  expect(rtl.fill.right).toBeGreaterThan(rtl.bar.right);
});

test('and it TRAVELS with the reading direction — the keyframes, not the rule', async ({
  page,
}) => {
  // The rule above and the @keyframes are two declarations and only the first is
  // covered by it: reverting the keyframes alone to `left` left every assertion
  // in this file green, which is how this test came to exist.
  //
  // SEEK, DO NOT SLEEP. Sampling a running animation is the flake that cost an
  // hour on 20260914-162; `getAnimations()` + `currentTime` puts the animation at
  // an exact point with no timing at all.
  const at = async (dir, fraction) => {
    await page.setViewportSize({ width: 400, height: 200 });
    await page.setContent(`<html dir="${dir}"><style>${CSS}</style>
      <div class="juno-bar juno-bar--indeterminate" id="bar">
        <div class="juno-bar__fill" id="fill"></div>
      </div>`);
    return page.evaluate((f) => {
      const fill = document.getElementById('fill');
      const [anim] = fill.getAnimations();
      if (!anim) throw new Error('the indeterminate fill has no animation to seek');
      anim.pause();
      anim.currentTime = anim.effect.getTiming().duration * f;
      const q = fill.getBoundingClientRect();
      return { left: Math.round(q.left), right: Math.round(q.right) };
    }, fraction);
  };

  const ltrEarly = await at('ltr', 0.1);
  const ltrLate = await at('ltr', 0.9);
  const rtlEarly = await at('rtl', 0.1);
  const rtlLate = await at('rtl', 0.9);

  // LTR: the segment sweeps left to right. RTL: the mirror.
  expect(
    ltrLate.left,
    `ltr did not advance: ${JSON.stringify([ltrEarly, ltrLate])}`,
  ).toBeGreaterThan(ltrEarly.left);
  expect(rtlLate.left, `rtl did not mirror: ${JSON.stringify([rtlEarly, rtlLate])}`).toBeLessThan(
    rtlEarly.left,
  );
});
