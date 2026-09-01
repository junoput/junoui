// The doctor, run end to end against pages built to contain known defects
// (conformance kit slice 6, 20260826-036 item F).
//
// The unit tests feed its checks fixtures. This drives the whole thing through
// a browser, because the interesting failure is not a wrong predicate — it is
// a probe that collects nothing and reports a clean page. An instrument is
// tested before it is read, and "0 findings" is exactly the output that looks
// like success when the probe is inert.
import { expect, test } from '@playwright/test';
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { runDoctor, report } from '../../tools/doctor.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const css = readFileSync(join(ROOT, 'dist/css/juno.css'), 'utf8');

/** Write a page to disk and return a file:// URL — no server needed. */
function fixture(body) {
  const dir = mkdtempSync(join(tmpdir(), 'juno-doctor-'));
  const file = join(dir, 'index.html');
  writeFileSync(
    file,
    `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
     <style>${css}</style>${body}`,
  );
  return pathToFileURL(file).href;
}

const RAIL = `<nav class="juno-rail juno-rail--responsive"><a class="juno-rail__item" href="#"><span class="juno-icon"></span></a></nav>`;
const DOCK = (cls) =>
  `<nav class="juno-dock juno-dock--pill ${cls}"><a class="juno-dock__item" href="#"><span class="juno-dock__bubble"></span></a></nav>`;

const run = (url, profiles) => runDoctor({ url, profiles, allowed: [], json: false }, { chromium });

test('a conformant page reports no findings', async () => {
  // The control. Without it a doctor that always fires proves nothing either.
  const url = fixture(RAIL + DOCK('juno-dock--responsive'));
  const out = await run(url, ['phone', 'phone-landscape', 'desktop']);
  const findings = out.results.flatMap((r) => r.findings);
  expect(findings, findings.join('\n')).toEqual([]);
});

test('it finds the landscape-phone navigation hole', async () => {
  // The real defect: a responsive rail paired with the width-only helper. It
  // is CORRECT on a portrait phone and on desktop, which is why it shipped.
  const url = fixture(RAIL + DOCK('juno-hide-from-md'));
  const out = await run(url, ['phone', 'phone-landscape', 'desktop']);

  const landscape = out.results.find((r) => r.profile === 'phone-landscape');
  expect(landscape.findings.join(' ')).toMatch(/no primary navigation/);

  // ...and it is quiet on the profiles where the pairing genuinely works,
  // which is what makes the finding worth acting on rather than noise.
  for (const p of ['phone', 'desktop']) {
    const r = out.results.find((x) => x.profile === p);
    expect(r.findings, `${p}: ${r.findings.join(' ')}`).toEqual([]);
  }
});

test('it finds a short tap target on the profile that has one', async () => {
  // 32px is the pagination defect's height. On a fine pointer the floor is 24
  // and the same element is fine — the doctor has to judge per profile or it
  // becomes noise on desktop and nobody runs it.
  const url = fixture(
    RAIL +
      DOCK('juno-dock--responsive') +
      `<button style="inline-size:32px;block-size:32px" aria-label="tiny">x</button>`,
  );
  const out = await run(url, ['phone', 'desktop']);
  expect(out.results.find((r) => r.profile === 'phone').findings.join(' ')).toMatch(
    /tap target below the floor: tiny 32x32/,
  );
  expect(out.results.find((r) => r.profile === 'desktop').findings).toEqual([]);
});

test('it finds a class junoui does not define', async () => {
  const url = fixture(RAIL + DOCK('juno-dock--responsive') + `<div class="juno-modal-body"></div>`);
  const out = await run(url, ['desktop']);
  expect(out.results[0].findings.join(' ')).toMatch(
    /class junoui does not define: juno-modal-body/,
  );
});

test('it finds a page that scrolls sideways', async () => {
  const url = fixture(
    RAIL + DOCK('juno-dock--responsive') + `<div style="inline-size:3000px;block-size:10px"></div>`,
  );
  const out = await run(url, ['phone']);
  expect(out.results[0].findings.join(' ')).toMatch(/scrolls horizontally/);
});

test('the report names its limits even when the page is clean', async () => {
  // The output a consumer reads on a good day still has to say what was not
  // looked at, or it is a clean bill of health for WebKit and safe areas —
  // neither of which it touched.
  const url = fixture(RAIL + DOCK('juno-dock--responsive'));
  const out = report(await run(url, ['desktop']));
  expect(out.total).toBe(0);
  expect(out.text).toMatch(/NOT COVERED BY THIS RUN/);
  expect(out.text).toMatch(/WebKit/);
  expect(out.text).toMatch(/env\(\)/);
});
