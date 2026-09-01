// The modal scroll port, asserted as NUMBERS (20260815-027).
//
// 20260803-029 restructured `.juno-modal[open]` into a flex column and made
// `.juno-modal__body` the bounded scroll port (`min-block-size: 0`,
// `overflow-y: auto`, `overscroll-behavior: contain`). It was predicted to move
// the baseline and moved ZERO PIXELS — reconstructed as a reverse patch, across
// all 48 snapshots, at a zero-pixel budget.
//
// That was not a tolerance problem and no budget could have fixed it: every
// showcase modal was short enough that a flex column and a block box lay out
// identically, and a body that never overflows never scrolls. There was nothing
// for a screenshot to see. The fix is a FIXTURE — `#ov-modal-tall`, whose body
// genuinely overflows — and these assertions, which are cheaper and less
// arguable than a pixel diff.
import { expect, test } from '@playwright/test';

const open = async (pw) => {
  await pw.addInitScript(() => {
    localStorage.setItem('juno:mode', 'dark');
    localStorage.setItem('juno:palette', 'standard');
    localStorage.setItem('juno:density', 'comfortable');
    localStorage.setItem('juno:text', 'base');
  });
  await pw.goto('/showcase/overlays.html', { waitUntil: 'networkidle' });
  await pw.evaluate(() => document.fonts.ready);
  await pw.evaluate(() => document.getElementById('ov-modal-tall').showModal());
};

test('the fixture body actually overflows — without this nothing below is testable', async ({
  page: pw,
}) => {
  // THE assertion the whole ticket turns on. If a future edit trims this
  // dialog's content, every other check here keeps passing while measuring a
  // box that never scrolls — which is exactly the state the suite was in.
  await open(pw);
  const m = await pw.evaluate(() => {
    const b = document.querySelector('#ov-modal-tall .juno-modal__body');
    return { scrollHeight: b.scrollHeight, clientHeight: b.clientHeight };
  });
  expect(m.scrollHeight).toBeGreaterThan(m.clientHeight);
  // and by a real margin, not a sub-pixel: a body one pixel over its port
  // scrolls in principle and shows nothing.
  expect(m.scrollHeight - m.clientHeight).toBeGreaterThan(100);
});

test('the body is the scroll port, not the dialog', async ({ page: pw }) => {
  // The contract 20260803-029 introduced. If `[open]` goes back to a block box,
  // the surface clips and the overflow is unreachable rather than scrollable.
  await open(pw);
  const m = await pw.evaluate(() => {
    const d = document.getElementById('ov-modal-tall');
    const b = d.querySelector('.juno-modal__body');
    return {
      dialogScrolls: d.scrollHeight > d.clientHeight,
      bodyOverflowY: getComputedStyle(b).overflowY,
      dialogDisplay: getComputedStyle(d).display,
      dialogFlow: getComputedStyle(d).flexDirection,
    };
  });
  expect(m.bodyOverflowY).toBe('auto');
  expect(m.dialogDisplay).toBe('flex');
  expect(m.dialogFlow).toBe('column');
  expect(m.dialogScrolls, 'the dialog itself scrolls — the body is not the port').toBe(false);
});

test('the head and foot stay pinned while the body scrolls', async ({ page: pw }) => {
  // Measured, and it is why this fixture puts __foot as a SIBLING of __body
  // rather than inside it as the short fixtures do: with the footer inside the
  // body it travels 407px out of view once the body is at its end, which is the
  // "confirm button you cannot reach" shape. Head is pinned either way.
  await open(pw);
  const m = await pw.evaluate(() => {
    const d = document.getElementById('ov-modal-tall');
    const b = d.querySelector('.juno-modal__body');
    const head = d.querySelector('.juno-modal__head');
    const foot = d.querySelector('.juno-modal__foot');
    const at = () => [head.getBoundingClientRect().top, foot.getBoundingClientRect().top];
    const [h0, f0] = at();
    b.scrollTop = b.scrollHeight;
    const [h1, f1] = at();
    return { scrolled: b.scrollTop > 0, headMoved: h1 - h0, footMoved: f1 - f0 };
  });
  expect(m.scrolled, 'the body did not scroll at all').toBe(true);
  expect(Math.abs(m.headMoved)).toBeLessThan(1);
  expect(Math.abs(m.footMoved)).toBeLessThan(1);
});

test('the foot is a sibling of the body, not inside the scroll port', async ({ page: pw }) => {
  // The structural half of the assertion above. Without it, moving __foot back
  // inside __body would fail the pinning test with a confusing message instead
  // of naming the cause.
  await open(pw);
  const inside = await pw.evaluate(() => {
    const d = document.getElementById('ov-modal-tall');
    return d.querySelector('.juno-modal__body').contains(d.querySelector('.juno-modal__foot'));
  });
  expect(inside, 'the footer is inside the scroll port and will scroll away').toBe(false);
});
