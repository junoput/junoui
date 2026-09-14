// The toast stack's own bottom edge must clear the safe-area inset
// (20260914-071), and the assertion has to look at a REAL toast inside the
// stack — the component the CSS actually positions.
//
// `--juno-toast-edge-offset` was declared on `.juno-toast` (a CHILD of
// `.juno-toast-stack`) and consumed on the stack. Custom properties inherit
// downward, so on the stack the property was undefined, the var() had no
// fallback, `inset-block-end` was invalid at computed-value time and fell
// back to `auto` — the stack rendered at the TOP of the page on every
// phone-width viewport. Measured before the fix at 390x844, safe-bottom 21:
// computed inset-block-end 798.406px, the stack's bottom edge at y=46.
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
// Insets are driven by hand: real `env()` is 0 in headless chromium.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const CSS = readFileSync(join(ROOT, 'dist/css/juno.css'), 'utf8');

const page = (safeBottom) => `<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${CSS}</style>
<style>:root{--juno-safe-bottom:${safeBottom}px;}</style>
<div class="juno-toast-stack" id="s" aria-live="polite">
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
    return { top: Math.round(b.top), bottom: Math.round(b.bottom) };
  });

test.describe('narrow viewport (phone, portrait)', () => {
  const VH = 844;
  const SAFE_BOTTOM = 21;

  test('the stack sits at the bottom of the screen, not the top', async ({ page: pw }) => {
    await pw.setViewportSize({ width: 390, height: VH });
    await pw.setContent(page(SAFE_BOTTOM));
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
    await pw.setContent(page(0));
    const r = await box(pw);
    expect(r.bottom, 'the design gap changed on a device with no safe area').toBe(VH - 12);
  });
});
