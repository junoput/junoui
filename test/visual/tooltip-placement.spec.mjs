// An inline tooltip placement must not cover its own trigger (20260914-155).
//
// `.juno-tooltip__bubble[popover]` declared `position-try-fallbacks: flip-block`
// on the base rule that every placement modifier inherits. So `--right` and
// `--left` — the two placements whose whole job is inline — were the only ones
// with no inline correction available. A `--right` bubble on a trigger 4px from
// the right edge was clamped flush to the viewport and sat ON TOP of the
// trigger that summoned it.
//
// ASSERT THE RELATIONSHIP, NOT THE PIXEL. The fix's measured numbers were
// 777..844 -> 753..820 at 844px wide, but pinning 753 pins the font metrics and
// the bubble's width along with the placement. What must stay true is that the
// bubble and its trigger do not overlap, which is false before the change and
// true after it, at any width.
//
// NOT A SAFE-AREA TEST. These numbers are identical with `--juno-safe-*` at 0
// and at 59px, because anchor positioning resolves overflow against the
// VIEWPORT, and the viewport spans under a sensor housing. 20260914-072 is the
// ticket for that, and it is still open — a bubble can satisfy every assertion
// here and still sit under a housing.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const bundle = readFileSync(
  join(dirname(dirname(dirname(fileURLToPath(import.meta.url)))), 'dist/css/juno.css'),
  'utf8',
);

/** Opens one bubble anchored to one trigger, the way `initTooltips()` does. */
async function place(pw, { side, modifier }) {
  await pw.setViewportSize({ width: 844, height: 390 });
  await pw.setContent(`<style>${bundle}
    #trig { position: fixed; top: 40px; width: 20px; height: 20px; ${side} }
  </style>
  <button id="trig">T</button>
  <div id="bubble" class="juno-tooltip__bubble${modifier}" popover="hint" role="tooltip">Tip text</div>`);
  return pw.evaluate(() => {
    const t = document.getElementById('trig');
    const b = document.getElementById('bubble');
    t.style.anchorName = '--tip';
    b.style.positionAnchor = '--tip';
    b.showPopover();
    const r = (el) => {
      const q = el.getBoundingClientRect();
      return { left: Math.round(q.left), right: Math.round(q.right), width: Math.round(q.width) };
    };
    return { trigger: r(t), bubble: r(b) };
  });
}

const overlaps = (a, b) => a.left < b.right && b.left < a.right;

test('the fixture really opens a bubble in the top layer (vacuity floor)', async ({ page }) => {
  // Without this, a bubble that never opened has a zero rect, never overlaps
  // anything, and every assertion below passes for the wrong reason. The
  // withdrawn measurement on 20260914-072 was exactly that shape: a fixture
  // missing the `popover` attribute returned plausible numbers from the
  // CSS-only wrapper mode, which is not the mode under test.
  const { bubble, trigger } = await place(page, { side: 'left: 412px;', modifier: '' });
  expect(bubble.width).toBeGreaterThan(20);
  expect(trigger.width).toBe(20);
});

for (const [name, side, modifier] of [
  ['--right at the right edge', 'right: 4px;', ' juno-tooltip__bubble--right'],
  ['--left at the left edge', 'left: 4px;', ' juno-tooltip__bubble--left'],
]) {
  test(`an inline tooltip does not cover its trigger: ${name}`, async ({ page }) => {
    const { bubble, trigger } = await place(page, { side, modifier });
    expect(
      overlaps(bubble, trigger),
      `bubble ${bubble.left}..${bubble.right} overlaps trigger ` +
        `${trigger.left}..${trigger.right} — the inline placement had nowhere to ` +
        'go and was clamped onto its own trigger. The base rule needs ' +
        '`position-try-fallbacks: flip-block, flip-inline`, as popover.css and ' +
        'menu.css have always had.',
    ).toBe(false);
  });
}

test('a centred trigger is unaffected — the control', async ({ page }) => {
  // The candidate fix rejected on 20260914-072 (a margin on the panel) also
  // corrected both edges, and was wrong because it moved every popover in the
  // document. An edge fix that cannot be told apart from a global shift is not
  // a fix, so the control is the load-bearing case here, not the two above.
  const { bubble, trigger } = await place(page, {
    side: 'left: 412px;',
    modifier: ' juno-tooltip__bubble--right',
  });
  expect(overlaps(bubble, trigger)).toBe(false);
  expect(bubble.left).toBeGreaterThanOrEqual(trigger.right);
});
