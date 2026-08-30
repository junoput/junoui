// The gizmo's two claims that need a layout engine (X3 / 20260829-023):
//
//  1. ONE FOCUS STOP with wrapping arrow keys. Eight tab stops for eight
//     compass points is what apps ship and what makes the widget unusable by
//     keyboard — invisible to any static scan.
//  2. THE DERIVED DIAMETER actually keeping the marks apart. The arithmetic is
//     `d >= 8 * tap / pi`; whether that produces non-overlapping 44px targets
//     on a coarse pointer is a question only a laid-out ring can answer.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const css = readFileSync(join(ROOT, 'dist/css/juno.css'), 'utf8');
const enhancer = readFileSync(join(ROOT, 'tools/gizmo.mjs'), 'utf8');

const POINTS = [
  ['N', 0, 'north'],
  ['NE', 45, 'north-east'],
  ['E', 90, 'east'],
  ['SE', 135, 'south-east'],
  ['S', 180, 'south'],
  ['SW', 225, 'south-west'],
  ['W', 270, 'west'],
  ['NW', 315, 'north-west'],
];

const GIZMO = `
<div class="juno-gizmo" role="group" aria-label="View orientation" id="g"
     style="--juno-gizmo-heading:45deg; --juno-gizmo-pitch:35deg;">
  <p class="juno-gizmo__readout" aria-live="polite" id="readout">Facing north-east, 45 degrees. Tilted 35 degrees.</p>
  <div class="juno-gizmo__ring" id="ring">
    <span class="juno-gizmo__needle" aria-hidden="true"></span>
    ${POINTS.map(
      ([ab, deg, name]) =>
        `<button class="juno-gizmo__mark" id="m${deg}" style="--juno-gizmo-at:${deg}deg" aria-label="Face ${name}"${deg === 45 ? ' aria-current="true"' : ''}>${ab}</button>`,
    ).join('')}
    <button class="juno-gizmo__center" id="center" aria-label="Reset view">C</button>
  </div>
  <div class="juno-gizmo__arc"><span class="juno-gizmo__arc-hand" id="hand" aria-hidden="true"></span></div>
</div>`;

async function mount(pw) {
  await pw.setContent(
    `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style>${GIZMO}
     <script type="module">
       ${enhancer.replace(/^export /gm, '')}
       window.enhanceGizmo = enhanceGizmo;
       window.__clicks = [];
       for (const m of document.querySelectorAll('.juno-gizmo__mark'))
         m.addEventListener('click', () => window.__clicks.push(m.id));
       enhanceGizmo(document.getElementById('g'));
       window.__ready = true;
     </script>`,
  );
  await pw.waitForFunction(() => window.__ready === true);
}

const focusedId = (pw) => pw.evaluate(() => document.activeElement?.id ?? null);
const tabbable = (pw) =>
  pw.evaluate(
    () =>
      [...document.querySelectorAll('.juno-gizmo__mark')].filter((m) => m.tabIndex === 0).length,
  );

test.describe('one focus stop', () => {
  test('exactly one mark is tabbable, and it is the current one', async ({ page: pw }) => {
    await mount(pw);
    expect(await tabbable(pw)).toBe(1);
    // seeded from aria-current, not blindly the first: Tab should land on
    // where the camera is, not on north regardless
    expect(await pw.evaluate(() => document.getElementById('m45').tabIndex)).toBe(0);
  });

  test('arrow keys move between marks and WRAP', async ({ page: pw }) => {
    // Wrapping, because a compass ring wraps. Clamping at the ends is slider
    // behaviour and would make west unreachable from north the short way.
    await mount(pw);
    await pw.locator('#m0').focus();
    await pw.keyboard.press('ArrowLeft');
    expect(await focusedId(pw)).toBe('m315');
    await pw.keyboard.press('ArrowRight');
    expect(await focusedId(pw)).toBe('m0');
    await pw.keyboard.press('ArrowUp');
    expect(await focusedId(pw)).toBe('m315');

    await pw.locator('#m315').focus();
    await pw.keyboard.press('ArrowDown');
    expect(await focusedId(pw)).toBe('m0');

    expect(await tabbable(pw)).toBe(1);
  });

  test('home and end reach the ends', async ({ page: pw }) => {
    await mount(pw);
    await pw.locator('#m180').focus();
    await pw.keyboard.press('End');
    expect(await focusedId(pw)).toBe('m315');
    await pw.keyboard.press('Home');
    expect(await focusedId(pw)).toBe('m0');
  });

  test('Enter and Space activate the mark, via the button', async ({ page: pw }) => {
    // Not intercepted: a <button> already activates on both, and
    // reimplementing that is how Space-to-activate gets lost.
    await mount(pw);
    await pw.locator('#m90').focus();
    await pw.keyboard.press('Enter');
    await pw.keyboard.press(' ');
    expect(await pw.evaluate(() => window.__clicks)).toEqual(['m90', 'm90']);
  });

  test('the pointer path keeps the invariant too', async ({ page: pw }) => {
    await mount(pw);
    await pw.locator('#m270').click();
    expect(await tabbable(pw)).toBe(1);
    expect(await pw.evaluate(() => document.getElementById('m270').tabIndex)).toBe(0);
  });

  test('enhancing twice does not double-move', async ({ page: pw }) => {
    await mount(pw);
    await pw.evaluate(() => enhanceGizmo(document.getElementById('g')));
    await pw.locator('#m0').focus();
    await pw.keyboard.press('ArrowRight');
    // one listener → one step. Two → m90.
    expect(await focusedId(pw)).toBe('m45');
  });

  test('the enhancer writes no angle', async ({ page: pw }) => {
    // Stateless: the app owns the camera.
    await mount(pw);
    const before = await pw.evaluate(() => document.getElementById('g').getAttribute('style'));
    await pw.locator('#m0').focus();
    for (const k of ['ArrowRight', 'Enter', ' ', 'Home', 'End']) await pw.keyboard.press(k);
    expect(await pw.evaluate(() => document.getElementById('g').getAttribute('style'))).toBe(
      before,
    );
  });
});

test.describe('the derived diameter keeps the marks apart', () => {
  test('adjacent snap targets do not overlap, at either pointer type', async ({
    page: pw,
  }, info) => {
    const coarse = info.project.name === 'chromium-coarse';
    await mount(pw);

    const boxes = await pw.evaluate(() =>
      [...document.querySelectorAll('.juno-gizmo__mark')].map((m) => {
        const r = m.getBoundingClientRect();
        return { id: m.id, x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
      }),
    );
    expect(boxes.length).toBe(8);

    // every mark is a real tap target
    const floor = coarse ? 44 : 24;
    for (const b of boxes) {
      expect(Math.round(b.w), `${b.id} is ${b.w}px wide`).toBeGreaterThanOrEqual(floor);
      expect(Math.round(b.h)).toBeGreaterThanOrEqual(floor);
    }

    // ...and no two centres are closer than one target, which is the whole
    // point of deriving the diameter rather than picking one
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const d = Math.hypot(boxes[i].x - boxes[j].x, boxes[i].y - boxes[j].y);
        expect(
          d,
          `${boxes[i].id} and ${boxes[j].id} are ${d.toFixed(1)}px apart, under the ${floor}px target`,
        ).toBeGreaterThanOrEqual(floor - 0.5);
      }
    }
  });

  test('the ring grows with the tap floor', async ({ page: pw }, info) => {
    // The claim the derivation makes: a coarse pointer promotes the tap floor
    // and the ring follows. A hard-coded diameter passes on desktop and ships
    // eight overlapping targets to a phone.
    await mount(pw);
    const size = await pw.evaluate(
      () => document.getElementById('ring').getBoundingClientRect().width,
    );
    // d = tap * (1/sin(pi/N) + 1): the chord between adjacent centres, with
    // the marks inset from the rim by half a target. Both simpler forms were
    // measured wrong here first.
    const tap = info.project.name === 'chromium-coarse' ? 44 : 24;
    const want = Math.max(96, tap * (1 / Math.sin(Math.PI / 8) + 1));
    expect(size).toBeGreaterThanOrEqual(want - 1);
  });
});

test('reduced motion collapses the snap transition', async ({ page: pw }) => {
  await pw.emulateMedia({ reducedMotion: 'reduce' });
  await mount(pw);
  const dur = await pw.evaluate(
    () => getComputedStyle(document.querySelector('.juno-gizmo__needle')).transitionDuration,
  );
  expect(parseFloat(dur)).toBeLessThan(0.05);
});
