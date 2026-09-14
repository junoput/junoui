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

test('the doc still carries the claim this file pins', async () => {
  // The other direction. If someone rewrites that section without touching the
  // CSS, these assertions keep passing while documenting nothing — the exception
  // and the claim have to move together.
  expect(DOC, 'safe-area.md no longer names the ticket').toMatch(/20260914-072/);
  expect(DOC, 'safe-area.md no longer states the anchored-surface gap').toMatch(
    /ANCHORED SURFACES ARE ABSENT FROM THIS TABLE/,
  );
});
