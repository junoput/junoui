// The scrubber's geometry, measured in an engine (X6, 20260829-026).
//
// A scrubber is a coarse-pointer trap in the same way pagination was: its
// playhead and in/out marks are small drag targets by nature, and 20260815-040
// was exactly this failure in another component — a control whose tap floor
// held on ONE AXIS and not the other, shipping at 44x32 for weeks.
//
// So this asserts the floor on BOTH axes, in both pointer projects, and it
// asserts the PAINT stays thin while the HIT grows. Those are different boxes
// on purpose, and a check that measured only one of them would pass a scrubber
// that is either unhittable or a 44px slab.
import { expect, test } from '@playwright/test';

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
  await pw.goto('/showcase/data-display.html', { waitUntil: 'networkidle' });
  await pw.evaluate(() => document.fonts.ready);
};

const box = (pw, sel) =>
  pw.locator(sel).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });

test('the pointer type is the one this project claims', async ({ page: pw }, info) => {
  // Without this every measurement below could be taken against a desktop page
  // and the run would look clean — the emulation is proven before it is read.
  await open(pw);
  const coarse = await pw.evaluate(() => matchMedia('(pointer: coarse)').matches);
  expect(coarse).toBe(EXPECT[info.project.name].coarse);
});

test('the host carries the tap floor on the block axis', async ({ page: pw }, info) => {
  // The track is 4px. The thing a finger aims at is the host, and it promotes
  // with --juno-size-tap-min rather than this component knowing what a phone is.
  await open(pw);
  const { tapMin } = EXPECT[info.project.name];
  const b = await box(pw, '#sc-basic');
  expect(b.h).toBe(tapMin);
});

test('the tap floor is on the HOST, not a pseudo-element', async ({ page: pw }, info) => {
  // .juno-splitter puts its hit area on ::after, which leaves its measured
  // border box a 1px hairline — anything auditing tap targets with
  // getBoundingClientRect, junoui-doctor included, reads that as a short
  // target. Sizing the host keeps the measurement honest. See 20260902-014.
  await open(pw);
  const { tapMin } = EXPECT[info.project.name];
  const measured = await pw
    .locator('#sc-basic')
    .evaluate((el) => Math.round(el.getBoundingClientRect().height));
  expect(measured, 'an audit measuring this element would report it short').toBeGreaterThanOrEqual(
    tapMin,
  );
});

test('the painted track stays a hairline while the hit area grows', async ({ page: pw }, info) => {
  // Both halves. A component that grew the paint to 44px would pass a tap-floor
  // check and look like a slab; one that grew neither is unhittable.
  await open(pw);
  const { tapMin } = EXPECT[info.project.name];
  const host = await box(pw, '#sc-basic');
  const track = await box(pw, '#sc-basic .juno-scrubber__track');
  expect(host.h).toBe(tapMin);
  expect(track.h).toBe(4);
  expect(track.h).toBeLessThan(host.h);
});

test('the in/out marks hold the floor on BOTH axes', async ({ page: pw }, info) => {
  // THE 20260815-040 assertion. Pagination held --juno-size-tap-min on its
  // inline axis and a fixed 32px on its block axis. One-axis checks passed it
  // for its entire life.
  await open(pw);
  const { tapMin } = EXPECT[info.project.name];
  for (const sel of ['.juno-scrubber__mark--in', '.juno-scrubber__mark--out']) {
    const b = await box(pw, `#sc-marks ${sel}`);
    expect(b.w, `${sel} is ${b.w}x${b.h}, short on the inline axis`).toBeGreaterThanOrEqual(tapMin);
    expect(b.h, `${sel} is ${b.w}x${b.h}, short on the block axis`).toBeGreaterThanOrEqual(tapMin);
  }
});

test('the playhead is not a separate tap target', async ({ page: pw }) => {
  // It is painted at 12px and must not be aimed at: pointer-events off, so a
  // drag begun on the head is a drag on the host. Otherwise the component would
  // ship a 12px target that every audit correctly flags.
  await open(pw);
  const pe = await pw
    .locator('#sc-basic .juno-scrubber__head')
    .evaluate((el) => getComputedStyle(el).pointerEvents);
  expect(pe).toBe('none');
});

test('loaded and played are two ranges over one axis', async ({ page: pw }) => {
  // A stream buffers past the playhead. If these collapsed to one bar the
  // component would be a progress bar with extra classes.
  await open(pw);
  const m = await pw.evaluate(() => {
    const s = document.getElementById('sc-basic');
    const w = (sel) => s.querySelector(sel).getBoundingClientRect().width;
    return { loaded: w('.juno-scrubber__loaded'), played: w('.juno-scrubber__played') };
  });
  expect(m.loaded).toBeGreaterThan(m.played);
});

test('the whole strip is hittable, not just the painted line', async ({ page: pw }, info) => {
  // The behavioural form of the floor: a point near the TOP of the host, well
  // above the 4px track, still hits the scrubber. That is what a finger does.
  await open(pw);
  const { tapMin } = EXPECT[info.project.name];
  const hit = await pw.evaluate((tap) => {
    const s = document.getElementById('sc-basic');
    // Scrolled into view first: elementFromPoint takes VIEWPORT coordinates, so
    // sampling a rect that is below the fold asks about a point off-screen and
    // answers null. That is a test measuring nothing, not a component failing.
    s.scrollIntoView({ block: 'center' });
    const r = s.getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + 2);
    return { inside: s === el || s.contains(el), tap, height: Math.round(r.height) };
  }, tapMin);
  expect(hit.inside, 'the top of the strip does not belong to the scrubber').toBe(true);
});
