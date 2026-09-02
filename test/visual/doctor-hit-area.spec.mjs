// The doctor's hit-area measurement, driven end to end (20260902-014).
//
// The border box is not the hit area, and the doctor was reading the box. Two
// consequences, and only one of them was noisy:
//
//   NOISE      .juno-splitter is a 1px painted hairline whose ::after is a 44px
//              target overlapping its neighbours. junoui's own doctor reported
//              junoui's own component as a 1px tap target. An audit that cries
//              wolf on a legitimate, common pattern gets muted.
//   DANGEROUS  the mirror: a control sized 44px whose real hit area is shrunk
//              by something on top of it was reported CLEAN.
//
// Driven through a browser because the mechanism is elementFromPoint, and a
// fixture asserting my idea of what it returns would be a test of my idea.
import { expect, test } from '@playwright/test';
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { runDoctor, report } from '../../tools/doctor.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const css = readFileSync(join(ROOT, 'dist/css/juno.css'), 'utf8');

const RAIL = `<nav class="juno-rail juno-rail--responsive"><a class="juno-rail__item" href="#"><span class="juno-icon"></span></a></nav>`;
const DOCK = `<nav class="juno-dock juno-dock--pill juno-dock--responsive"><a class="juno-dock__item" href="#"><span class="juno-dock__bubble"></span></a></nav>`;

function fixture(body) {
  const dir = mkdtempSync(join(tmpdir(), 'juno-hit-'));
  const file = join(dir, 'index.html');
  writeFileSync(
    file,
    `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
     <style>${css}</style>${RAIL}${DOCK}${body}`,
  );
  return pathToFileURL(file).href;
}

const run = (body, profiles = ['phone']) =>
  runDoctor({ url: fixture(body), profiles, allowed: [], json: false }, { chromium });
const findings = async (body) => (await run(body)).results.flatMap((r) => r.findings);

const SPLITTER = `<div style="display:flex;height:200px"><div style="flex:1"></div><div class="juno-splitter" role="separator" tabindex="0" aria-label="Resize" aria-valuenow="1" aria-valuemin="0" aria-valuemax="2"></div><div style="flex:1"></div></div>`;

const range = (lo, hi, attrs = 'data-juno-hit="delegated"') =>
  `<div class="juno-range" ${attrs} role="group" aria-label="R" data-juno-min="0" data-juno-max="100" style="--juno-range-lo:${lo}%;--juno-range-hi:${hi}%">
     <div class="juno-range__track"><div class="juno-range__fill"></div></div>
     <div class="juno-range__thumb juno-range__thumb--lo" role="slider" tabindex="0" aria-label="Min" aria-valuemin="0" aria-valuemax="${hi}" aria-valuenow="${lo}"></div>
     <div class="juno-range__thumb juno-range__thumb--hi" role="slider" tabindex="0" aria-label="Max" aria-valuemin="${lo}" aria-valuemax="100" aria-valuenow="${hi}"></div>
   </div>`;

test('a hit area on a pseudo-element is no longer reported short', async () => {
  // THE filed bug. .juno-splitter's element box is 1px; its ::after is 44px and
  // overlaps its neighbours rather than displacing them, which is deliberate —
  // a 44px gap on desktop would be wrong.
  const f = await findings(SPLITTER);
  expect(f, f.join('\n')).toEqual([]);
});

test('a genuinely short target is still reported', async () => {
  // The control. Without it, a probe that always answers "big enough" passes
  // the test above and reports nothing, ever.
  const f = await findings(
    `<button aria-label="tiny" style="inline-size:20px;block-size:20px">x</button>`,
  );
  expect(f.join(' ')).toMatch(/tap target below the floor: tiny 20x20/);
});

test('a 44px box whose hit area is shrunk IS reported — the dangerous direction', async () => {
  // Previously clean. The centre still resolves to the button, so the occlusion
  // check stays quiet and only the extent can see it.
  const f = await findings(
    `<div style="position:relative;inline-size:300px;block-size:80px">
       <button aria-label="masked" style="position:absolute;inset-block-start:10px;inset-inline-start:10px;inline-size:44px;block-size:44px">x</button>
       <div style="position:absolute;inset-block-start:0;inset-inline-start:44px;inline-size:200px;block-size:80px"></div>
     </div>`,
  );
  expect(f.join(' ')).toMatch(/masked box 44x44, hit \d+x44/);
});

test('the message names both numbers only when they disagree', async () => {
  // "44 wide, hit 12" and "12 wide" need different fixes, so they read
  // differently — but a plain short target should not grow a confusing second
  // measurement that equals the first.
  const plain = await findings(
    `<button aria-label="tiny" style="inline-size:20px;block-size:20px">x</button>`,
  );
  expect(plain.join(' ')).not.toMatch(/box .*, hit/);
});

test('a delegated control is skipped AND counted', async () => {
  // junoui/range's thumbs: at coincident positions one is entirely under the
  // other, and which one a tap grabs is decided by pickThumb from a handler on
  // the host — not by stacking order. Auditing the individual hit area asks a
  // question the component does not answer.
  const out = await run(range(52, 52));
  expect(out.results[0].findings, out.results[0].findings.join('\n')).toEqual([]);
  expect(out.results[0].delegated).toBe(2);
});

test('the delegated count is PRINTED, even on a clean profile', async () => {
  // An opt-out nobody can see is how an audit gets muted. This is the guard
  // against my own escape hatch.
  const out = report(await run(range(52, 52)));
  expect(out.total).toBe(0);
  expect(out.text).toMatch(/2 control\(s\) declared data-juno-hit="delegated" — not audited/);
});

test('without the opt-out, a buried thumb is still reported', async () => {
  // The opt-out has to be load-bearing: if the same markup passes with and
  // without it, the attribute is decoration and the audit was never checking
  // this case at all.
  const f = await findings(range(52, 52, ''));
  expect(f.join(' ')).toMatch(/covered at its centre/);
});
