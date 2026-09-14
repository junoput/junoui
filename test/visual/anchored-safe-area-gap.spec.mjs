// The DOCUMENTED gap in docs/safe-area.md: anchored surfaces can sit under a
// sensor housing, and no component-level fix exists (20260914-072).
//
// THIS TEST ASSERTS A DEFECT, WHICH NEEDS A JUSTIFICATION. It is not here to
// keep the defect. It is here because `docs/safe-area.md` now makes a specific
// factual claim — 55px of an edge-anchored panel is under the housing at
// 844x390 with 59px insets — and a prose claim about geometry is exactly the
// kind that goes stale silently. The same shape as the declared-exception check
// in scroll-region-tabstop.spec.mjs: an exception on file has to keep matching
// the world, or it is a claim about nothing.
//
// SO A RED HERE IS NOT A REGRESSION — IT IS THE GAP CLOSING. If a browser
// starts resolving anchor-position overflow against the safe area, or someone
// lands a fix, this goes red and the correct response is to DELETE this file and
// rewrite that section of the doc. The failure message says so.
//
// What it does NOT assert: that the panel is at exactly 840. That would break on
// any unrelated width change. It asserts the property the doc claims — the panel
// crosses into the housing — and nothing narrower.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const CSS = readFileSync(join(ROOT, 'dist/css/juno.css'), 'utf8');
const DOC = readFileSync(join(ROOT, 'docs/safe-area.md'), 'utf8');

const VW = 844;
const VH = 390;
const INSET = 59;

const page = (panel) => `<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${CSS}</style>
<style>:root{--juno-safe-left:${INSET}px;--juno-safe-right:${INSET}px;}</style>
<div style="position:absolute;inset-inline-end:4px;inset-block-start:40px">
  <button class="juno-btn" popovertarget="p" id="t">open</button>
  ${panel}
</div>`;

const PANELS = {
  '.juno-popover': '<div class="juno-popover" id="p" popover>content</div>',
  '.juno-menu':
    '<ul class="juno-menu" id="p" popover role="menu"><li><button class="juno-menu__item" role="menuitem">Import</button></li></ul>',
};

for (const [selector, markup] of Object.entries(PANELS)) {
  test(`${selector} still crosses into the housing — the gap doc describes`, async ({
    page: pw,
  }) => {
    await pw.setViewportSize({ width: VW, height: 390 });
    await pw.setContent(page(markup));
    await pw.click('#t');
    const right = await pw.evaluate(
      (s) => Math.round(document.querySelector(s).getBoundingClientRect().right),
      selector,
    );

    // Vacuity floor: the panel must be open and laid out. A closed popover
    // reports a zero box, which would satisfy "does not cross the housing" and
    // turn this into a test that passes because nothing rendered.
    expect(right, 'the panel did not open — this test measured nothing').toBeGreaterThan(0);

    expect(
      right,
      `${selector} no longer crosses into the safe area. That is GOOD NEWS and a ` +
        `RED TEST: 20260914-072 has been fixed or the browser changed. Delete ` +
        `this file and rewrite the anchored-surfaces section of docs/safe-area.md, ` +
        `which still tells consumers to position these themselves.`,
    ).toBeGreaterThan(VW - INSET);
  });
}

/**
 * The tooltip needs its own fixture, and two details in it are load-bearing.
 *
 * 1. The anchor-positioning rules apply ONLY to `.juno-tooltip__bubble[popover]`
 *    — the top-layer mode. A tooltip has no `popovertarget` invoker, so nothing
 *    supplies an implicit anchor and `position-anchor` must be set the way
 *    `showcase/app.js`'s `initTooltips()` does. A fixture without that measures
 *    the wrapper-relative CSS-only mode and returns plausible numbers rather
 *    than an error — which happened once, and the numbers were nearly filed.
 * 2. `page.setContent()` does NOT navigate. It replaces the document in place
 *    and the browser's top-layer stack survives, so a second fixture's popover
 *    can silently fail to open. Hence the `about:blank` between them.
 *
 * Both are asserted rather than assumed, below.
 */
/* THE TWO INLINE PLACEMENTS LEFT THIS LIST WHEN 20260914-155 LANDED, and the
 * reason is the interesting part rather than the removal.
 *
 * Giving `.juno-tooltip__bubble[popover]` `flip-block, flip-inline` — the set
 * popover.css and menu.css always had — moves a `--right` bubble off the edge
 * to the trigger's other side. At THIS fixture's 59px inset that lands clear of
 * the housing, so "still crosses" went red exactly as this file's header
 * promises it should.
 *
 * IT IS NOT A SAFE-AREA FIX, AND THE PROBE BELOW IS WHY THAT CLAIM IS SAFE TO
 * MAKE. The flipped position is inset-INDEPENDENT — it is decided by the
 * trigger's and bubble's widths, not by `--juno-safe-*`, which anchor
 * positioning cannot read:
 *
 *     inset  59   --right 636..776  clear      --left 68..208  clear
 *     inset  80   --right 636..776  CROSSES    --left 68..208  CROSSES
 *     inset 100   --right 636..776  CROSSES    --left 68..208  CROSSES
 *
 * Identical boxes at every inset. The 59px case clears by five pixels of
 * arithmetic coincidence. So the gap is unchanged in kind and the two cases are
 * pinned below at an inset where the coincidence does not save them.
 */
const TIP_CASES = [
  { mod: '', at: 'top', label: 'default (block-start)' },
  { mod: 'juno-tooltip__bubble--bottom', at: 'bottom', label: '--bottom' },
];

/** The inline placements, at a housing wide enough that flip-inline's fixed
 *  landing spot does not clear it. Same property as TIP_CASES, one variable
 *  moved — if this ever goes green, anchor positioning has learned about
 *  `env()` and the whole file should go. */
const WIDE_INSET = 80;
const TIP_CASES_WIDE = [
  { mod: 'juno-tooltip__bubble--right', at: 'right', label: '--right' },
  { mod: 'juno-tooltip__bubble--left', at: 'left', label: '--left' },
];

/** Trigger placed near the edge the bubble opens TOWARD.
 *
 *  Measuring `--bottom` against a trigger near the TOP reads "under the housing"
 *  whatever the placement's own arithmetic does, because the trigger itself is
 *  already inside the unsafe band — a fixture that tests the wrong thing and
 *  reports a pass. Sizes are explicit pixels: this box has no fonts, and a
 *  font-dependent trigger rect corrupts the anchor geometry itself. */
const TIP_POS = {
  right: 'inset-inline-end:4px;inset-block-start:160px',
  left: 'inset-inline-start:4px;inset-block-start:160px',
  top: `inset-inline-start:400px;inset-block-start:${INSET + 4}px`,
  bottom: `inset-inline-start:400px;inset-block-end:${INSET + 4}px`,
  // the control's trigger: nowhere near any edge
  centre: 'inset-inline-start:400px;inset-block-start:180px',
};

const tipPage = (
  mod,
  at,
  safe,
) => `<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${CSS}</style>
<style>:root{--juno-safe-left:${safe}px;--juno-safe-right:${safe}px;--juno-safe-top:${safe}px;--juno-safe-bottom:${safe}px;}
  #t{inline-size:60px;block-size:24px;}
  #b{inline-size:140px;block-size:28px;}</style>
<span class="juno-tooltip" style="position:absolute;${TIP_POS[at]}">
  <button tabindex="0" id="t"></button>
  <span class="juno-tooltip__bubble ${mod}" id="b" role="tooltip"></span>
</span>`;

/** Open the bubble the way the documented enhancer does, and PROVE it opened. */
async function openTip(pw) {
  const ok = await pw.evaluate(() => {
    const trigger = document.getElementById('t');
    const bubble = document.getElementById('b');
    trigger.style.anchorName = '--juno-tip-probe';
    bubble.style.positionAnchor = '--juno-tip-probe';
    bubble.popover = 'hint';
    bubble.showPopover();
    return {
      open: bubble.matches(':popover-open'),
      anchor: getComputedStyle(bubble).positionAnchor.trim(),
    };
  });
  // The apparatus check. Without it a closed bubble reports a zero box, and a
  // zero box satisfies every "does not cross the housing" assertion below.
  expect(ok.open, 'the bubble never entered the top layer — this measured the CSS-only mode').toBe(
    true,
  );
  expect(ok.anchor, 'position-anchor did not resolve — the bubble is not anchored').toBe(
    '--juno-tip-probe',
  );
}

for (const { mod, at, label } of TIP_CASES) {
  test(`.juno-tooltip__bubble ${label} still crosses into the housing`, async ({ page: pw }) => {
    await pw.setViewportSize({ width: VW, height: VH });
    await pw.goto('about:blank'); // setContent does not reset the top-layer stack
    await pw.setContent(tipPage(mod, at, INSET));
    await openTip(pw);
    const b = await pw.evaluate(() => {
      const r = document.getElementById('b').getBoundingClientRect();
      return {
        l: Math.round(r.left),
        r: Math.round(r.right),
        t: Math.round(r.top),
        btm: Math.round(r.bottom),
      };
    });

    const crosses = b.l < INSET || b.r > VW - INSET || b.t < INSET || b.btm > VH - INSET;
    expect(
      crosses,
      `.juno-tooltip__bubble ${label} no longer crosses into the safe area ` +
        `(${JSON.stringify(b)}). GOOD NEWS and a RED TEST — see the header.`,
    ).toBe(true);
  });
}

for (const { mod, at, label } of TIP_CASES_WIDE) {
  test(`.juno-tooltip__bubble ${label} still crosses an ${WIDE_INSET}px housing`, async ({
    page: pw,
  }) => {
    await pw.setViewportSize({ width: VW, height: VH });
    await pw.goto('about:blank');
    await pw.setContent(tipPage(mod, at, WIDE_INSET));
    await openTip(pw);
    const b = await pw.evaluate(() => {
      const r = document.getElementById('b').getBoundingClientRect();
      return { l: Math.round(r.left), r: Math.round(r.right) };
    });
    const crosses = b.l < WIDE_INSET || b.r > VW - WIDE_INSET;
    expect(
      crosses,
      `.juno-tooltip__bubble ${label} no longer crosses an ${WIDE_INSET}px housing ` +
        `(${JSON.stringify(b)}). GOOD NEWS and a RED TEST — see the header.`,
    ).toBe(true);
  });
}

test('flip-inline lands in the same place whatever the inset — it cannot read one', async ({
  page: pw,
}) => {
  // The control for the comment above TIP_CASES. Without it, "the 59px case
  // clears by coincidence" is an inference from two numbers; with it, the
  // box is measured at three insets and is identical at all of them, which is
  // the only evidence that the placement is not safe-area-aware.
  await pw.setViewportSize({ width: VW, height: VH });
  const boxes = [];
  for (const inset of [INSET, WIDE_INSET, 100]) {
    await pw.goto('about:blank');
    await pw.setContent(tipPage('juno-tooltip__bubble--right', 'right', inset));
    await openTip(pw);
    boxes.push(
      await pw.evaluate(() => {
        const r = document.getElementById('b').getBoundingClientRect();
        return `${Math.round(r.left)}..${Math.round(r.right)}`;
      }),
    );
  }
  expect(new Set(boxes).size, `the flipped bubble moved with the inset: ${boxes}`).toBe(1);
});

test('a centred trigger reads clean — the fixture is not reporting the housing for everything', async ({
  page: pw,
}) => {
  // The control. Without it, a harness that returned "crosses the housing" for
  // any input would satisfy all four cases above and prove nothing.
  await pw.setViewportSize({ width: VW, height: VH });
  await pw.goto('about:blank');
  await pw.setContent(tipPage('', 'centre', INSET));
  await openTip(pw);
  const b = await pw.evaluate(() => {
    const r = document.getElementById('b').getBoundingClientRect();
    return {
      l: Math.round(r.left),
      r: Math.round(r.right),
      t: Math.round(r.top),
      btm: Math.round(r.bottom),
    };
  });
  expect(b.l, 'control crossed the left inset').toBeGreaterThanOrEqual(INSET);
  expect(b.r, 'control crossed the right inset').toBeLessThanOrEqual(VW - INSET);
  expect(b.t, 'control crossed the top inset').toBeGreaterThanOrEqual(INSET);
  expect(b.btm, 'control crossed the bottom inset').toBeLessThanOrEqual(VH - INSET);
});

test('the doc still carries the claim this file pins', async () => {
  // The other direction. If someone rewrites that section without touching the
  // CSS, these assertions keep passing while documenting nothing — the exception
  // and the claim have to move together.
  expect(DOC, 'safe-area.md no longer names the ticket').toMatch(/20260914-072/);
  expect(DOC, 'safe-area.md no longer states the anchored-surface gap').toMatch(
    /ANCHORED SURFACES ARE ABSENT FROM THIS TABLE/,
  );
});
