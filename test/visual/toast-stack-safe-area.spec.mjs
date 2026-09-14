// The toast stack's own bottom/inline edges must clear the safe-area insets
// (20260914-071), and the assertion has to look at a REAL toast inside the
// stack — the component the CSS actually positions.
//
// Defect 1 (fixed in 84fca2c): `--juno-toast-edge-offset` was declared on
// `.juno-toast` (a CHILD of `.juno-toast-stack`) and consumed on the stack.
// Custom properties inherit downward, so on the stack the property was
// undefined, the var() had no fallback, `inset-block-end` was invalid at
// computed-value time and fell back to `auto` — the stack rendered at the
// TOP of the page on every phone-width viewport. Measured before the fix at
// 390x844, safe-bottom 21: computed inset-block-end 798.406px, the stack's
// bottom edge at y=46.
//
// Nothing existing could have caught this. test/build.test.mjs's "every var
// resolves" guard checks a property is defined SOMEWHERE (it is, just on the
// wrong element) — it cannot check the element that reads it is the element
// it is defined on. The showcase's own stacks render EMPTY (filled by JS on
// click), so no visual baseline has ever contained a toast inside its stack.
// So this spec puts a real `.juno-toast` inside `.juno-toast-stack` and reads
// the STACK's own bounding box, not the token's resolved value — asserting
// the token resolves to something is exactly the check that already exists
// and already missed this.
//
// Defect 2: the token was referenced only inside the <=639.98px media query;
// the default (wider) corner placement used a flat --juno-space-24 on both
// axes with no inset at all, so a landscape phone (844 wide) took the branch
// with no safe-area handling in the orientation with the largest horizontal
// inset. Measured before the fix at 844x390, insets 59/21: stack right edge
// 820 against a housing spanning 785..844.
//
// Defect 3: the sibling placements (`--top`, `--start`) were still on flat
// tokens even after defects 1/2 — a ticket that names N instances gets N
// fixed, and this ticket named two. `--top` is the worse of the two: in
// portrait the top edge is exactly where the Dynamic Island sits, and
// base.css's own letterbox rule says the top inset is real and zeroing it
// would be actively harmful. Measured before the fix: landscape `--start` at
// left 24 against a left housing spanning 0..59; landscape `--top` at top 24
// against safe-top 59; portrait `--top` at top 12 against safe-top 59.
//
// Insets are driven by hand: real `env()` is 0 in headless chromium.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const CSS = readFileSync(join(ROOT, 'dist/css/juno.css'), 'utf8');

const page = (
  { safeTop = 0, safeRight = 0, safeBottom = 0, safeLeft = 0 },
  modifier = '',
) => `<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${CSS}</style>
<style>:root{
  --juno-safe-top:${safeTop}px;--juno-safe-right:${safeRight}px;
  --juno-safe-bottom:${safeBottom}px;--juno-safe-left:${safeLeft}px;
}</style>
<div class="juno-toast-stack ${modifier}" id="s" aria-live="polite">
  <div class="juno-toast juno--nominal" role="status">
    <span class="juno-toast__icon" aria-hidden="true">✓</span>
    <span class="juno-toast__text">Build promoted.</span>
    <button class="juno-toast__close" aria-label="Dismiss">✕</button>
  </div>
</div>`;

const box = (pw) =>
  pw.evaluate(() => {
    const el = document.getElementById('s');
    const b = el.getBoundingClientRect();
    return {
      top: Math.round(b.top),
      bottom: Math.round(b.bottom),
      left: Math.round(b.left),
      right: Math.round(b.right),
    };
  });

test.describe('narrow viewport (phone, portrait) — defect 1', () => {
  const VH = 844;
  const SAFE_BOTTOM = 21;

  test('the stack sits at the bottom of the screen, not the top', async ({ page: pw }) => {
    await pw.setViewportSize({ width: 390, height: VH });
    await pw.setContent(page({ safeBottom: SAFE_BOTTOM }));
    const r = await box(pw);

    // The regression: inset-block-end fell back to `auto`, and the stack's
    // static position put it near the top. A stack anywhere in the top half
    // of the viewport is the bug, not a rounding difference.
    expect(r.top, 'the stack rendered in the top half of the screen').toBeGreaterThan(VH / 2);
    expect(r.bottom, 'the stack is not flush with the bottom, clear of the home indicator').toBe(
      VH - SAFE_BOTTOM - 12,
    );
  });

  test('is unchanged where there is no inset', async ({ page: pw }) => {
    await pw.setViewportSize({ width: 390, height: VH });
    await pw.setContent(page({}));
    const r = await box(pw);
    expect(r.bottom, 'the design gap changed on a device with no safe area').toBe(VH - 12);
  });
});

test.describe('wide/landscape viewport — defect 2', () => {
  const VW = 844;
  const VH = 390;
  const SAFE_BOTTOM = 21;
  const SAFE_RIGHT = 59;

  test('the stack clears the sensor housing on the trailing edge', async ({ page: pw }) => {
    await pw.setViewportSize({ width: VW, height: VH });
    await pw.setContent(page({ safeBottom: SAFE_BOTTOM, safeRight: SAFE_RIGHT }));
    const r = await box(pw);

    expect(r.right, 'the stack runs under the right-hand housing').toBeLessThanOrEqual(
      VW - SAFE_RIGHT,
    );
    expect(r.bottom, 'the stack runs under the bottom housing').toBeLessThanOrEqual(
      VH - SAFE_BOTTOM,
    );
  });

  test('is unchanged where there are no insets', async ({ page: pw }) => {
    await pw.setViewportSize({ width: VW, height: VH });
    await pw.setContent(page({}));
    const r = await box(pw);
    expect(r.right, 'the design gap changed on a device with no safe area').toBe(VW - 24);
    expect(r.bottom, 'the design gap changed on a device with no safe area').toBe(VH - 24);
  });
});

test.describe('sibling placements (--top, --start) — defect 3', () => {
  test('landscape --top clears the top housing', async ({ page: pw }) => {
    const VW = 844;
    const VH = 390;
    const SAFE_TOP = 59;
    await pw.setViewportSize({ width: VW, height: VH });
    await pw.setContent(page({ safeTop: SAFE_TOP }, 'juno-toast-stack--top'));
    const r = await box(pw);
    expect(r.top, 'the stack runs under the top housing').toBeGreaterThanOrEqual(SAFE_TOP);
  });

  test('landscape --start clears the left housing', async ({ page: pw }) => {
    const VW = 844;
    const VH = 390;
    const SAFE_LEFT = 59;
    await pw.setViewportSize({ width: VW, height: VH });
    await pw.setContent(page({ safeLeft: SAFE_LEFT }, 'juno-toast-stack--start'));
    const r = await box(pw);
    expect(r.left, 'the stack runs under the left housing').toBeGreaterThanOrEqual(SAFE_LEFT);
  });

  test('portrait --top clears the Dynamic Island', async ({ page: pw }) => {
    const VW = 390;
    const VH = 844;
    const SAFE_TOP = 59;
    await pw.setViewportSize({ width: VW, height: VH });
    await pw.setContent(page({ safeTop: SAFE_TOP }, 'juno-toast-stack--top'));
    const r = await box(pw);
    expect(r.top, 'the stack runs under the Dynamic Island').toBeGreaterThanOrEqual(SAFE_TOP);
  });

  test('--top and --start are unchanged where there is no inset', async ({ page: pw }) => {
    const VW = 844;
    const VH = 390;
    await pw.setViewportSize({ width: VW, height: VH });

    await pw.setContent(page({}, 'juno-toast-stack--top'));
    expect((await box(pw)).top, 'the top design gap changed on a device with no safe area').toBe(
      24,
    );

    await pw.setContent(page({}, 'juno-toast-stack--start'));
    expect((await box(pw)).left, 'the start design gap changed on a device with no safe area').toBe(
      24,
    );
  });
});
