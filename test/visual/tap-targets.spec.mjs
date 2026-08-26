// Touch ergonomics, asserted as NUMBERS — the half of 20260815-006 a
// screenshot cannot settle. A pixel diff on a 44px-vs-24px control can always
// be argued down to antialiasing; `min-height: 44px` cannot.
//
// This file runs under BOTH projects (it is in neither `testIgnore`), and the
// expectation table is keyed by project. That is what makes it a real check:
// if `chromium-coarse` ever stops emulating touch, it starts producing the
// fine-pointer numbers and fails here instead of quietly re-recording a
// desktop rendering into the coarse baselines.
//
// What is under test (src/css/base.css, `@media (pointer: coarse)`):
//   - --juno-size-tap-min flips from --juno-size-tap-min (24px, WCAG 2.2 AA
//     floor) to --juno-size-tap-comfortable (44px), which every control that
//     sizes off it inherits: .juno-btn, .juno-menu__item, .juno-input.
//   - .juno-input gets `font-size: max(16px, …)`, the floor that stops iOS
//     Safari zooming the page onto a focused field.
import { expect, test } from '@playwright/test';

// Per-project expectations. Absolute values, not "bigger than before": the
// point is to pin the contract, and 24 / 44 are the token values themselves
// (tokens/core/size.json → size.tap.min / size.tap.comfortable).
const EXPECT = {
  chromium: { coarse: false, tapMin: '24px', inputFontMin: 0 },
  'chromium-coarse': { coarse: true, tapMin: '44px', inputFontMin: 16 },
};

// Chromium reports a fractional box height when a control lands on a
// fractional layout position — 43.99999809265137 for a 44px menu item, on
// roughly 2 runs in 8. Round before comparing: the sub-pixel is a rendering
// artefact, not a short tap target. Caught with `--repeat-each=4` before this
// shipped, which is the only reason it is not a future intermittent red.
const boxHeight = async (locator) => Math.round((await locator.boundingBox()).height);

async function open(pw) {
  await pw.addInitScript(() => {
    localStorage.setItem('juno:mode', 'dark');
    localStorage.setItem('juno:palette', 'standard');
    localStorage.setItem('juno:density', 'comfortable');
    localStorage.setItem('juno:text', 'base');
  });
  await pw.goto('/showcase/index.html', { waitUntil: 'networkidle' });
  await pw.evaluate(() => document.fonts.ready);
}

test.describe('tap targets', () => {
  test('the pointer type is the one this project claims', async ({ page: pw }, info) => {
    const want = EXPECT[info.project.name];
    await open(pw);
    const got = await pw.evaluate(() => ({
      coarse: matchMedia('(pointer: coarse)').matches,
      anyCoarse: matchMedia('(any-pointer: coarse)').matches,
      noHover: matchMedia('(hover: none)').matches,
      touchPoints: navigator.maxTouchPoints,
    }));
    expect(got.coarse).toBe(want.coarse);
    // hover:none rides the same emulation and gates table.css's row-action
    // fallback; if the two ever disagree, half the touch layer is untested.
    expect(got.noHover).toBe(want.coarse);
    expect(got.touchPoints > 0).toBe(want.coarse);
  });

  test('--juno-size-tap-min resolves to the expected token', async ({ page: pw }, info) => {
    const want = EXPECT[info.project.name];
    await open(pw);
    const tapMin = await pw.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--juno-size-tap-min').trim(),
    );
    expect(tapMin).toBe(want.tapMin);
  });

  test('.juno-btn holds the tap minimum', async ({ page: pw }, info) => {
    const want = EXPECT[info.project.name];
    await open(pw);
    // a plain .juno-btn — NOT .juno-btn--sm, which is deliberately below the
    // tap minimum for dense desktop toolbars (see button.css)
    const btn = pw.locator('button.juno-btn:not(.juno-btn--sm)').first();
    expect(await btn.evaluate((el) => getComputedStyle(el).minHeight)).toBe(want.tapMin);
    // computed style is the contract; the rendered box is the promise kept
    expect(await boxHeight(btn)).toBeGreaterThanOrEqual(parseInt(want.tapMin, 10));
  });

  test('.juno-menu__item holds the tap minimum', async ({ page: pw }, info) => {
    const want = EXPECT[info.project.name];
    await open(pw);
    // the menu ships in a closed popover — open it so the box is real
    await pw.evaluate(() => document.getElementById('o-menu').showPopover());
    const item = pw.locator('#o-menu .juno-menu__item').first();
    expect(await item.evaluate((el) => getComputedStyle(el).minBlockSize)).toBe(want.tapMin);
    expect(await boxHeight(item)).toBeGreaterThanOrEqual(parseInt(want.tapMin, 10));
  });

  test('.juno-btn--sm promotes to the tap minimum on touch, and --dense opts out', async ({
    page: pw,
  }, info) => {
    const want = EXPECT[info.project.name];
    await pw.addInitScript(() => {
      localStorage.setItem('juno:mode', 'dark');
      localStorage.setItem('juno:density', 'comfortable');
      localStorage.setItem('juno:text', 'base');
    });
    await pw.goto('/showcase/buttons.html', { waitUntil: 'networkidle' });
    await pw.evaluate(() => document.fonts.ready);

    // --sm is a DENSITY, not a tap-target decision: 24px on a fine pointer
    // (WCAG 2.2 AA 2.5.8 exactly), the comfortable target on a coarse one.
    // `:visible` because the showcase shell carries phone chrome that is
    // display:none at this viewport — a hidden node has computed style but no
    // box, and boundingBox() returns null rather than a short target.
    const sm = pw.locator('.juno-btn--sm:not(.juno-btn--dense):visible').first();
    expect(await sm.evaluate((el) => getComputedStyle(el).minHeight)).toBe(want.tapMin);
    expect(await boxHeight(sm)).toBeGreaterThanOrEqual(parseInt(want.tapMin, 10));

    // ...and the type and padding still shrink, or --sm stopped being --sm
    const base = pw.locator('.juno-btn:not(.juno-btn--sm):visible').first();
    const px = (loc, prop) => loc.evaluate((el, p) => parseFloat(getComputedStyle(el)[p]), prop);
    expect(await px(sm, 'fontSize')).toBeLessThan(await px(base, 'fontSize'));
    expect(await px(sm, 'paddingLeft')).toBeLessThan(await px(base, 'paddingLeft'));

    // --dense keeps 24px on BOTH pointer types — the opt-out is the whole
    // point, so a project where it silently agreed with --sm proves nothing
    const dense = pw.locator('.juno-btn--sm.juno-btn--dense:visible').first();
    expect(await dense.evaluate((el) => getComputedStyle(el).minHeight)).toBe('24px');
    if (want.coarse) {
      expect(await dense.evaluate((el) => getComputedStyle(el).minHeight)).not.toBe(want.tapMin);
    }
  });

  test('.juno-seg__opt holds the tap minimum', async ({ page: pw }, info) => {
    const want = EXPECT[info.project.name];
    // segmented lives on the forms page, not the index the other cases use
    await pw.addInitScript(() => {
      localStorage.setItem('juno:mode', 'dark');
      localStorage.setItem('juno:density', 'comfortable');
      localStorage.setItem('juno:text', 'base');
    });
    await pw.goto('/showcase/forms.html', { waitUntil: 'networkidle' });
    await pw.evaluate(() => document.fonts.ready);
    // the PAINTED box, not the label that wraps it: the label is a bare
    // inline-flex and takes its height from this span (20260826-025)
    const pill = pw.locator('.juno-seg__opt input + span').first();
    expect(await pill.evaluate((el) => getComputedStyle(el).minBlockSize)).toBe(want.tapMin);
    expect(await boxHeight(pill)).toBeGreaterThanOrEqual(parseInt(want.tapMin, 10));
    // and the label really did follow it — a floor on a box nobody taps is not
    // a tap target
    const label = pw.locator('.juno-seg__opt').first();
    expect(await boxHeight(label)).toBeGreaterThanOrEqual(parseInt(want.tapMin, 10));
  });

  test('.juno-input holds the tap minimum and the 16px font floor', async ({ page: pw }, info) => {
    const want = EXPECT[info.project.name];
    await open(pw);
    const input = pw.locator('input.juno-input').first();
    const style = await input.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { minBlockSize: cs.minBlockSize, fontSize: parseFloat(cs.fontSize) };
    });
    expect(style.minBlockSize).toBe(want.tapMin);
    expect(await boxHeight(input)).toBeGreaterThanOrEqual(parseInt(want.tapMin, 10));

    // The iOS focus-zoom floor. Only claimed under coarse — on a desktop
    // pointer the field stays at its design size, and asserting >=16 there
    // would pin a number junoui never promised.
    if (want.inputFontMin) {
      expect(style.fontSize).toBeGreaterThanOrEqual(want.inputFontMin);
    } else {
      expect(style.fontSize).toBeLessThan(16);
    }
  });
});
