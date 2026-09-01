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
//     sizes off it inherits: .juno-btn, .juno-menu__item, .juno-input,
//     .juno-seg__opt, .juno-pagination__item.
//
// A CONTROL NOT NAMED HERE IS NOT CHECKED. Pagination sat at 44x32 on touch for
// weeks because it was absent from the table below, not because any rule was
// wrong — the promotion reached its inline axis and its block axis was a hard
// 32px (20260815-040). When a component grows a tap surface, it gets a row.
//   - .juno-input gets `font-size: max(16px, …)`, the floor that stops iOS
//     Safari zooming the page onto a focused field.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// This file reads ITSELF, to assert the showcase locators stayed scoped — see
// the specimen helper below and 20260826-030.
const SPEC = fileURLToPath(import.meta.url);

const bundle = readFileSync(
  join(dirname(dirname(dirname(fileURLToPath(import.meta.url)))), 'dist/css/juno.css'),
  'utf8',
);

// Per-project expectations. Absolute values, not "bigger than before": the
// point is to pin the contract, and 24 / 44 are the token values themselves
// (tokens/core/size.json → size.tap.min / size.tap.comfortable).
const EXPECT = {
  chromium: { coarse: false, tapMin: '24px', inputFontMin: 0, paginationBlock: '32px' },
  'chromium-coarse': { coarse: true, tapMin: '44px', inputFontMin: 16, paginationBlock: '44px' },
};

// Chromium reports a fractional box height when a control lands on a
// fractional layout position — 43.99999809265137 for a 44px menu item, on
// roughly 2 runs in 8. Round before comparing: the sub-pixel is a rendering
// artefact, not a short tap target. Caught with `--repeat-each=4` before this
// shipped, which is the only reason it is not a future intermittent red.
const boxHeight = async (locator) => Math.round((await locator.boundingBox()).height);

// EVERY showcase locator is scoped to `main`, and that is the fix for
// 20260826-030 rather than a tidy-up.
//
// app.js injects the showcase's own chrome — a phone navbar, a pillbar —
// around each page, and `.juno-navbar__actions > *` carries
// `min-block-size: var(--juno-size-tap-min)` (navbar.css:102). So the FIRST
// VISIBLE `.juno-btn--sm` on every showcase page is a chrome button that is
// 44px for a legitimate reason that has nothing to do with the rule under
// test. A `.first()` locator picked it, and the assertion passed with the
// promotion it was written to check deleted from the bundle.
//
// Measured: with the coarse `--sm` promotion stripped, the same markup reports
// 24px off the bundle and 44px off /showcase/buttons.html — because the two
// were never looking at the same element. Not a stylesheet override; a
// selector pointing at the wrong button.
//
// `main` contains the page's own specimens and none of the injected chrome, so
// scoping there is what makes a showcase assertion mean what it says. The
// `--sm` case reads the built bundle directly, which is stronger still.
const specimen = (pw, selector) => pw.locator(`main ${selector}`);

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

  test("the specimens measured are the page's own, not the injected chrome", () => {
    // THE GUARD FOR 20260826-030, and it has to exist separately because
    // scoping is not self-guarding: removing `main ` from the helper leaves
    // every assertion in this file GREEN. The chrome button happens to satisfy
    // them — `.juno-navbar__actions > *` carries min-block-size:
    // var(--juno-size-tap-min) (navbar.css:102) — so an unscoped locator
    // measures a 44px element for a reason unrelated to the rule under test.
    //
    // That is how a tap-target assertion passed with the coarse --sm promotion
    // deleted from the bundle: 24px off the bundle, 44px off the showcase, two
    // different buttons.
    expect(
      readFileSync(SPEC, 'utf8'),
      'the showcase locator helper is no longer scoped to main',
    ).toMatch(/const specimen = \(pw, selector\) => pw\.locator\(`main \$\{selector\}`\)/);

    // ...and nothing in this file reaches for a bare locator on a junoui class,
    // which is the shape that picked up chrome in the first place.
    const stray = [
      ...readFileSync(SPEC, 'utf8').matchAll(/pw\.locator\('([^']*juno-[^']*)'\)/g),
    ].map((m) => m[1]);
    expect(stray, 'a junoui class is being located outside the specimen helper').toEqual([]);
  });

  test('.juno-btn holds the tap minimum', async ({ page: pw }, info) => {
    const want = EXPECT[info.project.name];
    await open(pw);
    // a plain .juno-btn — NOT .juno-btn--sm, which is deliberately below the
    // tap minimum for dense desktop toolbars (see button.css)
    const btn = specimen(pw, 'button.juno-btn:not(.juno-btn--sm)').first();
    expect(await btn.evaluate((el) => getComputedStyle(el).minHeight)).toBe(want.tapMin);
    // computed style is the contract; the rendered box is the promise kept
    expect(await boxHeight(btn)).toBeGreaterThanOrEqual(parseInt(want.tapMin, 10));
  });

  test('.juno-menu__item holds the tap minimum', async ({ page: pw }, info) => {
    const want = EXPECT[info.project.name];
    await open(pw);
    // the menu ships in a closed popover — open it so the box is real
    await pw.evaluate(() => document.getElementById('o-menu').showPopover());
    const item = specimen(pw, '#o-menu .juno-menu__item').first();
    expect(await item.evaluate((el) => getComputedStyle(el).minBlockSize)).toBe(want.tapMin);
    expect(await boxHeight(item)).toBeGreaterThanOrEqual(parseInt(want.tapMin, 10));
  });

  test('.juno-btn--sm promotes to the tap minimum on touch, and --dense opts out', async ({
    page: pw,
  }, info) => {
    const want = EXPECT[info.project.name];
    // Against the BUILT BUNDLE, not the showcase, and that is not a style
    // preference. Measured 2026-08-26 with the coarse promotion deleted from
    // button.css: the same markup under the same emulation reports 24px off
    // the bundle (the defect, correctly) and 44px off /showcase/buttons.html.
    // Something in the demo page already holds the height, so a showcase-based
    // assertion here passes whether junoui promotes or not — it was written
    // that way first and mutation testing is the only reason that is known.
    // Filed as 20260826-030. The cases above stay on the showcase because
    // their controls are 44px either way, so nothing masks them.
    await pw.setContent(
      `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${bundle}</style>
       <button class="juno-btn juno-btn--sm juno-btn--ghost" id="sm">EDIT</button>
       <button class="juno-btn juno-btn--sm juno-btn--dense juno-btn--ghost" id="dense">TRIM</button>
       <button class="juno-btn" id="base">SAVE</button>`,
    );
    const read = (id) =>
      pw.evaluate((i) => {
        const el = document.getElementById(i);
        const cs = getComputedStyle(el);
        return {
          minHeight: cs.minHeight,
          box: Math.round(el.getBoundingClientRect().height),
          fontSize: parseFloat(cs.fontSize),
          padInline: parseFloat(cs.paddingLeft),
        };
      }, id);

    // --sm is a DENSITY, not a tap-target decision: 24px on a fine pointer
    // (WCAG 2.2 AA 2.5.8 exactly), the comfortable target on a coarse one.
    const sm = await read('sm');
    expect(sm.minHeight).toBe(want.tapMin);
    expect(sm.box).toBeGreaterThanOrEqual(parseInt(want.tapMin, 10));

    // ...and type and padding still shrink, or --sm stopped being --sm
    const base = await read('base');
    expect(sm.fontSize).toBeLessThan(base.fontSize);
    expect(sm.padInline).toBeLessThan(base.padInline);

    // --dense opts back out, on both pointer types. Asserting it on the fine
    // project too is what proves the opt-out is a real branch rather than a
    // class that happens to agree with --sm wherever it was checked.
    const dense = await read('dense');
    expect(dense.minHeight).toBe('24px');
    expect(dense.box).toBe(24);
    if (want.coarse) expect(dense.minHeight).not.toBe(want.tapMin);
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
    const pill = specimen(pw, '.juno-seg__opt input + span').first();
    expect(await pill.evaluate((el) => getComputedStyle(el).minBlockSize)).toBe(want.tapMin);
    expect(await boxHeight(pill)).toBeGreaterThanOrEqual(parseInt(want.tapMin, 10));
    // and the label really did follow it — a floor on a box nobody taps is not
    // a tap target
    const label = specimen(pw, '.juno-seg__opt').first();
    expect(await boxHeight(label)).toBeGreaterThanOrEqual(parseInt(want.tapMin, 10));
  });

  test('.juno-pagination__item holds the tap minimum on BOTH axes', async ({ page: pw }, info) => {
    // 20260815-040. The shipped defect was 44 WIDE and 32 TALL on a coarse
    // pointer: `min-inline-size` read --juno-size-tap-min and took the coarse
    // promotion, while `block-size` was a hard 32px that could not. Clears WCAG
    // 2.2 2.5.8 (24px), misses 2.5.5 (44px) that every other control here meets.
    //
    // It survived because THIS FILE never looked. The expectation table listed
    // .juno-btn, .juno-input and .juno-menu__item, so the numeric coarse check
    // that found the 16px input floor walked straight past pagination — a guard
    // is only a guard for the controls it names.
    //
    // Against the built bundle for the reason the --sm case is: a showcase page
    // carries chrome that can hold a height for unrelated reasons (20260826-030).
    await pw.setContent(
      `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${bundle}</style>
       <nav class="juno-pagination" aria-label="Pagination">
         <button class="juno-pagination__item" id="prev" aria-label="Previous" disabled>&lsaquo;</button>
         <button class="juno-pagination__item" id="cur" aria-current="page">1</button>
         <button class="juno-pagination__item" id="wide">1234</button>
       </nav>`,
    );
    const want = EXPECT[info.project.name];
    const read = (id) =>
      pw.evaluate((i) => {
        const el = document.getElementById(i);
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          minBlockSize: cs.minBlockSize,
          minInlineSize: cs.minInlineSize,
          w: Math.round(r.width),
          h: Math.round(r.height),
        };
      }, id);

    // The block axis is the one that was broken. On a fine pointer it holds the
    // component's own 32px design height — NOT the 24px token — because reading
    // the token straight would have shrunk desktop pagination to fix a phone.
    const cur = await read('cur');
    expect(cur.minBlockSize).toBe(want.paginationBlock);
    expect(cur.minInlineSize).toBe(want.tapMin);

    // ...and the rendered box on BOTH axes, which is the assertion the original
    // guard could not have made because it only had one axis in it.
    const floor = parseInt(want.tapMin, 10);
    for (const id of ['prev', 'cur', 'wide']) {
      const box = await read(id);
      expect(box.h, `${id} is short on the block axis: ${box.w}x${box.h}`).toBeGreaterThanOrEqual(
        floor,
      );
      expect(box.w, `${id} is short on the inline axis: ${box.w}x${box.h}`).toBeGreaterThanOrEqual(
        floor,
      );
    }

    // A floor, not a fixed size: a wide label still grows past it, or the fix
    // traded one hard number for another.
    expect((await read('wide')).w).toBeGreaterThan((await read('cur')).w);

    // ON THE TWO BOX ASSERTIONS ABOVE, because a mutation run says something
    // about them that is worth not re-deriving. Deleting the INLINE one alone
    // survives: on a healthy item the computed `minInlineSize` check and the
    // `wide > cur` check already cover that axis, so nothing is left uncovered.
    // That does not make it decoration. The distinction this file draws
    // elsewhere — "computed style is the contract; the rendered box is the
    // promise kept" — is real, and `scale: 0.5` on the item is the input that
    // separates them: every computed floor still reads 44px, `wide` is still
    // wider than `cur`, and the painted target is 22x16. That is caught here
    // and ONLY here, and survives with both box assertions removed. Measured,
    // not argued.
  });

  test('.juno-input holds the tap minimum and the 16px font floor', async ({ page: pw }, info) => {
    const want = EXPECT[info.project.name];
    await open(pw);
    const input = specimen(pw, 'input.juno-input').first();
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
