// The dual-thumb range's geometry (X7, 20260829-027).
//
// The scrubber's coarse-pointer problem was size. This one's is OVERLAP: two
// 44px thumbs cover each other as soon as their centres are within 44px, which
// is most of a short track. So these assert the floor on both axes AND the two
// things the overlap makes possible to get wrong — that the boxes may overlap
// while the grips stay separate, and that a tap on the overlap resolves to a
// thumb that can move.
import { expect, test } from '@playwright/test';

import { pickThumb } from '../../tools/range.mjs';

const EXPECT = {
  chromium: { coarse: false, tapMin: 24 },
  'chromium-coarse': { coarse: true, tapMin: 44 },
};

const open = async (pw) => {
  await pw.addInitScript(() => {
    localStorage.setItem('juno:mode', 'dark');
    localStorage.setItem('juno:palette', 'standard');
    localStorage.setItem('juno:density', 'comfortable');
    localStorage.setItem('juno:text', 'base');
  });
  await pw.goto('/showcase/forms.html', { waitUntil: 'networkidle' });
  await pw.evaluate(() => document.fonts.ready);
};

const rect = (pw, sel) =>
  pw.locator(sel).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left, w: Math.round(r.width), h: Math.round(r.height), cx: r.left + r.width / 2 };
  });

test('the pointer type is the one this project claims', async ({ page: pw }, info) => {
  await open(pw);
  expect(await pw.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(
    EXPECT[info.project.name].coarse,
  );
});

test('each thumb holds the tap floor on BOTH axes', async ({ page: pw }, info) => {
  // 20260815-040 applied, not re-derived. A thumb floored on one axis is the
  // pagination defect with a different class name.
  await open(pw);
  const { tapMin } = EXPECT[info.project.name];
  for (const sel of ['.juno-range__thumb--lo', '.juno-range__thumb--hi']) {
    const r = await rect(pw, `#rg-apart ${sel}`);
    expect(r.w, `${sel} is ${r.w}x${r.h}`).toBeGreaterThanOrEqual(tapMin);
    expect(r.h, `${sel} is ${r.w}x${r.h}`).toBeGreaterThanOrEqual(tapMin);
  }
});

test('coincident thumbs overlap in the HIT area', async ({ page: pw }, info) => {
  // The premise of the whole design. If this were false the pick rule would be
  // solving a problem the component does not have — so it is measured, not
  // assumed.
  await open(pw);
  const { tapMin } = EXPECT[info.project.name];
  const lo = await rect(pw, '#rg-together .juno-range__thumb--lo');
  const hi = await rect(pw, '#rg-together .juno-range__thumb--hi');
  expect(Math.abs(lo.cx - hi.cx)).toBeLessThan(1);
  const overlap = Math.min(lo.x + lo.w, hi.x + hi.w) - Math.max(lo.x, hi.x);
  expect(overlap, 'coincident thumbs do not overlap — the premise is wrong').toBeGreaterThanOrEqual(
    tapMin - 1,
  );
});

test('...while the GRIPS stay separate, when the thumbs are close but not equal', async ({
  page: pw,
}) => {
  // Measured on #rg-close (4% apart), NOT on the coincident pair — and that
  // distinction is the point. At exact coincidence the grips necessarily
  // coincide too, so a claim that they "stay visibly separate" there is false;
  // the showcase caption said so until the recorded baseline was opened and
  // looked at, and the picture disproved it.
  //
  // What IS true, and what the small grip buys, is the band between "boxes
  // overlap" and "positions equal": the tap boxes are already on top of each
  // other while the grips are still two distinct dots.
  await open(pw);
  const m = await pw.evaluate(() => {
    const root = document.getElementById('rg-close');
    const b = (sel) => root.querySelector(sel).getBoundingClientRect();
    const lo = b('.juno-range__thumb--lo');
    const hi = b('.juno-range__thumb--hi');
    const grip = parseFloat(
      getComputedStyle(root.querySelector('.juno-range__thumb--lo'), '::before').inlineSize,
    );
    return {
      boxOverlap: Math.min(lo.right, hi.right) - Math.max(lo.left, hi.left),
      centreGap: hi.left + hi.width / 2 - (lo.left + lo.width / 2),
      grip,
      box: lo.width,
    };
  });
  expect(
    m.boxOverlap,
    'the tap boxes do not overlap — wrong fixture for this claim',
  ).toBeGreaterThan(0);
  // And the BAND exists: grip < box means there is a separation at which the
  // boxes overlap while the grips are still two distinct dots. That is the
  // design property, and it is what is asserted — NOT a pixel gap on this
  // fixture, because the two projects render the track at different widths, so
  // one percentage cannot sit inside the band for both. Measured: 4% is 20.8px
  // on the desktop track (inside the 16–24px band) and 14.3px on the phone one
  // (below the 16px grip). Pinning the fixture would have been pinning the
  // viewport, which is how a guard starts reporting on the machine.
  expect(m.grip, 'the grip fills its tap box — two thumbs would read as one').toBeLessThan(m.box);
  expect(
    m.box - m.grip,
    'no separation exists where the boxes overlap but the grips do not',
  ).toBeGreaterThan(0);
});

test('a tap on the overlap resolves to a thumb that can move', async ({ page: pw }) => {
  // The rule, exercised against the REAL rendered geometry rather than made-up
  // numbers: take the actual thumb centres, sample points across the overlap,
  // and require every answer to be a thumb with somewhere to go.
  await open(pw);
  const geo = await pw.evaluate(() => {
    const root = document.getElementById('rg-together');
    const track = root.querySelector('.juno-range__track').getBoundingClientRect();
    const at = (sel) => {
      const r = root.querySelector(sel).getBoundingClientRect();
      return ((r.left + r.width / 2 - track.left) / track.width) * 100;
    };
    return { lo: at('.juno-range__thumb--lo'), hi: at('.juno-range__thumb--hi') };
  });
  for (const value of [geo.lo - 20, geo.lo - 0.5, geo.lo, geo.hi + 0.5, geo.hi + 20]) {
    const thumb = pickThumb({ value, lo: geo.lo, hi: geo.hi, min: 0, max: 100 });
    const canMove =
      thumb === 'lo' ? value <= geo.lo || geo.lo > 0 : value >= geo.hi || geo.hi < 100;
    expect(canMove, `tap at ${value.toFixed(1)} grabbed ${thumb}, which cannot move`).toBe(true);
  }
});

test('the host declares delegated hit handling', async ({ page: pw }) => {
  // Not decoration: at coincident positions one thumb is entirely under the
  // other, so a per-element hit audit correctly reports it unreachable — and it
  // is unreachable in DOM terms while being reachable in fact, because
  // pickThumb decides from a handler on the host. Without this attribute
  // junoui-doctor reports junoui's own component as broken (20260902-014).
  //
  // Asserted on the SHOWCASE markup, which is what a consumer copies.
  await open(pw);
  for (const id of ['#rg-apart', '#rg-close', '#rg-together']) {
    const v = await pw.locator(id).getAttribute('data-juno-hit');
    expect(v, `${id} does not declare delegated hit handling`).toBe('delegated');
  }
});

test('the fill spans between the thumbs, not from the left edge', async ({ page: pw }) => {
  // A fill anchored at 0 is a progress bar. This is what makes it a range.
  await open(pw);
  const fill = await rect(pw, '#rg-apart .juno-range__fill');
  const track = await rect(pw, '#rg-apart .juno-range__track');
  expect(fill.x).toBeGreaterThan(track.x + 1);
  expect(fill.w).toBeLessThan(track.w);
});

test('each thumb announces the other as its limit', async ({ page: pw }) => {
  // The ticket's own ask, asserted on the rendered markup rather than on the
  // helper that computes it — the showcase is what a consumer copies.
  await open(pw);
  const a = await pw.evaluate(() => {
    const g = (sel, at) => document.querySelector(`#rg-apart ${sel}`).getAttribute(at);
    return {
      loMax: g('.juno-range__thumb--lo', 'aria-valuemax'),
      hiMin: g('.juno-range__thumb--hi', 'aria-valuemin'),
      loNow: g('.juno-range__thumb--lo', 'aria-valuenow'),
      hiNow: g('.juno-range__thumb--hi', 'aria-valuenow'),
      names: [...document.querySelectorAll('#rg-apart [role=slider]')].map((t) =>
        t.getAttribute('aria-label'),
      ),
      role: document.getElementById('rg-apart').getAttribute('role'),
    };
  });
  expect(a.loMax).toBe(a.hiNow);
  expect(a.hiMin).toBe(a.loNow);
  expect(a.role).toBe('group');
  expect(new Set(a.names).size, 'both thumbs share one name — unusable with a reader').toBe(2);
});
