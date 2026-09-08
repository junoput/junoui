// The databar recipe (20260908-003) — a row of .juno-readout composed from
// existing layout primitives, not a new component. See docs/layout.md
// "Recipe: a databar" for the write-up this spec backs.
//
// Every assertion here is a RELATIONSHIP, not a value: "these tiles share a
// width" and "this column's x agrees across rows", never "the tile is
// 135px". A value drawn from four specific readouts is a coincidence
// waiting to break the next time someone changes the fixture; the
// relationship is what the recipe actually promises, and it is what a
// consumer copying the recipe is relying on.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const css = readFileSync('dist/css/juno.css', 'utf8');

const readout = (label, value, unit) =>
  `<div class="juno-readout"><span class="juno-readout__label">${label}</span><span class="juno-readout__value">${value}</span><span class="juno-readout__unit">${unit}</span></div>`;

// Deliberately mismatched content width — a databar recipe that only looks
// right with four similarly-sized readouts has not been tested at all.
const ITEMS = [
  readout('CPU', '89.3', '%'),
  readout('REQ/S', '248', 'rps'),
  readout('DISK USED', '2,650', 'GB'),
  readout('UPTIME', '0.02', 'd'),
];

// item[2]'s unit is long enough to wrap onto a second line — the stress case
// for row-height sharing between siblings of very different content height.
const ASYMMETRIC_ITEMS = [
  readout('CPU', '89.3', '%'),
  readout('REQ/S', '248', 'rps'),
  readout('REGION B', '---', 'currently offline for scheduled maintenance'),
  readout('UPTIME', '0.02', 'd'),
];

const page = (containerClass, containerStyle, items) =>
  `<meta name="viewport" content="width=device-width,initial-scale=1">
   <style>${css}</style>
   <div class="${containerClass}" id="bar" style="${containerStyle}">${items.join('')}</div>`;

const measureTiles = (pw) =>
  pw.evaluate(() =>
    [...document.querySelectorAll('.juno-readout')].map((el) => {
      const r = el.getBoundingClientRect();
      const label = el.querySelector('.juno-readout__label').getBoundingClientRect();
      const value = el.querySelector('.juno-readout__value').getBoundingClientRect();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
        labelY: Math.round(label.y),
        valueY: Math.round(value.y),
      };
    }),
  );

// A 280px container at --juno-grid-min:110px forces exactly 2 columns for 4
// items — the smallest layout that has a second row to compare a column
// against, which is the whole point (a single row proves nothing about
// column agreement).
const GRID_STYLE = 'inline-size:280px;--juno-grid-min:110px';

test('grid-auto--tiles: every tile shares one width, regardless of content', async ({
  page: pw,
}) => {
  await pw.setViewportSize({ width: 500, height: 400 });
  await pw.setContent(page('juno-grid-auto juno-grid-auto--tiles', GRID_STYLE, ITEMS));
  const tiles = await measureTiles(pw);
  const widths = new Set(tiles.map((t) => t.w));
  expect(widths.size, `tile widths disagreed: ${[...widths]}`).toBe(1);
});

test('grid-auto--tiles: a column keeps the same x across rows', async ({ page: pw }) => {
  await pw.setViewportSize({ width: 500, height: 400 });
  await pw.setContent(page('juno-grid-auto juno-grid-auto--tiles', GRID_STYLE, ITEMS));
  const tiles = await measureTiles(pw);
  // 4 items at 2 columns → tiles[0]/[2] are column 1, tiles[1]/[3] column 2.
  expect(tiles[2].y, 'fixture assumption: item 2 is on a second row').toBeGreaterThan(tiles[0].y);
  expect(tiles[2].x, 'column 1 x disagreed between rows').toBe(tiles[0].x);
  expect(tiles[3].x, 'column 2 x disagreed between rows').toBe(tiles[1].x);
});

test('grid-auto--tiles: cluster is the counter-example — widths are NOT forced to agree', async ({
  page: pw,
}) => {
  // Not a defect in .juno-cluster — a cluster's job is content-sized
  // packing. This pins the boundary the recipe doc states in prose, so a
  // future change to either primitive that erases the distinction is
  // caught here rather than asserted from memory.
  await pw.setViewportSize({ width: 500, height: 400 });
  await pw.setContent(page('juno-cluster', 'inline-size:280px', ITEMS));
  const tiles = await measureTiles(pw);
  const widths = new Set(tiles.map((t) => t.w));
  expect(widths.size, 'a cluster unexpectedly forced equal tile widths').toBeGreaterThan(1);
});

test('grid-auto--tiles: row-stretch does not move a short tile’s own content', async ({
  page: pw,
}) => {
  await pw.setViewportSize({ width: 500, height: 400 });
  await pw.setContent(page('juno-grid-auto juno-grid-auto--tiles', GRID_STYLE, ASYMMETRIC_ITEMS));
  const tiles = await measureTiles(pw);
  // items[2] (wrapping unit) and items[3] (short) share row 2.
  expect(tiles[3].y, 'fixture assumption: items 2 and 3 share a row').toBe(tiles[2].y);
  expect(tiles[3].h, 'the short tile did not stretch to the row height').toBe(tiles[2].h);
  expect(
    tiles[3].h,
    'stretching did not actually change anything — fixture is not stressing it',
  ).toBeGreaterThan(120);
  // The relationship the recipe promises: baseline holds despite the height
  // difference between what each tile's OWN content would otherwise need.
  expect(tiles[3].labelY, 'label baseline drifted under row-stretch').toBe(tiles[2].labelY);
  expect(tiles[3].valueY, 'value baseline drifted under row-stretch').toBe(tiles[2].valueY);
});

test('reel: readouts stay on one row and the container scrolls instead of wrapping', async ({
  page: pw,
}) => {
  await pw.setViewportSize({ width: 500, height: 400 });
  await pw.setContent(page('juno-reel', 'inline-size:280px', ITEMS));
  const tiles = await measureTiles(pw);
  const rows = new Set(tiles.map((t) => t.y));
  expect(rows.size, 'a reel wrapped instead of staying one row').toBe(1);
  const overflow = await pw.evaluate(() => {
    const bar = document.getElementById('bar');
    return { scrollWidth: bar.scrollWidth, clientWidth: bar.clientWidth };
  });
  expect(
    overflow.scrollWidth,
    'content fit without overflowing — fixture is not stressing the scroll case',
  ).toBeGreaterThan(overflow.clientWidth);
});

test('grid-auto--tiles reflows from the CONTAINER, not the viewport', async ({ page: pw }) => {
  // The container-query claim, made checkable: the same 900px viewport with
  // two different container widths must produce two different column
  // counts, because nothing here is keyed on the viewport at all. Margin is
  // deliberate on both sides: 4 columns at --juno-grid-min:90px plus 3
  // gaps of --juno-gap-content (10px, comfortable density) need 390px
  // minimum, so 200px cannot fit more than 2 and 420px comfortably fits
  // all 4.
  await pw.setViewportSize({ width: 900, height: 400 });
  await pw.setContent(
    page('juno-grid-auto juno-grid-auto--tiles', 'inline-size:200px;--juno-grid-min:90px', ITEMS),
  );
  const narrow = await measureTiles(pw);
  await pw.setContent(
    page('juno-grid-auto juno-grid-auto--tiles', 'inline-size:420px;--juno-grid-min:90px', ITEMS),
  );
  const wide = await measureTiles(pw);
  const oneRow = (tiles) => new Set(tiles.map((t) => t.y)).size === 1;
  expect(oneRow(narrow), 'narrow container: expected 4 items to need more than one row').toBe(
    false,
  );
  expect(oneRow(wide), 'wide container at the SAME viewport: expected 4 items to fit one row').toBe(
    true,
  );
});
