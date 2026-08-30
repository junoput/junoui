// The splitter's two measurable claims (X9 / 20260829-029): the hit area is
// tap-sized while the line stays a hairline, and the keyboard model moves the
// value the ARIA pattern says it should.
//
// Neither is visible to a source scan. A 1px separator that reports a 44px
// hit area in CSS but lays out at 1px is the defect this component exists to
// prevent, and it looks identical in the stylesheet.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const css = readFileSync(join(ROOT, 'dist/css/juno.css'), 'utf8');
const enhancer = readFileSync(join(ROOT, 'tools/splitter.mjs'), 'utf8');

const page = (orientation = 'vertical') => `
<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}
  #panes { display: flex; ${orientation === 'horizontal' ? 'flex-direction: column;' : ''} inline-size: 320px; block-size: 320px; }
  #a { flex: 0 0 160px; background: #333; } #b { flex: 1; background: #555; }
</style>
<div id="panes">
  <div id="a"></div>
  <div class="juno-splitter" id="s" role="separator" tabindex="0"
       aria-orientation="${orientation}" aria-label="Resize panel"
       aria-valuenow="160" aria-valuemin="80" aria-valuemax="240"></div>
  <div id="b"></div>
</div>
<script type="module">
  ${enhancer.replace(/^export /gm, '')}
  window.__moves = []; window.__collapses = [];
  const s = document.getElementById('s');
  s.addEventListener('juno-splitter-move', (e) => window.__moves.push(e.detail.value));
  s.addEventListener('juno-splitter-collapse', (e) => window.__collapses.push(e.detail.value));
  enhanceSplitter(s, { step: 16 });
  window.__ready = true;
</script>`;

async function mount(pw, orientation) {
  await pw.setContent(page(orientation));
  await pw.waitForFunction(() => window.__ready === true);
}

test.describe('the hit area', () => {
  test('is tap-sized while the line stays a hairline', async ({ page: pw }, info) => {
    const floor = info.project.name === 'chromium-coarse' ? 44 : 24;
    await mount(pw, 'vertical');
    const m = await pw.evaluate(() => {
      const s = document.getElementById('s');
      const box = s.getBoundingClientRect();
      const px = (el, pseudo, prop) => parseFloat(getComputedStyle(el, pseudo)[prop]);
      return {
        laidOut: +box.width.toFixed(2),
        line: px(s, '::before', 'width'),
        hit: px(s, '::after', 'width'),
      };
    });
    // the separator itself occupies only the hairline in the flex layout...
    expect(m.laidOut).toBeLessThanOrEqual(2);
    expect(m.line).toBeLessThanOrEqual(2);
    // ...while the thing a finger can land on is a real target
    expect(m.hit, `hit area is ${m.hit}px`).toBeGreaterThanOrEqual(floor);
  });

  test('does not push the panes apart', async ({ page: pw }) => {
    // The whole point of overlapping rather than occupying: a consumer that
    // laid out a 44px gap to hold the handle would have that gap on desktop.
    await mount(pw, 'vertical');
    const gap = await pw.evaluate(() => {
      const a = document.getElementById('a').getBoundingClientRect();
      const b = document.getElementById('b').getBoundingClientRect();
      return +(b.left - a.right).toFixed(2);
    });
    expect(gap).toBeLessThanOrEqual(2);
  });

  test('grows with the tap floor on a coarse pointer', async ({ page: pw }, info) => {
    await mount(pw, 'vertical');
    const hit = await pw.evaluate(() =>
      parseFloat(getComputedStyle(document.getElementById('s'), '::after').width),
    );
    expect(hit).toBe(info.project.name === 'chromium-coarse' ? 44 : 24);
  });
});

test.describe('the keyboard model', () => {
  const moves = (pw) => pw.evaluate(() => window.__moves);

  test('a vertical separator moves on the horizontal arrows only', async ({ page: pw }) => {
    // The axis names the separator, not the motion.
    await mount(pw, 'vertical');
    await pw.locator('#s').focus();
    await pw.keyboard.press('ArrowRight');
    await pw.keyboard.press('ArrowLeft');
    expect(await moves(pw)).toEqual([176, 144]);
    await pw.keyboard.press('ArrowUp');
    await pw.keyboard.press('ArrowDown');
    expect(await moves(pw)).toEqual([176, 144]);
  });

  test('a horizontal separator moves on the vertical arrows only', async ({ page: pw }) => {
    await mount(pw, 'horizontal');
    await pw.locator('#s').focus();
    await pw.keyboard.press('ArrowDown');
    expect(await moves(pw)).toEqual([176]);
    await pw.keyboard.press('ArrowRight');
    expect(await moves(pw)).toEqual([176]);
  });

  test('Home and End reach the declared extremes', async ({ page: pw }) => {
    await mount(pw, 'vertical');
    await pw.locator('#s').focus();
    await pw.keyboard.press('Home');
    await pw.keyboard.press('End');
    expect(await moves(pw)).toEqual([80, 240]);
  });

  test('Enter asks for a collapse, which is not a move to the minimum', async ({ page: pw }) => {
    // Two different questions: "put this pane away" survives a later resize,
    // and an app restoring the previous width needs to know which happened.
    await mount(pw, 'vertical');
    await pw.locator('#s').focus();
    await pw.keyboard.press('Enter');
    expect(await pw.evaluate(() => window.__collapses)).toEqual([160]);
    expect(await moves(pw)).toEqual([]);
  });

  test('the enhancer never writes the position it is asked about', async ({ page: pw }) => {
    // Stateless: whether the pane can actually be that wide is the app's
    // question, so the attribute stays the app's to set.
    await mount(pw, 'vertical');
    await pw.locator('#s').focus();
    for (const k of ['ArrowRight', 'ArrowRight', 'Home', 'End', 'Enter'])
      await pw.keyboard.press(k);
    expect(
      await pw.evaluate(() => document.getElementById('s').getAttribute('aria-valuenow')),
    ).toBe('160');
    // ...and every request it made was inside the declared range
    const all = await moves(pw);
    expect(Math.min(...all)).toBeGreaterThanOrEqual(80);
    expect(Math.max(...all)).toBeLessThanOrEqual(240);
  });

  test('a disabled separator ignores the keyboard', async ({ page: pw }) => {
    await mount(pw, 'vertical');
    await pw.evaluate(() => document.getElementById('s').setAttribute('aria-disabled', 'true'));
    await pw.locator('#s').focus();
    await pw.keyboard.press('ArrowRight');
    expect(await moves(pw)).toEqual([]);
  });

  test('an unapplicable arrow is left to the page', async ({ page: pw }) => {
    // preventDefault only where the key applies, so a Down arrow on a vertical
    // splitter still scrolls rather than being silently swallowed.
    await mount(pw, 'vertical');
    await pw.locator('#s').focus();
    const prevented = await pw.evaluate(async () => {
      let defaultPrevented = null;
      document.addEventListener(
        'keydown',
        (e) => {
          defaultPrevented = e.defaultPrevented;
        },
        { capture: false },
      );
      document
        .getElementById('s')
        .dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
        );
      return defaultPrevented;
    });
    expect(prevented).toBe(false);
  });
});
