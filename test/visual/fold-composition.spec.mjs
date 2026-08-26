// .juno-fold's promise is that its inline-size folds to ZERO. Composed with a
// component class — which is the canonical use, since that is where the capsule
// chrome lives — it could not, and this file is the measurement that says so.
//
// The defect (20260826-002, reported by nexora against a real pill): three
// independent inputs, each of which floors a border-box inline size, and none
// of which the fold released.
//
//   1. min-inline-size (.juno-pillbar__item's 44px tap target). A min-* floor
//      clamps the USED value whichever rule won the cascade, so `inline-size: 0`
//      never takes effect.
//   2. padding-inline (10px each side). A border-box width cannot resolve below
//      its own padding, so releasing the floor alone stops at 20px.
//   3. border-inline-width (.juno-btn / .juno-chip ship a 1px border). Same
//      arithmetic, one more term.
//
// And a fourth, found while measuring this one and invisible from the source:
// `transition` is a shorthand, .juno-fold was (0,1,0), and pillbar.css sorts
// AFTER fold-slot.css in the bundle — so .juno-pillbar__item's own
// `transition: color, background-color` REPLACED the fold's whole list. The
// fold had no transition at all when composed; it jumped shut. Nothing in the
// source of either file is wrong on its own, which is why this is asserted as a
// resolved value against the built bundle rather than as declaration text.
//
// Built bundle, not src: the bundle is the artifact where both rules land in one
// sheet in their real order, which is the entire subject here.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BUNDLE = join(dirname(dirname(dirname(fileURLToPath(import.meta.url)))), 'dist/css/juno.css');
const css = readFileSync(BUNDLE, 'utf8');

// The three releases, as they appear in the folded rule. The control case below
// strips them to prove this file can register the defect, and every strip is
// scoped to the fold's own block first: `min-inline-size: 0` and
// `padding-inline: 0` each appear EARLIER in the bundle on unrelated components
// (.juno-dock, .juno-pillbar__input), so a bundle-wide replace silently mutates
// the wrong rule and reports the fold as still floored. That is not
// hypothetical — it is what the first run of this control did, and catching it
// is the reason the control exists.
const FOLDED_SELECTOR = '.juno-fold:not([data-juno-in]) {';
const RELEASES = ['min-inline-size: 0;', 'padding-inline: 0;', 'border-inline-width: 0;'];

// The folded rule's block. lastIndexOf, not a regex over the selector: the same
// selector also appears as the second half of the BASE rule's selector list
// (both branches of data-juno-in, so the base applies always — see
// fold-slot.css), and matching that one instead mutates the transition list
// while reporting success. The `visibility: hidden` check below is what says
// which of the two we got.
function foldedRule() {
  const start = css.lastIndexOf(FOLDED_SELECTOR);
  expect(start, 'the folded rule is in the bundle where this file expects it').toBeGreaterThan(-1);
  const block = css.slice(start, css.indexOf('}', start) + 1);
  expect(block, 'this is the folded rule, not the base rule').toContain('visibility: hidden;');
  return block;
}

// Strip one (or all) of the releases from the folded rule ONLY, and assert the
// stylesheet actually moved — a regex that stops matching must fail loudly here
// rather than hand a pristine sheet to a control expecting a defect.
function without(...decls) {
  const rule = foldedRule();
  let mutated = rule;
  for (const d of decls) {
    expect(mutated).toContain(d);
    mutated = mutated.replace(d, '');
  }
  expect(mutated).not.toBe(rule);
  return css.replace(rule, mutated);
}

// --juno-fold-size defaults to size.tap.comfortable (44px) and does not move
// with pointer type — base.css flips size.tap.MIN under (pointer: coarse), not
// this one — so both projects expect the same open width.
const OPEN = 44;

// Every composed case is a junoui class that floors an inline size, with the
// term it contributes. `row` is the container the canonical use puts it in.
const CASES = [
  {
    name: '.juno-pillbar__item',
    cls: 'juno-pillbar__item',
    row: 'juno-pillbar',
  },
  {
    name: '.juno-btn',
    cls: 'juno-btn',
    row: '',
  },
  {
    name: '.juno-chip',
    cls: 'juno-chip',
    row: '',
  },
];

const markup = (c) => `
  <div class="${c.row}" id="row" ${c.row ? '' : 'style="display:flex;align-items:center"'}>
    <button class="juno-fold ${c.cls}" id="f" aria-label="Scroll to top"><span class="juno-icon"></span></button>
    <button class="${c.cls}" id="other" aria-label="Filter"><span class="juno-icon"></span></button>
  </div>`;

const slotWidth = (pw) =>
  pw.evaluate(() => +document.getElementById('f').getBoundingClientRect().width.toFixed(2));

for (const c of CASES) {
  test(`the folded slot reaches zero composed with ${c.name}`, async ({ page: pw }) => {
    await pw.setContent(`<style>${css}</style>${markup(c)}`);

    // folded (no data-juno-in) — the whole point
    expect(await slotWidth(pw)).toBe(0);

    // present — the capsule chrome must survive, so this is not "zero always"
    await pw.evaluate(() => document.getElementById('f').setAttribute('data-juno-in', ''));
    await pw.waitForTimeout(600); // longer than --juno-motion-duration-base
    expect(await slotWidth(pw)).toBe(OPEN);
    const chrome = await pw.evaluate(() => {
      const cs = getComputedStyle(document.getElementById('f'));
      return {
        pad: cs.paddingInlineStart,
        minInline: cs.minInlineSize,
        border: cs.borderInlineStartWidth,
      };
    });
    const want = await pw.evaluate(() => {
      const cs = getComputedStyle(document.getElementById('other'));
      return {
        pad: cs.paddingInlineStart,
        minInline: cs.minInlineSize,
        border: cs.borderInlineStartWidth,
      };
    });
    // asserted against a SIBLING wearing the same component class, not against
    // remembered numbers: if the component retunes its padding, this follows.
    expect(chrome).toEqual(want);
  });

  test(`the fold owns its transition composed with ${c.name}`, async ({ page: pw }) => {
    await pw.setContent(`<style>${css}</style>${markup(c)}`);
    // The resolved list, not the declaration text: two rules set `transition`
    // here and the shorthand replaces rather than merges.
    const props = await pw.evaluate(() =>
      getComputedStyle(document.getElementById('f'))
        .transitionProperty.split(',')
        .map((p) => p.trim()),
    );
    // the geometry the fold animates, including the two floors it releases —
    // released without being transitioned, min-inline-size snaps the slot to
    // the capsule's tap floor the instant data-juno-in returns, and padding
    // jumps the content sideways as the fold starts
    for (const p of [
      'inline-size',
      'min-inline-size',
      'padding',
      'margin',
      'opacity',
      'visibility',
    ]) {
      expect(props).toContain(p);
    }
    // owning `transition` means owning all of it: the capsule's own chrome fade
    // is in the fold's list, or composing costs the component its hover
    for (const p of ['color', 'background-color']) {
      expect(props).toContain(p);
    }

    // The properties are not merely listed — they are running transitions when
    // the state flips. getAnimations() is the engine's own answer and needs no
    // timing; it names PHYSICAL longhands, which is the stronger reading: it
    // says the logical declarations resolved to boxes that actually animate.
    await pw.evaluate(() => document.getElementById('f').setAttribute('data-juno-in', ''));
    const running = await pw.evaluate(() =>
      document
        .getElementById('f')
        .getAnimations()
        .map((a) => a.transitionProperty),
    );
    for (const p of ['width', 'padding-left', 'padding-right', 'opacity', 'visibility']) {
      expect(running).toContain(p);
    }
    // min-width only where the composed class actually floors one — .juno-btn
    // and .juno-chip do not, and 0 -> auto is not an interpolable pair, so the
    // expectation is read off the sibling rather than tabulated here.
    const floored = await pw.evaluate(
      () => getComputedStyle(document.getElementById('other')).minInlineSize !== 'auto',
    );
    expect(running.includes('min-width')).toBe(floored);
  });
}

// ── Control. The instrument must be shown to register the defect. ───────────
// Without this, every assertion above is equally satisfied by a fold that never
// had a floor to release — and by a stylesheet this file failed to find.
test('the measurement registers the floors when they are not released', async ({ page: pw }) => {
  const c = CASES[0];
  await pw.setContent(`<style>${without(...RELEASES)}</style>${markup(c)}`);
  // 44 = .juno-pillbar__item's tap floor: the dead slot the operator saw
  expect(await slotWidth(pw)).toBe(44);

  // and each floor's own contribution, so a single release going missing is
  // distinguishable from all three
  await pw.setContent(`<style>${without(RELEASES[0])}</style>${markup(c)}`);
  expect(await slotWidth(pw)).toBe(44); // the tap floor alone holds it open

  await pw.setContent(`<style>${without(RELEASES[1])}</style>${markup(c)}`);
  expect(await slotWidth(pw)).toBe(20); // the padding alone: 2 x --juno-space-10
});

// The consumer-visible number: the row closes by the whole slot, not by a gap.
test('the pill closes by the width of the slot it folded away', async ({ page: pw }) => {
  await pw.setContent(`<style>${css}</style>${markup(CASES[0])}`);
  const rowWidth = () =>
    pw.evaluate(() => document.getElementById('row').getBoundingClientRect().width);
  const folded = await rowWidth();
  await pw.evaluate(() => document.getElementById('f').setAttribute('data-juno-in', ''));
  await pw.waitForTimeout(600);
  // --juno-fold-gap is unset here, so the row's own gap stays behind the folded
  // slot and the difference is exactly the slot: the 44px the pill was carrying
  // dead. (Before the fix it was 0 — the slot never moved.)
  expect((await rowWidth()) - folded).toBe(OPEN);
});

// ...and with --juno-fold-gap named, the fold swallows the row's gap too, which
// is the other half of the contract and is what makes the row close COMPLETELY.
test('naming --juno-fold-gap closes the row by the slot and its gap', async ({ page: pw }) => {
  const c = CASES[0];
  await pw.setContent(
    `<style>${css}</style>${markup(c)}<style>#f{--juno-fold-gap:var(--juno-pillbar-gap)}</style>`,
  );
  const rowWidth = () =>
    pw.evaluate(() => document.getElementById('row').getBoundingClientRect().width);
  const gap = await pw.evaluate(
    () => parseFloat(getComputedStyle(document.getElementById('row')).columnGap) || 0,
  );
  expect(gap).toBeGreaterThan(0);
  const folded = await rowWidth();
  await pw.evaluate(() => document.getElementById('f').setAttribute('data-juno-in', ''));
  await pw.waitForTimeout(600);
  expect((await rowWidth()) - folded).toBe(OPEN + gap);
});
