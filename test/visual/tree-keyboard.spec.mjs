// The half of the tree contract a stylesheet and a static scan cannot check:
// keyboard traversal actually moving focus, the roving tabindex actually
// roving, and the touch hit areas actually measuring 44px (X2 / 20260829-022).
//
// A tree without arrow keys is a list of buttons wearing tree roles, and that
// is invisible to every assertion in test/tree.test.mjs — which is why this
// file exists rather than trusting the enhancer because it was written
// carefully.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const css = readFileSync(join(ROOT, 'dist/css/juno.css'), 'utf8');
const enhancer = readFileSync(join(ROOT, 'tools/tree.mjs'), 'utf8');

// Basemap ▾ ├ Satellite · Terrain · Labels ▸ (Place names, Roads) ┤ Measurements
const TREE = `
<ul class="juno-tree" role="tree" aria-label="Scene" id="t">
  <li class="juno-tree__item" role="treeitem" aria-level="1" aria-expanded="true" aria-selected="false" id="basemap">
    <div class="juno-tree__row"><button class="juno-tree__caret" tabindex="-1" aria-hidden="true"></button><span class="juno-tree__label">Basemap</span><button class="juno-tree__handle" aria-label="Reorder Basemap"></button></div>
    <ul class="juno-tree__group" role="group">
      <li class="juno-tree__item" role="treeitem" aria-level="2" aria-selected="false" id="satellite">
        <div class="juno-tree__row"><button class="juno-tree__caret" tabindex="-1" aria-hidden="true"></button><span class="juno-tree__label">Satellite</span></div>
      </li>
      <li class="juno-tree__item" role="treeitem" aria-level="2" aria-expanded="false" aria-selected="false" id="labels">
        <div class="juno-tree__row"><button class="juno-tree__caret" tabindex="-1" aria-hidden="true"></button><span class="juno-tree__label">Labels</span></div>
        <ul class="juno-tree__group" role="group">
          <li class="juno-tree__item" role="treeitem" aria-level="3" aria-selected="false" id="roads">
            <div class="juno-tree__row"><button class="juno-tree__caret" tabindex="-1" aria-hidden="true"></button><span class="juno-tree__label">Roads</span></div>
          </li>
        </ul>
      </li>
    </ul>
  </li>
  <li class="juno-tree__item" role="treeitem" aria-level="1" aria-selected="false" id="measurements">
    <div class="juno-tree__row"><button class="juno-tree__caret" tabindex="-1" aria-hidden="true"></button><span class="juno-tree__label">Measurements</span></div>
  </li>
</ul>`;

async function mount(pw, { coarse = false } = {}) {
  await pw.setContent(
    `<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style>${TREE}
     <script type="module">
       ${enhancer.replace(/^export /gm, '')}
       window.__toggles = [];
       window.__selects = [];
       const root = document.getElementById('t');
       root.addEventListener('juno-tree-toggle', (e) => window.__toggles.push(e.detail.item.id));
       root.addEventListener('juno-tree-select', (e) => window.__selects.push(e.detail.item.id));
       enhanceTree(root);
       // reachable from page scope so the re-enhance test can call it
       window.enhanceTree = enhanceTree;
       window.__ready = true;
     </script>`,
  );
  await pw.waitForFunction(() => window.__ready === true);
  if (coarse) void 0; // the project supplies the pointer type
}

/** Which item currently holds focus. */
const focused = (pw) =>
  pw.evaluate(() => document.activeElement?.closest('[role="treeitem"]')?.id ?? null);

test.describe('keyboard traversal', () => {
  test('exactly one row is tabbable, and it follows focus', async ({ page: pw }) => {
    // The roving tabindex: one Tab stop for the whole tree, not one per node.
    await mount(pw);
    const tabbable = () =>
      pw.evaluate(
        () =>
          [...document.querySelectorAll('.juno-tree__row')].filter((r) => r.tabIndex === 0).length,
      );
    expect(await tabbable()).toBe(1);

    await pw.locator('#satellite > .juno-tree__row').focus();
    expect(await tabbable()).toBe(1);
    expect(await focused(pw)).toBe('satellite');

    // THE POINTER PATH, which keyboard traversal never exercises: a click
    // focuses a row directly without going through the enhancer's own move, so
    // only the focusin handler keeps the invariant. Removing that handler
    // survived every other assertion in this file.
    await pw.locator('#measurements > .juno-tree__row').click();
    expect(await tabbable()).toBe(1);
    expect(await focused(pw)).toBe('measurements');
    expect(
      await pw.evaluate(() => document.querySelector('#measurements > .juno-tree__row').tabIndex),
    ).toBe(0);

    // ...and an arrow key then continues from where the pointer left off,
    // rather than jumping back to wherever focus notionally was.
    await pw.keyboard.press('ArrowUp');
    expect(await focused(pw)).toBe('labels');
  });

  test('down and up walk VISIBLE items across levels', async ({ page: pw }) => {
    // Across levels, and skipping the collapsed subtree — "visible" is the
    // whole subtlety, and a flat querySelectorAll would walk into #roads.
    await mount(pw);
    await pw.locator('#basemap > .juno-tree__row').focus();
    for (const want of ['satellite', 'labels', 'measurements']) {
      await pw.keyboard.press('ArrowDown');
      expect(await focused(pw)).toBe(want);
    }
    // #roads is inside collapsed #labels and must never be reached
    await pw.keyboard.press('ArrowDown');
    expect(await focused(pw)).toBe('measurements');

    for (const want of ['labels', 'satellite', 'basemap']) {
      await pw.keyboard.press('ArrowUp');
      expect(await focused(pw)).toBe(want);
    }
  });

  test('right expands a closed branch, then steps into it', async ({ page: pw }) => {
    await mount(pw);
    await pw.locator('#labels > .juno-tree__row').focus();

    // closed branch → ask to expand, do NOT move
    await pw.keyboard.press('ArrowRight');
    expect(await pw.evaluate(() => window.__toggles)).toEqual(['labels']);
    expect(await focused(pw)).toBe('labels');

    // the app owns the state; once it opens, Right steps in
    await pw.evaluate(() =>
      document.getElementById('labels').setAttribute('aria-expanded', 'true'),
    );
    await pw.keyboard.press('ArrowRight');
    expect(await focused(pw)).toBe('roads');

    // a leaf does nothing — the pattern's answer, not an oversight
    await pw.keyboard.press('ArrowRight');
    expect(await focused(pw)).toBe('roads');
  });

  test('left collapses an open branch, else steps out to the parent', async ({ page: pw }) => {
    await mount(pw);
    await pw.locator('#basemap > .juno-tree__row').focus();
    await pw.keyboard.press('ArrowLeft');
    expect(await pw.evaluate(() => window.__toggles)).toEqual(['basemap']);
    expect(await focused(pw)).toBe('basemap');

    // a leaf steps out — this is what makes a deep tree navigable
    await pw.locator('#satellite > .juno-tree__row').focus();
    await pw.keyboard.press('ArrowLeft');
    expect(await focused(pw)).toBe('basemap');
  });

  test('home and end reach the ends, and enter and space select', async ({ page: pw }) => {
    await mount(pw);
    await pw.locator('#satellite > .juno-tree__row').focus();
    await pw.keyboard.press('End');
    expect(await focused(pw)).toBe('measurements');
    await pw.keyboard.press('Home');
    expect(await focused(pw)).toBe('basemap');

    await pw.keyboard.press('Enter');
    await pw.keyboard.press(' ');
    expect(await pw.evaluate(() => window.__selects)).toEqual(['basemap', 'basemap']);
  });

  test('the enhancer changes no state of its own', async ({ page: pw }) => {
    // Stateless is the claim that keeps this inside junoui's "no stateful
    // widgets" line. It moves focus and asks; it must not expand or select.
    await mount(pw);
    const before = await pw.evaluate(() =>
      [...document.querySelectorAll('[role="treeitem"]')].map(
        (i) => `${i.id}:${i.getAttribute('aria-expanded')}:${i.getAttribute('aria-selected')}`,
      ),
    );
    await pw.locator('#labels > .juno-tree__row').focus();
    for (const k of ['ArrowRight', 'Enter', ' ', 'ArrowLeft', '*']) await pw.keyboard.press(k);
    const after = await pw.evaluate(() =>
      [...document.querySelectorAll('[role="treeitem"]')].map(
        (i) => `${i.id}:${i.getAttribute('aria-expanded')}:${i.getAttribute('aria-selected')}`,
      ),
    );
    expect(after).toEqual(before);
    // ...but it did ask
    expect((await pw.evaluate(() => window.__toggles)).length).toBeGreaterThan(0);
  });

  test('enhancing twice does not double-fire', async ({ page: pw }) => {
    // A framework re-running an effect must not stack listeners; one keypress
    // would then emit two toggles and an app toggling on each would no-op.
    await mount(pw);
    await pw.evaluate(() => enhanceTree(document.getElementById('t')));
    await pw.locator('#labels > .juno-tree__row').focus();
    await pw.keyboard.press('ArrowRight');
    expect(await pw.evaluate(() => window.__toggles)).toEqual(['labels']);
  });
});

test.describe('touch targets', () => {
  test('the row holds the tap floor and the small controls grow only their hit area', async ({
    page: pw,
  }, info) => {
    const coarse = info.project.name === 'chromium-coarse';
    await mount(pw);

    const box = async (sel) =>
      (await pw.locator(sel).first().boundingBox()) ?? { width: 0, height: 0 };
    const row = await box('#basemap > .juno-tree__row');
    expect(Math.round(row.height)).toBeGreaterThanOrEqual(coarse ? 44 : 24);

    // The caret PAINTS small on both pointer types — a 44px painted caret
    // would swallow the row it sits in.
    const caret = await box('#basemap .juno-tree__caret');
    expect(Math.round(caret.width)).toBeLessThanOrEqual(20);

    // ...and on coarse its hit area is grown by a transparent overlay instead.
    const hit = await pw.evaluate(() => {
      const el = document.querySelector('#basemap .juno-tree__caret');
      const before = getComputedStyle(el, '::after');
      if (before.content === 'none') return null;
      const inset = parseFloat(before.top) || 0;
      return Math.round(el.getBoundingClientRect().width - 2 * inset);
    });
    if (coarse) {
      expect(hit, 'no ::after hit area on a coarse pointer').not.toBeNull();
      expect(hit).toBeGreaterThanOrEqual(44);
    } else {
      expect(hit).toBeNull();
    }
  });

  test('only the handle opts out of touch scrolling', async ({ page: pw }) => {
    // Dragging the handle must not scroll; the rest of the row must still pan,
    // or a tree beside a map claims gestures the map needs.
    const ta = async (sel) =>
      pw.evaluate((s) => getComputedStyle(document.querySelector(s)).touchAction, sel);
    await mount(pw);
    expect(await ta('#basemap .juno-tree__handle')).toBe('none');
    expect(await ta('#basemap > .juno-tree__row')).not.toBe('none');
  });
});
